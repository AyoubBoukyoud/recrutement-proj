'use client';

import { useHomeContent } from '@/lib/useLocalizedContent';
import { RevealNoScriptFallback } from './Reveal';
import { HeroSection } from './HeroSection';
import { FeatureStrip } from './FeatureStrip';
import { BorderlessSection } from './BorderlessSection';
import { GermanLevelsSection } from './GermanLevelsSection';
import { StepsSection } from './StepsSection';
import { FeatureGridSection } from './FeatureGridSection';
import { SpacesSection } from './SpacesSection';
import { TradeSpotlightSection } from './TradeSpotlightSection';
import { CriteriaSection } from './CriteriaSection';
import { RecruitersSection } from './RecruitersSection';
import { ThreeColumnSection } from './ThreeColumnSection';
import { TrainingCenterSection } from './TrainingCenterSection';
import { BridgeBanner } from './BridgeBanner';
import { FaqSection } from './FaqSection';
import { FinalCtaSection } from './FinalCtaSection';
import { ContactSection } from './ContactSection';
import { MobileActionBar } from './MobileActionBar';

/**
 * Page d'accueil publique — refonte reprenant la maquette navy/corail.
 *
 * Ordre des blocs : hero, trois publics, sans-frontières (candidat/
 * recruteur), niveaux d'allemand, comment ça marche, ce qui compte, les
 * espaces (candidat/employeur/centre), métiers, critères de recherche,
 * recruteurs, prochaines étapes, centres de formation, passerelle, clarté,
 * FAQ, CTA final, contact. La palette sémantique `home-*` (voir `ui.tsx`)
 * suit le thème global clair/sombre.
 */
export function PublicHome() {
  const content = useHomeContent();

  return (
    <main id="main-content" tabIndex={-1} className="overflow-x-clip bg-home-sand text-home-ink outline-none transition-colors duration-300">
      <RevealNoScriptFallback />

      <HeroSection />
      <FeatureStrip />
      <BorderlessSection />
      <GermanLevelsSection />
      <StepsSection />
      <FeatureGridSection />
      <SpacesSection />
      <TradeSpotlightSection />
      <CriteriaSection />
      <RecruitersSection />
      <ThreeColumnSection title={content.nextSteps.title} subtitle={content.nextSteps.subtitle} items={content.nextSteps.items} background="white" />
      <TrainingCenterSection />
      <BridgeBanner />
      <ThreeColumnSection title={content.clarity.title} subtitle={content.clarity.subtitle} items={content.clarity.items} background="sand" />
      <FaqSection />
      <FinalCtaSection />
      <ContactSection />

      <MobileActionBar />
    </main>
  );
}
