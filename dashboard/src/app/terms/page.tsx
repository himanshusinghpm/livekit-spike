import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | LiveKit',
  description: 'LiveKit Terms of Service — B2B analytics platform terms.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-zinc-300">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">← Back to home</Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: September 30, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-base font-semibold text-white">1. The Service</h2>
            <p className="mt-2">LiveKit provides professional analytics tooling for creators and agencies, including stream telemetry capture, campaign dashboards, and sponsor reporting features.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. Independent Tool; No Platform Affiliation</h2>
            <p className="mt-2">LiveKit is an independent professional analytics tool. We are not affiliated with, endorsed by, or legally connected to YouTube, Google LLC, Kick, or their parent companies. The LiveKit extension reads client-side data strictly with the explicit consent of the authenticated user. LiveKit cannot be held liable for account penalties, API rate limits, or service degradation enforced by third-party streaming platforms. LiveKit is a B2B platform; all payments, tax calculations, and compliance are managed by our designated Merchant of Record.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Accounts &amp; Acceptable Use</h2>
            <p className="mt-2">You agree to use LiveKit only for lawful business purposes, to provide accurate account information, and not to misuse, reverse-engineer, or disrupt the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Billing</h2>
            <p className="mt-2">LiveKit is billed on a prepaid, recurring monthly basis as a B2B subscription. All payments, tax calculations, and compliance are managed by our designated Merchant of Record. See our Refund Policy for cancellation terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">5. Limitation of Liability</h2>
            <p className="mt-2">To the maximum extent permitted by law, LiveKit shall not be liable for indirect, incidental, or consequential damages, including actions taken by third-party platforms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">6. Contact</h2>
            <p className="mt-2">Questions about these terms: <a href="mailto:support.livekit@gmail.com" className="text-orange-400 hover:text-orange-300">support.livekit@gmail.com</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
