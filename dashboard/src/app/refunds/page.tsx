import Link from 'next/link';

export const metadata = {
  title: 'Refund Policy | LiveKit',
  description: 'LiveKit Refund Policy — prepaid B2B subscription terms.',
};

export default function RefundsPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-zinc-300">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">← Back to home</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">Refund Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: September 30, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-base font-semibold text-white">1. Prepaid B2B Subscriptions</h2>
            <p className="mt-2">LiveKit is Business-to-Business (B2B) and professional software billed on a prepaid, recurring monthly basis. Subscriptions can be canceled at any time. We do not offer refunds, account credits, or prorated billing for partially used months.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. Cancellation</h2>
            <p className="mt-2">You may cancel at any time from your billing portal or by contacting support. Cancellation stops future renewals; your workspace remains active until the end of the current prepaid period.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Billing Errors</h2>
            <p className="mt-2">If you believe you were charged in error (e.g., duplicate charge), contact us within 30 days at <a href="mailto:support.livekit@gmail.com" className="text-orange-400 hover:text-orange-300">support.livekit@gmail.com</a> and our Merchant of Record will review the case.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Contact</h2>
            <p className="mt-2">Billing support: <a href="mailto:support.livekit@gmail.com" className="text-orange-400 hover:text-orange-300">support.livekit@gmail.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
