import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
    title: "Log In — MonkeysWork",
    description:
        "Sign in to your MonkeysWork account. Access your projects, manage proposals, and connect with top freelance talent.",
};

export default function LoginPage() {
    return <LoginForm />;
}
