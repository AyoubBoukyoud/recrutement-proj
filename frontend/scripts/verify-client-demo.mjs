import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const checks = [];
function check(name, test) {
  test();
  checks.push(name);
}

check('root uses the canonical public home', () => {
  assert.match(read('src/app/page.tsx'), /redirect\('\/accueil-public'\)/);
});

check('prototype marketing routes are opt-in and redirected by default', () => {
  const middleware = read('src/middleware.ts');
  assert.match(middleware, /NEXT_PUBLIC_ENABLE_PROTOTYPES === '1'/);
  assert.match(middleware, /marketing\/employers.*'\/employeurs'/);
  assert.match(middleware, /startsWith\('\/amud\/marketing'\).*'\/accueil-public'/);
});

check('developer shortcuts are explicitly opt-in', () => {
  const auth = read('src/app/auth-phone/page.tsx');
  assert.match(auth, /NEXT_PUBLIC_SHOW_DEV_TOOLS === '1'/);
  assert.match(auth, /dynamic\(\(\) => import\('\.\/DevAuthTools'\)/);
  assert.doesNotMatch(auth, /NODE_ENV\s*!==\s*['"]production['"]/);
  assert.doesNotMatch(auth, /MOCK_OTP_CODE|600000001/);
});

check('local OTP dispatch reaches the verification screen', () => {
  const context = read('src/context/AuthContext.tsx');
  const auth = read('src/app/auth-phone/page.tsx');
  const otp = read('src/app/otp/page.tsx');
  assert.match(context, /debugCode: data\.debug_otp_code \?\? null/);
  assert.match(auth, /query\.set\('debug_code', result\.debugCode\)/);
  assert.match(otp, /setDebugCode\(result\.debugCode\)/);
  assert.match(otp, /Code local : \{debugCode\}/);
});

check('public CTAs use implemented candidate, recruiter, and trade routes', () => {
  const home = read('src/components/home/PublicHome.tsx');
  const tradeDetail = read('src/components/home/TradeDetail.tsx');
  assert.match(home, /href="\/auth-phone"/);
  assert.match(home, /href="\/auth-phone\?intent=recruiter"/);
  assert.match(home, /href=\{`\/metiers\/\$\{trade\.slug\}`\}/);
  assert.match(tradeDetail, /href="\/accueil-public#sectors"/);
});

check('localized public footer has no placeholder links', () => {
  for (const locale of ['fr', 'en', 'de', 'ar']) {
    const content = JSON.parse(read(`src/content/home.${locale}.json`));
    const links = content.footer.columns.flatMap((column) => column.links);
    assert.ok(links.every((link) => link.href !== '#'), `${locale} contains a placeholder link`);
    assert.ok(links.some((link) => link.href === '/auth-phone?intent=recruiter'));
  }
});

check('public language switching uses all four localized content sets', () => {
  const header = read('src/components/home/SiteHeader.tsx');
  const languageContext = read('src/context/LanguageContext.tsx');
  assert.match(header, /<LanguageSwitcher \/>/);
  assert.match(languageContext, /setLanguageState\(lang\)/);
  const shapes = ['fr', 'en', 'de', 'ar'].map((locale) => Object.keys(JSON.parse(read(`src/content/home.${locale}.json`))).sort());
  for (const shape of shapes.slice(1)) assert.deepEqual(shape, shapes[0]);
});

check('employer page contains no fake ROI interaction', () => {
  const employer = read('src/app/employeurs/EmployeursBody.tsx');
  assert.doesNotMatch(employer, /RoiCalculator|#roi/);
  assert.match(employer, /\/auth-phone\?intent=recruiter/);
});

check('recruiter intent and expired-session recovery are visible at login', () => {
  const auth = read('src/app/auth-phone/page.tsx');
  assert.match(auth, /query\.get\('intent'\) === 'recruiter'/);
  assert.match(auth, /query\.get\('reason'\) === 'session_expired'/);
  assert.doesNotMatch(auth, /phone_whatsapp_cta/);
});

check('recruiter intent never replaces server-side role authorization', () => {
  const middleware = read('src/middleware.ts');
  assert.match(middleware, /if \(role !== 'employer'\)/);
  assert.doesNotMatch(middleware, /intent.*employer/);
});

check('authenticated 401 recovers the session while 403 is untouched', () => {
  const fetchClient = read('src/lib/api.ts');
  const axiosClient = read('src/lib/opsApi.ts');
  assert.match(fetchClient, /response\.status === 401 && token/);
  assert.match(axiosClient, /status === 401 && hadAuthorization/);
  assert.doesNotMatch(fetchClient, /status === 403.*recoverFromUnauthorized/);
  assert.doesNotMatch(axiosClient, /status === 403.*recoverFromUnauthorized/);
});

check('candidate visibility comes from the server visibility state', () => {
  const visibility = read('src/app/(candidate)/visibilite/page.tsx');
  assert.match(visibility, /visibility\.data\?\.visible \?\? false/);
  assert.match(visibility, /visibility\.data\.withdrawn/);
  assert.match(visibility, /changeVisibility\.mutate\('pause'\)/);
  assert.match(visibility, /changeVisibility\.mutate\('resume'\)/);
  assert.match(visibility, /grantConsent/);
});

console.log(`Client-demo contracts passed: ${checks.length}`);
for (const name of checks) console.log(`  ✓ ${name}`);
