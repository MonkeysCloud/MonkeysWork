import type { Metadata } from "next";
import ClientRegisterForm from "./ClientRegisterForm";

export const metadata: Metadata = {
    title: "Create a Client Account — MonkeysWork",
    description:
        "Sign up as a client on MonkeysWork. Post projects, hire AI-matched freelancers, and manage work with milestone-based escrow protection.",
};

export default function RegisterClientPage() {
    return <ClientRegisterForm />;
}
