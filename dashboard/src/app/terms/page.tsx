import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | LiveKit',
  description: 'LiveKit Terms of Service — B2B analytics platform terms.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] text-zinc-300">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">
          ← Back to home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: October 3, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-7">
          <section>
            <h2 className="text-base font-semibold text-white">1. The Service</h2>
            <p className="mt-2">
              LiveKit provides professional analytics tooling for creators and agencies, including stream telemetry capture, campaign dashboards, and sponsor reporting features.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">2. &quot;As-Is&quot; Service &amp; SLA Disclaimer</h2>
            <p className="mt-2">
              The LiveKit telemetry service is provided strictly on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. LiveKit operates as a best-effort reporting utility reliant upon the public frontends and APIs of third-party platforms (including but not limited to YouTube and Kick). LiveKit explicitly disclaims all liability for data loss, tracking interruptions, or campaign reporting failures caused by third-party DOM structure changes, API deprecations, rate limiting, platform outages, or localized browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">3. Platform Compliance &amp; Indemnification Shield</h2>
            <p className="mt-2">
              LiveKit is an independent tool not affiliated with or endorsed by YouTube, Google LLC, Kick, or their parent entities. LiveKit is a distributed software utility executed locally on the end-user&apos;s hardware. By utilizing LiveKit, the Agency and its authorized Creators assume all legal and operational risks associated with compliance with the Terms of Service of third-party platforms. You agree to indemnify, defend, and hold harmless LiveKit from any claims, account suspensions, cease-and-desist orders, or legal actions initiated by third-party platforms arising directly or indirectly from your localized execution of the software.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">4. Billing &amp; Merchant of Record</h2>
            <p className="mt-2">
              LiveKit is billed on a prepaid, recurring monthly basis as a B2B subscription. All payments, tax calculations, invoicing, and compliance are managed by our designated Merchant of Record (Dodo Payments). See our Refund Policy for cancellation terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">5. Limitation of Liability (Financial Cap)</h2>
            <p className="mt-2">
              To the maximum extent permitted by applicable law, in no event shall LiveKit, its founders, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation: loss of profits, lost sponsorship revenue, data loss, or other intangible losses. In no event shall aggregate liability for all claims relating to the service exceed the total amount paid by the Agency to LiveKit during the three (3) months strictly preceding the date on which the legal claim arose.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">6. Governing Law &amp; Jurisdiction</h2>
            <p className="mt-2">
              These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or invalidity thereof, shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India. The service is strictly operated, billed, and managed as an Indian export entity. By using this service, users expressly waive any right to bring commercial or civil claims in any other global jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white">7. Contact</h2>
            <p className="mt-2">
              Questions about these terms: <a href="mailto:support.livekit@gmail.com" className="text-orange-400 hover:text-orange-300">support.livekit@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}