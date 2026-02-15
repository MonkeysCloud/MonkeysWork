import type { Metadata } from "next";
import FreelancerRegisterForm from "./FreelancerRegisterForm";

export const metadata: Metadata = {
    title: "Create a Freelancer Account — MonkeysWork",
    description:
        "Sign up as a freelancer on MonkeysWork. Get matched with projects, build your reputation, and grow your career with milestone-based payments.",
};

export default function RegisterFreelancerPage() {
    return <FreelancerRegisterForm />;
}
