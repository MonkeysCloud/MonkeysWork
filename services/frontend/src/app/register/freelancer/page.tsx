import type { Metadata } from "next";
import FreelancerRegisterForm from "./FreelancerRegisterForm";

export const metadata: Metadata = {
    title: "Create a Freelancer Account — MonkeysWorks",
    description:
        "Sign up as a freelancer on MonkeysWorks. Get matched with projects, build your reputation, and grow your career with milestone-based payments.",
};

export default function RegisterFreelancerPage() {
    return <FreelancerRegisterForm />;
}
