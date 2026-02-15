import type { Metadata } from "next";
import HowItWorksClient from "./HowItWorksClient";

export const metadata: Metadata = {
    title: "How MonkeysWork Works — For Clients & Freelancers",
    description:
        "Learn how to hire freelancers or find work on MonkeysWork. AI-powered matching, escrow protection, and milestone-based project management.",
};

export default function HowItWorksPage() {
    return <HowItWorksClient />;
}
