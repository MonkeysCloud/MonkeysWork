import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import HowItWorks from "@/components/home/HowItWorks";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import AiPlatform from "@/components/home/AiPlatform";
import TrustSafety from "@/components/home/TrustSafety";
import LatestJobs from "@/components/home/LatestJobs";
import TopFreelancers from "@/components/home/TopFreelancers";
import Testimonials from "@/components/home/Testimonials";
import Ecosystem from "@/components/home/Ecosystem";
import FinalCTA from "@/components/home/FinalCTA";

export const metadata: Metadata = {
  title: "MonkeysWork — The AI-Powered Freelance Marketplace",
  description:
    "Hire verified freelancers or find your next project. AI-powered matching, milestone-based escrow payments, and built-in scope analysis. Start free.",
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturedCategories />
      <AiPlatform />
      <TrustSafety />
      <LatestJobs />
      <TopFreelancers />
      <Testimonials />
      <Ecosystem />
      <FinalCTA />
    </>
  );
}
