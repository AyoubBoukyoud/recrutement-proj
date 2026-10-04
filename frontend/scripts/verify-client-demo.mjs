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

check('root serves the public home and the old address redirects there', () => {
  assert.match(read('src/app/page.tsx'), /<PublicHome \/>/);
  assert.match(read('next.config.mjs'), /source: '\/accueil-public', destination: '\/', permanent: true/);
});

check('prototype marketing routes are opt-in and redirected by default', () => {
  const proxy = read('src/proxy.ts');
  assert.match(proxy, /NEXT_PUBLIC_ENABLE_PROTOTYPES === '1'/);
  assert.match(proxy, /marketing\/employers.*'\/employeurs'/);
  assert.match(proxy, /startsWith\('\/amud\/marketing'\)\) return '\/';/);
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
  // The code is shown, labelled, and the screen does not claim a WhatsApp was sent.
  assert.match(otp, /t\("otp_local_code_label"\)/);
  assert.match(otp, />\{debugCode\}<\/span>/);
  assert.match(otp, /debugCode \? t\("otp_local_subtitle_prefix"\) : t\("otp_subtitle_prefix"\)/);
});

check('public CTAs use implemented candidate, recruiter, and trade routes', () => {
  const routes = read('src/components/landing/content.ts');
  const marketplace = read('src/components/landing/marketplace.tsx');
  const tradeDetail = read('src/components/home/TradeDetail.tsx');
  assert.match(routes, /AUTH='\/auth-phone'/);
  assert.match(routes, /RECRUIT=AUTH\+'\?intent=recruiter'/);
  assert.match(marketplace, /href=\{'\/metiers\/'\+slug\}/);
  assert.match(tradeDetail, /href="\/#metiers"/);
});

check('localized public footer has no placeholder links', () => {
  for (const locale of ['fr', 'en', 'de', 'ar']) {
    const content = JSON.parse(read(`src/content/home.${locale}.json`));
    const links = content.footer.columns.flatMap((column) => column.links);
    assert.ok(links.every((link) => link.href !== '#'), `${locale} contains a placeholder link`);
    assert.ok(links.some((link) => link.href === '/auth-phone?intent=recruiter'));
  }
});

check('public language switching exposes all four supported locales', () => {
  const landing = read('src/components/landing/landing.tsx');
  const content = read('src/components/landing/content.ts');
  const languageContext = read('src/context/LanguageContext.tsx');
  assert.match(landing, /\['fr','ar','de','en'\]/);
  assert.match(landing, /setLanguage\(lang\)/);
  assert.match(content, /Locale = 'fr'\|'ar'\|'de'\|'en'/);
  assert.match(languageContext, /setLanguageState\(lang\)/);
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
  const proxy = read('src/proxy.ts');
  assert.match(proxy, /if \(role !== 'employer'\)/);
  assert.doesNotMatch(proxy, /intent.*employer/);
});

check('401 recovers the session while 403 is untouched', () => {
  const fetchClient = read('src/lib/api.ts');
  const axiosClient = read('src/lib/opsApi.ts');
  // lib/api.ts: `token` is a parameter the caller explicitly passed (some
  // repositories call it with `token: null` on purpose, for endpoints that
  // work logged out) — only recover when that specific call was meant to
  // be authenticated.
  assert.match(fetchClient, /response\.status === 401 && token && !options\.handleUnauthorized/);
  // opsApi.ts: every route behind this client requires auth (recruiter,
  // agent and admin — see routes/api.php's `auth:sanctum` group), so a 401
  // means "sign in again" whether or not a token was attached. Gating on
  // "a token was attached" used to leave a signed-out visitor stuck on a
  // fully rendered but silently broken admin page instead of redirecting —
  // see git history for src/lib/opsApi.ts.
  assert.match(axiosClient, /error\?\.response\?\.status === 401\) recoverFromUnauthorized\(\)/);
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
