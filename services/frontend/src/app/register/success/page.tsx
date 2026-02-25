import type { Metadata } from "next";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
    title: "Account Created — MonkeysWorks",
    description: "Your MonkeysWorks account has been created. Check your email to verify your address.",
};

export default function RegisterSuccessPage() {
    return <SuccessClient />;
}
