import { permanentRedirect } from 'next/navigation';

// French pages currently use the canonical root locale. This route is a
// stable locale-prefixed alias and intentionally does not create a duplicate.
export default function FrenchEmploymentAlias() {
  permanentRedirect('/emploi-allemagne-maroc');
}
