import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { AboutSection } from '@/components/landing/AboutSection';
import { SampleProperties } from '@/components/landing/SampleProperties';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { WhyUsSection } from '@/components/landing/WhyUsSection';
import { CTASection } from '@/components/landing/CTASection';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <SampleProperties />
        <TestimonialsSection />
        <WhyUsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
