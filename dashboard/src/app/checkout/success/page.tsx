import Link from 'next/link';
import { Check, Mail } from 'lucide-react';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; lead_id?: string }>;
}) {
  const params = await searchParams;
  // Ensure we extract a single string even if Next.js parses an array
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = (rawEmail || "").trim();
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-white">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111114] p-8 text-center shadow-2xl sm:p-10">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10">
        <Check className="size-7 text-emerald-400" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">
        Account Activated
      </h1>
      {email ? (
        <div className="mt-4 rounded-xl border border-indigo-400/25 bg-indigo-400/[0.08] px-4 py-3.5">
          <p className="flex items-center justify-center gap-2 text-xs font-medium text-indigo-200">
            <Mail className="size-3.5" aria-hidden="true" />
            Your 14-day trial is securely provisioned. We have emailed your secure dashboard access link to:
          </p>
          <p className="mt-1.5 break-all font-mono text-sm font-semibold text-white">
            {email}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-white/60">
          Your 14-day trial is securely provisioned. We have emailed the
          secure Sync-Code and dashboard access instructions to the primary
          agency contact.
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-white/35">
        Billing receipts have been sent to the payment email via Dodo
        Payments.
      </p>
      <Link
        href="/"
        className="mt-8 flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-indigo-400"
      >
        Return to Homepage
      </Link>
      </div>
    </main>
  );
}
