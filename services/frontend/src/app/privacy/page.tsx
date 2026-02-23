import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy — MonkeysWork",
    description: "MonkeysWork Privacy Policy — how we collect, use, and protect your data. GDPR and CCPA compliant.",
};

const LAST_UPDATED = "February 22, 2026";

const sections = [
    {
        id: "overview",
        title: "1. Overview",
        content: `MonkeysCloud LLC ("MonkeysWork", "we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform at monkeysworks.com and related services. We process personal data in compliance with the EU General Data Protection Regulation (GDPR), the California Consumer Privacy Act (CCPA), and other applicable privacy laws. Our Data Protection Officer can be contacted at privacy@monkeysworks.com.`,
    },
    {
        id: "data-collected",
        title: "2. Information We Collect",
        content: `Account Information: Name, email address, phone number, country, profile photo, professional title, and bio provided during registration. Identity Verification: Government-issued ID, proof of address, and selfie verification images for identity and fraud prevention. Financial Information: Payment method details, bank account information, tax identification numbers, and billing addresses processed through our payment providers (Stripe, PayPal). Usage Data: Pages visited, features used, search queries, time spent, device information, IP address, browser type, and referring URLs. Communications: Messages exchanged through our platform, support tickets, and email correspondence. Work Data: Proposals, contracts, milestones, deliverables, time tracking data, reviews, and portfolio items. Cookies & Tracking: Information collected via cookies and similar technologies as described in our Cookie Policy.`,
    },
    {
        id: "legal-basis",
        title: "3. Legal Basis for Processing (GDPR)",
        content: `Under the GDPR, we process your data based on the following grounds: Contract Performance: Processing necessary to provide our marketplace services, process payments, and manage your account. Legitimate Interests: Analytics, fraud prevention, security, platform improvement, and direct marketing to existing customers (with opt-out). Legal Obligations: Tax reporting, anti-money laundering compliance, and responding to legal requests. Consent: Marketing communications, non-essential cookies, and AI-powered personalization features. You may withdraw consent at any time without affecting the lawfulness of prior processing.`,
    },
    {
        id: "how-used",
        title: "4. How We Use Your Information",
        content: `We use your personal data to: provide and maintain Platform services; process payments and manage escrow; verify your identity and prevent fraud; match freelancers with relevant jobs using AI; moderate content and enforce community standards; send transactional notifications (contract updates, payment confirmations); analyze usage to improve our services; provide customer support; comply with legal obligations; personalize your experience and recommendations. AI Processing: We use artificial intelligence for job matching, content moderation, proposal assistance, and fraud detection. You have the right to request human review of automated decisions that significantly affect you.`,
    },
    {
        id: "sharing",
        title: "5. Information Sharing",
        content: `We share your data with: Other Users: Profile information, reviews, and portfolio are visible to other users as necessary for marketplace functionality. Payment Processors: Stripe and PayPal process payment transactions on our behalf. Cloud Infrastructure: Google Cloud Platform hosts our services and processes data under appropriate safeguards. AI Services: Google Vertex AI processes data for matching and moderation features under data processing agreements. Analytics: Google Analytics (with IP anonymization) when you consent to analytics cookies. Legal Requirements: We may disclose data when required by law, court order, or to protect safety and rights. Business Transfers: In the event of a merger, acquisition, or sale, user data may be transferred. We do NOT sell your personal information. We do NOT share your data with third parties for their direct marketing purposes without your explicit consent.`,
    },
    {
        id: "international-transfers",
        title: "6. International Data Transfers",
        content: `MonkeysWork is based in the United States. If you are accessing from the EU/EEA, UK, or other regions, your data will be transferred to the US. We ensure adequate protection through: Standard Contractual Clauses (SCCs) approved by the European Commission. Data processing agreements with all sub-processors. Technical and organizational measures including encryption in transit and at rest. Google Cloud's GDPR compliance framework for infrastructure services.`,
    },
    {
        id: "your-rights",
        title: "7. Your Rights",
        content: `GDPR Rights (EU/EEA/UK residents): Right of Access — request a copy of your personal data. Right to Rectification — correct inaccurate or incomplete data. Right to Erasure ("Right to be Forgotten") — request deletion of your data. Right to Restrict Processing — limit how we use your data. Right to Data Portability — receive your data in a structured, machine-readable format. Right to Object — object to processing based on legitimate interests or direct marketing. Rights Related to Automated Decision-Making — request human review of automated decisions. CCPA Rights (California residents): Right to Know — what personal information we collect, use, and disclose. Right to Delete — request deletion of your personal information. Right to Opt-Out — opt out of the sale of personal information (we do not sell data). Right to Non-Discrimination — we will not discriminate for exercising your rights. Right to Correct — correct inaccurate personal information. To exercise these rights, contact us at privacy@monkeysworks.com or through your account settings. We will respond within 30 days (GDPR) or 45 days (CCPA).`,
    },
    {
        id: "retention",
        title: "8. Data Retention",
        content: `We retain your data for as long as your account is active or as needed to provide services. After account deletion, we retain: Transaction records for 7 years (tax/legal obligations). Dispute records for 3 years after resolution. Anonymized analytics data indefinitely. Identity verification data for 5 years after last activity (anti-fraud). Backup copies are purged within 90 days of deletion. You may request earlier deletion of non-legally-required data at any time.`,
    },
    {
        id: "security",
        title: "9. Data Security",
        content: `We implement industry-standard security measures including: TLS 1.3 encryption for all data in transit. AES-256 encryption for data at rest. SOC 2 compliant cloud infrastructure (Google Cloud). Regular security audits and penetration testing. Role-based access controls and audit logging. Secure, PCI-DSS compliant payment processing. While we take extensive measures to protect your data, no method of electronic storage is 100% secure. In the event of a data breach, we will notify affected users and relevant authorities within 72 hours as required by GDPR.`,
    },
    {
        id: "children",
        title: "10. Children's Privacy",
        content: `MonkeysWork is not intended for users under 18. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 18, we will delete it promptly. If you believe a child has provided us with personal information, please contact us at privacy@monkeysworks.com.`,
    },
    {
        id: "changes",
        title: "11. Changes to This Policy",
        content: `We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification at least 30 days before they take effect. The "Last updated" date at the top indicates the most recent revision. Continued use of the Platform after changes take effect constitutes acceptance, except where consent is required under applicable law.`,
    },
    {
        id: "contact",
        title: "12. Contact Us",
        content: `For privacy questions, data requests, or complaints: Email: privacy@monkeysworks.com. Data Protection Officer: dpo@monkeysworks.com. MonkeysCloud LLC, Delaware, USA. EU Representative (GDPR Art. 27): Contact details available upon request. You also have the right to lodge a complaint with your local data protection authority (supervisory authority) if you believe your rights have been violated.`,
    },
];

