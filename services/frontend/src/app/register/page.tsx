import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
    title: "Register — MonkeysWorks",
    description:
        "Create your free MonkeysWorks account. Hire top freelancers or find your next project on the AI-powered marketplace.",
};

export default function RegisterPage() {
    return <RegisterClient />;
}
