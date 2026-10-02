import { SiteHeader } from "@/shared/components/site-header";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#101716] text-white">
      <SiteHeader dark />
      
      <div className="container-shell mx-auto max-w-3xl py-24">
        <h1 className="display text-4xl font-semibold">Terms and Conditions</h1>
        <p className="mt-4 text-sm text-white/50">Last updated: September 2026</p>
        
        <div className="mt-8 space-y-8 text-sm leading-7 text-white/70">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Acceptance of Terms</h2>
            <p className="mt-2">By accessing and using Evenza, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">2. User Accounts</h2>
            <p className="mt-2">Users are responsible for maintaining the confidentiality of their account information and for all activities that occur under their account. You agree to notify us immediately of any unauthorized use of your account.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">3. Service Provider Verification</h2>
            <p className="mt-2">All service providers on Evenza undergo a verification process. Evenza reserves the right to approve or reject service provider applications at its sole discretion.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">4. Bookings and Payments</h2>
            <p className="mt-2">All bookings are subject to Evenza's escrow protection. Funds are held securely until services are delivered as agreed. Release of funds is contingent upon satisfactory completion of services.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">5. Dispute Resolution</h2>
            <p className="mt-2">In the event of disputes, Evenza provides a structured resolution process. All decisions are based on evidence provided and adherence to our cancellation policy.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">6. Prohibited Activities</h2>
            <p className="mt-2">Users may not use Evenza for illegal activities, fraud, or any purpose that violates applicable laws or regulations. Evenza reserves the right to suspend or terminate accounts that violate these terms.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">7. Limitation of Liability</h2>
            <p className="mt-2">Evenza shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of our services.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">8. Changes to Terms</h2>
            <p className="mt-2">Evenza reserves the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
          </section>
        </div>
      </div>
    </main>
  );
}