export default function PrivacyPage() {
    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                    Privacy Policy
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                    Last updated: {LAST_UPDATED}
                </p>
            </div>

            <div style={{
                background: "#f0fdf4",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: "2rem",
                border: "1px solid #bbf7d0",
                fontSize: "0.875rem",
                color: "#166534",
                lineHeight: 1.6,
            }}>
                🔒 Your privacy matters. This policy is compliant with the <strong>EU General Data Protection Regulation (GDPR)</strong> and
                the <strong>California Consumer Privacy Act (CCPA/CPRA)</strong>. We do not sell your personal information.
            </div>

            {/* Quick navigation */}
            <nav style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: "2.5rem",
                border: "1px solid #e2e8f0",
            }}>
                <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#64748b", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Quick Navigation
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                    {sections.map((s) => (
                        <a key={s.id} href={`#${s.id}`} style={{ fontSize: "0.8125rem", color: "#f08a11", textDecoration: "none" }}>
                            {s.title.replace(/^\d+\.\s*/, "")}
                        </a>
                    ))}
                </div>
            </nav>

            {sections.map((s, i) => (
                <section key={i} id={s.id} style={{ marginBottom: "2rem", scrollMarginTop: 80 }}>
                    <h2 style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "#0f172a",
                        margin: "0 0 10px",
                        paddingBottom: 8,
                        borderBottom: "1px solid #f1f5f9",
                    }}>
                        {s.title}
                    </h2>
                    <p style={{
                        fontSize: "0.9375rem",
                        lineHeight: 1.8,
                        color: "#374151",
                        margin: 0,
                    }}>
                        {s.content}
                    </p>
                </section>
            ))}

            {/* Links */}
            <div style={{
                background: "#f8fafc",
                borderRadius: 12,
                padding: "16px 20px",
                marginTop: "2rem",
                border: "1px solid #e2e8f0",
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                fontSize: "0.875rem",
            }}>
                <Link href="/terms" style={{ color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>📋 Terms of Service</Link>
                <Link href="/cookies" style={{ color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>🍪 Cookie Policy</Link>
                <Link href="/contact" style={{ color: "#f08a11", textDecoration: "none", fontWeight: 600 }}>📧 Contact Us</Link>
            </div>
        </div>
    );
}
