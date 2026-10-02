import { SiteHeader } from "@/shared/components/site-header";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#101716] text-white">
      <SiteHeader dark />
      
      <div className="container-shell mx-auto max-w-3xl py-24">
        <h1 className="display text-4xl font-semibold">Privacy Policy</h1>
        <p className="mt-4 text-sm text-white/50">Last updated: September 2026</p>
        
        <div className="mt-8 space-y-8 text-sm leading-7 text-white/70">
          <section>
            <h2 className="text-lg font-semibold text-white">1. Information Collection</h2>
            <p className="mt-2">Evenza collects information you provide directly, including name, email address, and payment information. We also collect information about your use of our services.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">2. Use of Information</h2>
            <p className="mt-2">We use your information to provide, maintain, and improve our services, process transactions, and communicate with you about our services.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">3. Information Sharing</h2>
            <p className="mt-2">We do not sell your personal information. We may share information with service providers who perform services on our behalf, or as required by law.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">4. Data Security</h2>
            <p className="mt-2">We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">5. Service Provider Verification</h2>
            <p className="mt-2">For service provider verification, we may collect additional documentation including identity documents and business credentials. These are used solely for verification purposes.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">6. Your Rights</h2>
            <p className="mt-2">You have the right to access, correct, or delete your personal information. You may also opt out of certain communications from us.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">7. Cookies and Tracking</h2>
            <p className="mt-2">We use cookies and similar technologies to improve user experience and analyze usage patterns. You can control cookie settings through your browser.</p>
          </section>
          
          <section>
            <h2 className="text-lg font-semibold text-white">8. Policy Updates</h2>
            <p className="mt-2">We may update this privacy policy from time to time. We will notify users of significant changes via email or through our service.</p>
          </section>
        </div>
      </div>
    </main>
  );
}