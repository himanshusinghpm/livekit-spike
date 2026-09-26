import { NextResponse } from "next/server";
import "is-plain-object";
import { addExtra } from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// Deterministic binding — explicit puppeteerCore pass-through
const puppeteer = addExtra(puppeteerCore as unknown as Parameters<typeof addExtra>[0]);
puppeteer.use(StealthPlugin());

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36";

type Probe = {
  ok: boolean;
  status?: number;
  content_type?: string | null;
  server?: string | null;
  cf_ray?: string | null;
  cf_mitigated?: string | null;
  body_snippet?: string;
  parsed?: unknown;
  error?: string;
};

/** Control probe: plain HTTP fetch without browser. Tests raw egress IP/headers. */
async function probeFetch(url: string): Promise<Probe> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
      },
      redirect: "follow",
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }
    return {
      ok: res.ok && parsed !== undefined,
      status: res.status,
      content_type: res.headers.get("content-type"),
      server: res.headers.get("server"),
      cf_ray: res.headers.get("cf-ray"),
      cf_mitigated: res.headers.get("cf-mitigated"),
      body_snippet: text.slice(0, 300),
      parsed,
    };
  } catch (e: unknown) {
    return { ok: false, error: `fetch: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/** Browser probe: puppeteer-core + @sparticuz/chromium + stealth plugin. */
async function probeBrowser(url: string): Promise<Probe> {
  let browser;
  try {
    chromium.setGraphicsMode = false;
    const executablePath = await chromium.executablePath();

    browser = await (puppeteer as unknown as typeof puppeteerCore).launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath || undefined,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent(UA);
    const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const text = await page.evaluate(() => document.body.innerText);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = undefined;
    }

    const headers = res ? res.headers() : {};

    return {
      ok: !!res && res.status() < 400 && parsed !== undefined,
      status: res ? res.status() : undefined,
      content_type: headers["content-type"] ?? null,
      server: headers["server"] ?? null,
      cf_mitigated: headers["cf-mitigated"] ?? null,
      body_snippet: text.slice(0, 300),
      parsed,
    };
  } catch (e: unknown) {
    return { ok: false, error: `browser: ${e instanceof Error ? e.message : String(e)}` };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}

async function egressIp() {
  try {
    const r = await fetch("https://ipinfo.io/json");
    const j = (await r.json()) as { ip?: string; org?: string; city?: string; region?: string };
    return { ip: j.ip, org: j.org, city: j.city, region: j.region };
  } catch {
    return null;
  }
}

function interpret(control: Probe, browser: Probe) {
  if (control.ok && browser.ok) return "WAF_PASSES — datacenter IP is fine; browser is NOT needed";
  if (!control.ok && browser.ok) return "WAF_BLOCKS_PLAIN_CLIENTS — browser/stealth gets through";
  if (!control.ok && !browser.ok) return "WAF_BLOCKS_IP — blocked at IP level; browser will not help";
  return "BROWSER_SETUP_PROBLEM — WAF is fine, Chromium failed (check message)";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Optional shared secret for abuse protection
  const secret = process.env.TEST_SECRET;
  if (secret && searchParams.get("key") !== secret) {
    return NextResponse.json({ status: "UNAUTHORIZED" }, { status: 401 });
  }

  const slug = searchParams.get("slug") || "deenthegreat";
  const videoId = searchParams.get("videoId") || "G8j3KmCJRpk";
  const target = `https://kick.com/api/v2/channels/${slug}`;

  // Optional YouTube API stats query if API key is configured or requested
  const ytKey = process.env.YOUTUBE_API_KEY || searchParams.get("ytKey");
  let youtube_ccv: number | null = null;
  if (ytKey && videoId) {
    try {
      const ytRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${ytKey}`
      );
      const ytData = (await ytRes.json()) as {
        items?: Array<{ liveStreamingDetails?: { concurrentViewers?: string } }>;
      };
      if (ytData.items && ytData.items.length > 0 && ytData.items[0].liveStreamingDetails) {
        const viewers = ytData.items[0].liveStreamingDetails.concurrentViewers;
        youtube_ccv = viewers ? parseInt(viewers, 10) : 0;
      }
    } catch {
      youtube_ccv = null;
    }
  }

  const [egress, control] = await Promise.all([egressIp(), probeFetch(target)]);
  const browser = await probeBrowser(target);

  const parsedChannel = (browser.parsed || control.parsed) as Record<string, unknown> | undefined;
  const livestream = parsedChannel?.livestream as { viewer_count?: number } | undefined;
  const kick_ccv = livestream?.viewer_count ?? null;

  return NextResponse.json({
    target,
    slug,
    videoId,
    egress,
    control_fetch: control,
    stealth_browser: browser,
    verdict: interpret(control, browser),
    kick_ccv,
    youtube_ccv,
    is_live: !!livestream,
  });
}
