import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | LiveKit',
  description: 'LiveKit Privacy Policy — what we collect and why.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-zinc-300">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">← Back to home</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: September 30, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-base font-semibold text-white">1. What We Collect</h2>
            <p className="mt-2">The LiveKit extension only activates during an active Sync Code session. We exclusively capture Concurrent Viewership (CCV) and total stream duration. We do not collect, read, or store session cookies, passwords, PII, or general browsing history. Data is shared exclusively with the entity authorized by the creator&apos;s Sync Code.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. How We Use Data</h2>
            <p className="mt-2">Telemetry is used solely to power campaign dashboards, retention charts, and sponsor reports for the authorized agency and creator.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Sharing</h2>
            <p className="mt-2">We do not sell personal data. Telemetry is shared exclusively with the entity authorized by the creator&apos;s Sync Code, plus infrastructure subprocessors (e.g., hosting, database) under contractual safeguards.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Retention &amp; Security</h2>
            <p className="mt-2">Stream telemetry is retained for active campaign reporting and deleted or anonymized on request. We apply industry-standard access controls and encryption in transit.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">5. Your Rights &amp; Contact</h2>
            <p className="mt-2">To request access, correction, or deletion, contact <a href="mailto:support.livekit@gmail.com" className="text-orange-400 hover:text-orange-300">support.livekit@gmail.com</a>. We respond to verified requests within 30 days.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
