import type { Metadata } from "next";
import PricingClient from "./PricingClient";

export const metadata: Metadata = {
    title: "MonkeysWork Pricing — Transparent Fees for Clients & Freelancers",
    description:
        "No hidden fees. Free to post jobs and create a freelancer profile. MonkeysWork charges simple, transparent fees only when milestones are approved and paid.",
};

export default function PricingPage() {
    return <PricingClient />;
}
