import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service — MonkeysWork",
    description: "MonkeysWork Terms of Service governing use of our AI-powered freelance marketplace.",
};

const LAST_UPDATED = "February 22, 2026";

const sections = [
    {
        title: "1. Acceptance of Terms",
        content: `By accessing or using MonkeysWork ("Platform"), operated by MonkeysCloud LLC, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform. We may update these Terms at any time. Continued use after changes constitutes acceptance of the revised Terms. We will notify registered users of material changes via email or in-app notification at least 30 days before they take effect.`,
    },
    {
        title: "2. Definitions",
        content: `"Client" means a user who posts projects and hires freelancers. "Freelancer" means a user who offers services and performs work. "Contract" means a binding agreement between a Client and Freelancer for specific work. "Escrow" means the secure holding of funds by MonkeysWork until contract milestones are completed. "Milestone" means a defined deliverable within a fixed-price Contract. "Platform Fee" or "Commission" means the service fee charged by MonkeysWork on completed transactions.`,
    },
    {
        title: "3. Eligibility & Accounts",
        content: `You must be at least 18 years old and legally able to enter contracts in your jurisdiction. You must provide accurate, complete information during registration and keep it updated. Each person may maintain only one account. You are responsible for all activity under your account. You must not share your credentials or allow unauthorized access. We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or pose a risk to the community.`,
    },
    {
        title: "4. Platform Services",
        content: `MonkeysWork provides an AI-powered marketplace connecting Clients with Freelancers. We are not a party to Contracts between Clients and Freelancers — we facilitate the connection, provide tools for collaboration, and offer payment protection through our escrow system. We use artificial intelligence for job matching, content moderation, fraud detection, and other platform features. AI-generated suggestions are advisory and do not constitute professional advice. MonkeysWork does not guarantee the quality, accuracy, or completion of work performed by Freelancers, nor the payment behavior of Clients beyond escrowed funds.`,
    },
    {
        title: "5. Payments & Escrow",
        content: `Fixed-Price Contracts: Clients fund milestone escrow before work begins. Funds are released to the Freelancer upon Client acceptance or after the 14-day auto-acceptance period. Hourly Contracts: Clients are billed weekly based on tracked hours. Time tracking is verified through our monitoring tools. Platform Fees: MonkeysWork charges a commission on completed transactions, deducted from the Freelancer's payment. Current rates are displayed on our Pricing page. Refunds: Disputed payments are handled through our Dispute Resolution process. MonkeysWork may hold funds during investigation. Withdrawal: Freelancers may withdraw earned funds to their verified payment method. Processing times vary by method and region.`,
    },
    {
        title: "6. Intellectual Property",
        content: `Work Product: Unless otherwise agreed in the Contract, all intellectual property rights in work product transfer to the Client upon full payment. Pre-Existing IP: Freelancers retain rights to their pre-existing tools, frameworks, and methodologies. They grant Clients a non-exclusive license to use such materials as part of the deliverables. Platform Content: All MonkeysWork branding, design, software, and content are owned by MonkeysCloud LLC. Users may not copy, modify, or distribute Platform content without written permission. User Content: You retain ownership of content you upload (profiles, portfolios, reviews). You grant MonkeysWork a worldwide, non-exclusive license to display, distribute, and use such content for Platform operations and marketing.`,
    },
    {
        title: "7. Prohibited Conduct",
        content: `You agree not to: circumvent the Platform to avoid fees; create fake accounts or reviews; submit fraudulent invoices or time entries; harass, threaten, or discriminate against other users; upload malicious code, spam, or illegal content; scrape or automated-access the Platform without authorization; violate applicable laws, regulations, or third-party rights; attempt to reverse-engineer Platform features or AI systems; use the Platform for money laundering or terrorist financing.`,
    },
    {
        title: "8. Dispute Resolution",
        content: `If a dispute arises between Client and Freelancer, we encourage direct resolution first. If unsuccessful, either party may initiate our formal Dispute Resolution process. MonkeysWork will review evidence from both parties and may issue a binding decision regarding escrowed funds. Our decisions are based on the Contract terms, communication records, and delivered work. For disputes not resolved through our process, the parties agree to binding arbitration under the rules of the American Arbitration Association, conducted in Delaware, USA. Class action waivers apply to the maximum extent permitted by law.`,
    },
    {
        title: "9. Limitation of Liability",
        content: `TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, MONKEYSWORK AND MONKEYSCLOUD LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE PLATFORM. Our total liability for any claim shall not exceed the fees you paid to MonkeysWork in the 12 months preceding the claim. Nothing in these Terms limits liability for fraud, gross negligence, death, or personal injury caused by negligence, or any liability that cannot be excluded by applicable law (including EU consumer protection laws).`,
    },
    {
        title: "10. Indemnification",
        content: `You agree to indemnify and hold harmless MonkeysWork, MonkeysCloud LLC, and their officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorneys' fees) arising from your use of the Platform, violation of these Terms, or infringement of third-party rights. This indemnification obligation does not apply to EU consumers to the extent prohibited by mandatory consumer protection laws.`,
    },
    {
        title: "11. Privacy & Data Protection",
        content: `Your use of the Platform is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal data in compliance with the GDPR, CCPA, and other applicable privacy laws. By using the Platform, you acknowledge and agree to our data practices as described in the Privacy Policy.`,
    },
    {
        title: "12. Termination",
        content: `You may close your account at any time through your settings. Outstanding Contracts must be completed or resolved before closure. We may suspend or terminate your account for violation of these Terms, with notice where practicable. Upon termination, your right to use the Platform ceases. Provisions that by their nature should survive termination (including IP, liability, and dispute resolution) will continue to apply.`,
    },
    {
        title: "13. Governing Law",
        content: `These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. For users in the European Union, mandatory consumer protection laws of your country of residence will apply to the extent they provide greater protection. For users in California, the CCPA and other applicable California laws apply in addition to these Terms.`,
    },
    {
        title: "14. Contact",
        content: `For questions about these Terms, contact us at: legal@monkeysworks.com or through our Contact page. MonkeysCloud LLC, Delaware, USA.`,
    },
];

export default function TermsPage() {
    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
            <div style={{ marginBottom: "2.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
                    Terms of Service
                </h1>
                <p style={{ color: "#64748b", fontSize: "0.875rem", margin: 0 }}>
                    Last updated: {LAST_UPDATED}
                </p>
            </div>

            <div style={{
                background: "#eff6ff",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: "2rem",
                border: "1px solid #dbeafe",
                fontSize: "0.875rem",
                color: "#1e40af",
                lineHeight: 1.6,
            }}>
                📋 These Terms of Service constitute a legally binding agreement between you and MonkeysCloud LLC
                (&quot;MonkeysWork&quot;). Please read them carefully before using our platform.
            </div>

            {sections.map((s, i) => (
                <section key={i} style={{ marginBottom: "2rem" }}>
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
        </div>
    );
}
