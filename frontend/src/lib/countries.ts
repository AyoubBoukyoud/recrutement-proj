/**
 * Indicatifs téléphoniques de tous les pays, pour le sélecteur de l'écran de
 * connexion. Les noms ne sont pas stockés ici : `Intl.DisplayNames` les donne
 * dans la langue de l'interface (fr, ar, en, de) à partir du code ISO.
 *
 * Toute la zone nord-américaine (États-Unis, Canada, Caraïbes) porte « +1 » :
 * on y compose toujours les dix chiffres, indicatif régional compris.
 *
 * L'ordre compte pour les indicatifs partagés : le premier pays listé est
 * celui proposé quand on reconnaît l'indicatif dans un numéro saisi.
 */
export type Country = { iso: string; dial: string };

export const DEFAULT_COUNTRY = 'MA';

/** Affichés en tête de liste : les deux pays du parcours Maroc → Allemagne. */
export const PINNED_COUNTRIES = ['MA', 'DE'];

const RAW: [string, string][] = [
  ['US', '1'], ['CA', '1'], ['RU', '7'], ['KZ', '7'], ['GB', '44'], ['IT', '39'], ['MA', '212'],
  ['AU', '61'], ['NO', '47'], ['FI', '358'], ['FR', '33'], ['RE', '262'], ['GP', '590'], ['CW', '599'],
  ['AF', '93'], ['AL', '355'], ['DZ', '213'], ['AS', '1'], ['AD', '376'], ['AO', '244'], ['AI', '1'],
  ['AG', '1'], ['AR', '54'], ['AM', '374'], ['AW', '297'], ['AT', '43'], ['AZ', '994'], ['BS', '1'],
  ['BH', '973'], ['BD', '880'], ['BB', '1'], ['BY', '375'], ['BE', '32'], ['BZ', '501'], ['BJ', '229'],
  ['BM', '1'], ['BT', '975'], ['BO', '591'], ['BA', '387'], ['BW', '267'], ['BR', '55'], ['IO', '246'],
  ['VG', '1'], ['BN', '673'], ['BG', '359'], ['BF', '226'], ['BI', '257'], ['KH', '855'], ['CM', '237'],
  ['CV', '238'], ['BQ', '599'], ['KY', '1'], ['CF', '236'], ['TD', '235'], ['CL', '56'], ['CN', '86'],
  ['CO', '57'], ['KM', '269'], ['CG', '242'], ['CD', '243'], ['CK', '682'], ['CR', '506'], ['CI', '225'],
  ['HR', '385'], ['CU', '53'], ['CY', '357'], ['CZ', '420'], ['DK', '45'], ['DJ', '253'], ['DM', '1'],
  ['DO', '1'], ['EC', '593'], ['EG', '20'], ['SV', '503'], ['GQ', '240'], ['ER', '291'], ['EE', '372'],
  ['SZ', '268'], ['ET', '251'], ['FK', '500'], ['FO', '298'], ['FJ', '679'], ['GF', '594'], ['PF', '689'],
  ['GA', '241'], ['GM', '220'], ['GE', '995'], ['DE', '49'], ['GH', '233'], ['GI', '350'], ['GR', '30'],
  ['GL', '299'], ['GD', '1'], ['GU', '1'], ['GT', '502'], ['GG', '44'], ['GN', '224'], ['GW', '245'],
  ['GY', '592'], ['HT', '509'], ['HN', '504'], ['HK', '852'], ['HU', '36'], ['IS', '354'], ['IN', '91'],
  ['ID', '62'], ['IR', '98'], ['IQ', '964'], ['IE', '353'], ['IM', '44'], ['IL', '972'], ['JM', '1'],
  ['JP', '81'], ['JE', '44'], ['JO', '962'], ['KE', '254'], ['KI', '686'], ['XK', '383'], ['KW', '965'],
  ['KG', '996'], ['LA', '856'], ['LV', '371'], ['LB', '961'], ['LS', '266'], ['LR', '231'], ['LY', '218'],
  ['LI', '423'], ['LT', '370'], ['LU', '352'], ['MO', '853'], ['MG', '261'], ['MW', '265'], ['MY', '60'],
  ['MV', '960'], ['ML', '223'], ['MT', '356'], ['MH', '692'], ['MQ', '596'], ['MR', '222'], ['MU', '230'],
  ['YT', '262'], ['MX', '52'], ['FM', '691'], ['MD', '373'], ['MC', '377'], ['MN', '976'], ['ME', '382'],
  ['MS', '1'], ['MZ', '258'], ['MM', '95'], ['NA', '264'], ['NR', '674'], ['NP', '977'], ['NL', '31'],
  ['NC', '687'], ['NZ', '64'], ['NI', '505'], ['NE', '227'], ['NG', '234'], ['NU', '683'], ['NF', '672'],
  ['KP', '850'], ['MK', '389'], ['MP', '1'], ['OM', '968'], ['PK', '92'], ['PW', '680'], ['PS', '970'],
  ['PA', '507'], ['PG', '675'], ['PY', '595'], ['PE', '51'], ['PH', '63'], ['PL', '48'], ['PT', '351'],
  ['PR', '1'], ['QA', '974'], ['RO', '40'], ['RW', '250'], ['BL', '590'], ['SH', '290'], ['KN', '1'],
  ['LC', '1'], ['MF', '590'], ['PM', '508'], ['VC', '1'], ['WS', '685'], ['SM', '378'], ['ST', '239'],
  ['SA', '966'], ['SN', '221'], ['RS', '381'], ['SC', '248'], ['SL', '232'], ['SG', '65'], ['SX', '1'],
  ['SK', '421'], ['SI', '386'], ['SB', '677'], ['SO', '252'], ['ZA', '27'], ['KR', '82'], ['SS', '211'],
  ['ES', '34'], ['LK', '94'], ['SD', '249'], ['SR', '597'], ['SE', '46'], ['CH', '41'], ['SY', '963'],
  ['TW', '886'], ['TJ', '992'], ['TZ', '255'], ['TH', '66'], ['TL', '670'], ['TG', '228'], ['TK', '690'],
  ['TO', '676'], ['TT', '1'], ['TN', '216'], ['TR', '90'], ['TM', '993'], ['TC', '1'], ['TV', '688'],
  ['VI', '1'], ['UG', '256'], ['UA', '380'], ['AE', '971'], ['UY', '598'], ['UZ', '998'], ['VU', '678'],
  ['VA', '39'], ['VE', '58'], ['VN', '84'], ['WF', '681'], ['YE', '967'], ['ZM', '260'], ['ZW', '263'],
  ['EH', '212'], ['AX', '358'],
];

