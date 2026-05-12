import { HeroSection } from "../components/HeroSection";
import { AboutSection } from "../components/AboutSection";
import { CorporateBranding } from "../components/CorporateBranding";
import { WebAppDesign } from "../components/WebAppDesign";
import { UXUIProduct } from "../components/UXUIProduct";
import { ProductPhotography } from "../components/ProductPhotography";
import { Marketing360 } from "../components/Marketing360";
import { AboutContact } from "../components/AboutContact";
import { useScrollRestoration } from "../hooks/useScrollRestoration";

export function HomePage() {
  useScrollRestoration();

  return (
    <>
      <HeroSection />
      <CorporateBranding />
      <WebAppDesign />
      <UXUIProduct />
      <ProductPhotography />
      <Marketing360 />
      <AboutSection />
      <AboutContact />
    </>
  );
}