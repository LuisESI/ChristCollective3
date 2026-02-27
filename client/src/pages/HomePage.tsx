import HeroSection from "@/components/home/HeroSection";
import MissionSection from "@/components/home/MissionSection";
import DonationSection from "@/components/home/DonationSection";
import BusinessSection from "@/components/home/BusinessSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import { Helmet } from "react-helmet";

export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Christ Collective - Uniting Christians Worldwide</title>
        <meta name="description" content="Christ Collective is a global community uniting Christians from all denominations through faith, service, and fellowship. Join us today!" />
        <meta property="og:title" content="Christ Collective - Uniting Christians Worldwide" />
        <meta property="og:description" content="Join our global community dedicated to faith, service, and fellowship across all denominations." />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <HeroSection />
      <MissionSection />
      <DonationSection />
      <BusinessSection />
      <TestimonialsSection />
      <CTASection />
    </>
  );
}