export const COUNTRIES: Country[] = RAW.map(([iso, dial]) => ({ iso, dial: `+${dial}` }));

const BY_ISO = new Map(COUNTRIES.map((country) => [country.iso, country]));

/**
 * Indicatifs dont le « 0 » initial du numéro national fait partie du numéro
 * international (Italie/Vatican, Côte d'Ivoire, Congo-Brazzaville). Partout
 * ailleurs ce zéro n'est qu'un préfixe national, à retirer après l'indicatif.
 */
export const DIAL_CODES_KEEPING_LEADING_ZERO = new Set(['+39', '+225', '+242']);

export function countryByIso(iso: string): Country {
  return BY_ISO.get(iso) ?? BY_ISO.get(DEFAULT_COUNTRY)!;
}

/** « MA » → 🇲🇦 (deux lettres indicatrices régionales). */
export function flagEmoji(iso: string): string {
  return String.fromCodePoint(...Array.from(iso.toUpperCase()).map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/**
 * Pays d'un numéro saisi avec son indicatif (`+41…` ou `0041…`), ou `null` si
 * la saisie est nationale ou l'indicatif inconnu. Quand plusieurs pays
 * partagent l'indicatif, le pays déjà choisi est conservé s'il en fait partie.
 */
export function detectCountry(input: string, currentIso: string): Country | null {
  const compact = input.trim().replace(/[\s\-().]/g, '');
  const digits = compact.startsWith('+')
    ? compact.slice(1).replace(/\D/g, '')
    : compact.startsWith('00')
      ? compact.slice(2).replace(/\D/g, '')
      : '';
  if (digits === '') return null;

  // Les indicatifs forment un code préfixe : au plus une longueur correspond.
  for (const length of [3, 2, 1]) {
    const dial = `+${digits.slice(0, length)}`;
    if (dial.length - 1 < length) continue;
    const current = BY_ISO.get(currentIso);
    if (current?.dial === dial) return current;
    const match = COUNTRIES.find((country) => country.dial === dial);
    if (match) return match;
  }

  return null;
}
