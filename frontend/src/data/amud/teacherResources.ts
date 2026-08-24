import type { TeacherResource } from './centerTypes';
import { centresSeed } from './centres';

function buildTeacherResourcesSeed(): TeacherResource[] {
  const resources: TeacherResource[] = [];

  const samples: Array<{ titre: string; categorie: TeacherResource['categorie']; description: string; url?: string }> = [
    { titre: 'Guide pédagogique A1 — Livre du professeur', categorie: 'PDF', description: 'Manuel complet pour enseigner le niveau A1 selon le CECR.', url: '/demo/guide-a1.pdf' },
    { titre: 'Exercices de grammaire B1', categorie: 'Exercice', description: 'Série de 50 exercices sur le subjonctif et la syntaxe complexe.', url: '/demo/exercices-b1.pdf' },
    { titre: 'Vocabulaire thématique — Milieu professionnel', categorie: 'Document', description: 'Fiches de vocabulaire pour l\'allemand des affaires.', url: '/demo/vocab-pro.docx' },
    { titre: 'Ressources Goethe Institut — Niveaux A2/B1', categorie: 'Lien', description: 'Collection officielle de ressources pédagogiques en ligne.', url: 'https://www.goethe.de/de/spr/ueb.html' },
    { titre: 'Vidéo — Introduction à la phonétique allemande', categorie: 'Vidéo', description: 'Série de 6 vidéos courtes sur les sons difficiles pour les arabophones.', url: '/demo/phonetique-intro.mp4' },
    { titre: 'Présentation — Les cas en allemand', categorie: 'Support', description: 'Diaporama explicatif pour présenter le nominatif, accusatif et datif.', url: '/demo/cas-allemand.pptx' },
    { titre: 'Quiz interactif — Niveaux A1 à B2', categorie: 'Lien', description: 'Quiz Quizlet couvrant le vocabulaire fondamental de chaque niveau.', url: 'https://quizlet.com/deutsch' },
    { titre: 'Dictées progressives — Niveaux débutants', categorie: 'Exercice', description: 'Dictées adaptées en difficulté croissante pour les niveaux A1 et A2.', url: '/demo/dictees-a1-a2.pdf' },
    { titre: 'Compréhension orale — Podcasts authentiques', categorie: 'Lien', description: 'Sélection de podcasts allemands adaptés à l\'apprentissage.', url: 'https://www.deutschlandfunk.de' },
    { titre: 'Fiche mémo — Conjugaison des verbes irréguliers', categorie: 'Document', description: 'Liste complète des 150 verbes forts les plus courants.', url: '/demo/verbes-irreguliers.pdf' },
  ];

  centresSeed.slice(0, 3).forEach((centre, ci) => {
    samples.forEach((s, si) => {
      resources.push({
        id: `resource_${ci}_${si}`,
        centerId: centre.id,
        titre: s.titre,
        description: s.description,
        categorie: s.categorie,
        url: s.url,
        createdAt: `2026-0${(si % 6) + 1}-${String(5 + si).padStart(2, '0')}T10:00:00.000Z`,
      });
    });
  });

  return resources;
}

export const teacherResourcesSeed: TeacherResource[] = buildTeacherResourcesSeed();
export type { TeacherResource };
