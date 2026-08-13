import type { Metadata } from 'next';
import { SiteHeader } from '@/components/home/SiteHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { TrustStrip } from '@/components/home/TrustStrip';
import { TradeGrid } from '@/components/home/TradeGrid';
import { StepFlow } from '@/components/home/StepFlow';
import { CredibleSection } from '@/components/home/CredibleSection';
import { ProofBand } from '@/components/home/ProofBand';
import { RecruiterSection } from '@/components/home/RecruiterSection';
import { AccordionFAQ } from '@/components/home/AccordionFAQ';
import { FinalCta } from '@/components/home/FinalCta';
import { SiteFooter } from '@/components/home/SiteFooter';
import { MobileCtaBar } from '@/components/home/MobileCtaBar';

export const metadata: Metadata = {
  title: 'Travailler en Allemagne — Amud Skills',
  description:
    "Votre CV, vos diplômes et votre niveau d'allemand réunis dans un dossier que les entreprises allemandes savent lire. Inscription gratuite.",
};

/**
 * Page d'accueil publique.
 *
 * L'ordre des sections suit le parcours psychologique du visiteur (voir
 * docs/plan-home-recruitment.md §1.3) : défiance → reconnaissance →
 * compréhension → projection → objection. Chaque section traite exactement un
 * de ces états, ce qui est la règle qui permet d'en refuser une nouvelle.
 */
export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <HeroSection />
        <TrustStrip />
        <TradeGrid />
        <StepFlow />
        <CredibleSection />
        <ProofBand />
        <RecruiterSection />
        <AccordionFAQ />
        <FinalCta />
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </>
  );
}
