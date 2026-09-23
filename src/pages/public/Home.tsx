import { Hero } from "@/components/home/Hero";
import { StatsStrip } from "@/components/home/StatsStrip";
import { AboutPillars } from "@/components/home/AboutPillars";
import { ProgramsSection } from "@/components/home/ProgramsSection";
import { HajjUmrahSpotlight } from "@/components/home/HajjUmrahSpotlight";
import { CbtPreview } from "@/components/home/CbtPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { EnrollmentCta } from "@/components/home/EnrollmentCta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <AboutPillars />
      <ProgramsSection />
      <HajjUmrahSpotlight />
      <CbtPreview />
      <Testimonials />
      <EnrollmentCta />
    </>
  );
}
