/**
 * Source UNIQUE des objectifs commerciaux. Remplace 3 copies indépendantes
 * qui existaient jusqu'ici et ne se synchronisaient jamais entre elles :
 * les champs `objectifAppelsJour`/`objectifRdvSemaine`/… sur `Commercial`
 * (`commerciaux.ts`), la config "Objectifs standards" de `admin/objectifs`,
 * et les "objectifs d'appels quotidiens" de `admin/parametres`.
 */
export type Objective = {
  id: string;
  commercialId: string;
  appelsJour: number;
  rdvSemaine: number;
  contactsMois: number;
  tauxConversionCible: number;
  objectifMensuel: number;
};

/** Un objectif par commercial du roster `commerciaux.ts` (mêmes ids). */
export const objectivesSeed: Objective[] = [
  { id: 'obj_jean-dupont', commercialId: 'jean-dupont', appelsJour: 50, rdvSemaine: 15, contactsMois: 200, tauxConversionCible: 10, objectifMensuel: 500 },
  { id: 'obj_marie-lambert', commercialId: 'marie-lambert', appelsJour: 30, rdvSemaine: 15, contactsMois: 150, tauxConversionCible: 8, objectifMensuel: 450 },
  { id: 'obj_paul-leroy', commercialId: 'paul-leroy', appelsJour: 40, rdvSemaine: 15, contactsMois: 120, tauxConversionCible: 10, objectifMensuel: 500 },
  { id: 'obj_sophie-martin', commercialId: 'sophie-martin', appelsJour: 45, rdvSemaine: 15, contactsMois: 220, tauxConversionCible: 10, objectifMensuel: 500 },
  { id: 'obj_thomas-dubois', commercialId: 'thomas-dubois', appelsJour: 45, rdvSemaine: 12, contactsMois: 180, tauxConversionCible: 9, objectifMensuel: 450 },
  { id: 'obj_emma-leroy', commercialId: 'emma-leroy', appelsJour: 40, rdvSemaine: 12, contactsMois: 100, tauxConversionCible: 12, objectifMensuel: 600 },
  { id: 'obj_ahmed-benali', commercialId: 'ahmed-benali', appelsJour: 40, rdvSemaine: 15, contactsMois: 200, tauxConversionCible: 10, objectifMensuel: 400 },
];

export function getObjectiveForCommercial(commercialId: string, all: Objective[] = objectivesSeed): Objective | undefined {
  return all.find((o) => o.commercialId === commercialId);
}
