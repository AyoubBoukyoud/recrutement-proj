// Exercise the real fixture initialization in an isolated browser-like store.
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const storage = new Map();
const cache = new Map();
const window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
  dispatchEvent() {}, addEventListener() {}, removeEventListener() {},
};

function load(source) {
  let file = source.startsWith('@/') ? path.resolve(root, 'src', source.slice(2)) : source;
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const execute = vm.runInNewContext(`(function(require,module,exports){${outputText}\n})`, {
    window, CustomEvent: class {}, Event: class {}, console, Date, Set, Map, URLSearchParams,
    crypto: require('node:crypto').webcrypto,
    process: { env: { NEXT_PUBLIC_USE_MOCKS: '0', NEXT_PUBLIC_ENABLE_PROTOTYPES: '0' } },
  }, { filename: file });
  execute((request) => {
    if (request === 'next/server') {
      return { NextResponse: {
        next: () => ({ headers: new Map(), cookies: { set() {} } }),
        redirect: (url) => ({ url, headers: new Map() }),
      } };
    }
    if (request === 'react') return {};
    return load(request.startsWith('.') ? path.resolve(path.dirname(file), request) : request);
  }, module, module.exports);
  return module.exports;
}

const prepare = load('@/lib/amud/preparePresentation');
prepare.preparePresentation();
prepare.selectPresentationCandidate();
const keys = load('@/lib/amud/storage/keys').AMUD_KEYS;
const populated = [
  'companies', 'offers', 'applications', 'candidates', 'commercials', 'centres',
  'centerStudents', 'centerTeachers', 'centerGroups', 'centerSchedules',
  'centerStudentPayments', 'studentResults', 'teacherResources',
  'candidateAccounts', 'candidateDocuments', 'candidateOfferFavorites', 'conversations',
];
for (const name of populated) {
  assert(JSON.parse(storage.get(keys[name])).length > 0, `${name} must be populated`);
}

const accountKey = keys.candidateAccounts;
const accounts = JSON.parse(storage.get(accountKey));
accounts[0].prenom = 'Edited during presentation';
window.localStorage.setItem(accountKey, JSON.stringify(accounts));
const before = JSON.stringify([...storage]);
prepare.preparePresentation();
assert.equal(JSON.stringify([...storage]), before, 'Preparation must preserve edits');
assert.equal(JSON.parse(storage.get('amud_candidate_session')).candidateAccountId, 'candidate_youssefa');
assert(!storage.has('as_auth_user'), 'Preparation must never modify authentication');
assert(!storage.has('as_auth_token'), 'Preparation must never modify API tokens');

// Existing browsers may have empty candidate collections from older demos.
for (const name of ['candidateAccounts', 'candidateDocuments', 'candidateOfferFavorites']) {
  window.localStorage.setItem(keys[name], '[]');
}
prepare.preparePresentation();
for (const name of ['candidateAccounts', 'candidateDocuments', 'candidateOfferFavorites']) {
  assert(JSON.parse(storage.get(keys[name])).length > 0, `${name} must upgrade`);
}
const candidateId = JSON.parse(storage.get('amud_candidate_session')).candidateAccountId;
for (const name of ['applications', 'interviews', 'conversations']) {
  assert(JSON.parse(storage.get(keys[name])).some((row) => row.candidateId === candidateId), `${name} must link to the demo candidate`);
}

const { DEMO_ROLES, demoRoleForPath } = load('@/lib/demoRoles');
assert.equal(DEMO_ROLES.length, 7);
for (const role of DEMO_ROLES) {
  assert.equal(demoRoleForPath(role.path).id, role.id);
  assert.equal(demoRoleForPath(role.path.replace(/\/dashboard$/, '') + '/profile').id, role.id);
}
assert.equal(demoRoleForPath('/amud/centres/public'), undefined);
assert.equal(demoRoleForPath('/admin'), undefined);
console.log('Demo roles passed: populated data, linked candidate, preserved edits, legacy upgrades, unchanged auth, seven routes.');

// Routing exceptions must stay confined to the seven fixture portals.
const { proxy } = load('@/proxy');
function request(pathname, role) {
  return {
    nextUrl: { pathname, clone: () => new URL('http://localhost' + pathname) },
    cookies: { get: (key) => key === 'as_role' && role ? { value: role } : undefined },
  };
}
for (const role of DEMO_ROLES) {
  assert(!proxy(request(role.path, 'admin')).url, 'Admins can reach every fixture portal');
}
assert.equal(proxy(request('/amud/admin', 'candidate')).url.pathname, '/admin');
assert.equal(proxy(request('/amud/entreprise/dashboard', 'candidate')).url.pathname, '/recruiter');
assert.equal(proxy(request('/amud/centre/dashboard')).url.pathname, '/auth-phone');
assert.equal(proxy(request('/amud/centre/dashboard')).url.searchParams.get('intent'), 'training_center');
assert(!proxy(request('/amud/centre/dashboard', 'centre')).url);
assert.equal(proxy(request('/amud/admin', 'centre')).url.pathname, '/admin');
assert.equal(proxy(request('/admin', 'candidate')).url.pathname, '/dashboard');
assert.equal(proxy(request('/recruiter', 'admin')).url.pathname, '/auth-phone');
console.log('Proxy passed: admin presentation access, default redirects, real role restrictions.');

const { destinationForRole } = load('@/lib/roleDestination');
assert.equal(destinationForRole('centre', 1), '/amud/centre/dashboard');
assert.equal(destinationForRole('candidate', 1), '/profile-creation?step=1');
assert.equal(proxy(request('/admin', 'centre')).url.pathname, '/auth-phone');
assert.equal(proxy(request('/recruiter', 'centre')).url.pathname, '/auth-phone');
for (const locale of ['fr', 'en', 'de', 'ar']) {
  const copy = JSON.parse(fs.readFileSync(path.join(root, `src/content/i18n.${locale}.json`), 'utf8'));
  for (const key of ['auth_intent_training_center', 'phone_screen_title_training_center', 'auth_center_access_hint', 'center_access_pending_body']) {
    assert(copy[key]?.length > 0, `${locale}: ${key} must be translated`);
  }
}
console.log('Centre login passed: role destination, portal access, staff isolation, four languages.');

const sessionStore = new Map();
window.sessionStorage = {
  getItem: (key) => sessionStore.get(key) ?? null,
  setItem: (key, value) => sessionStore.set(key, value),
  removeItem: (key) => sessionStore.delete(key),
};
let googleRedirect = '';
window.location = { search: '?intent=training_center', assign: (url) => { googleRedirect = url; } };
const googleAuth = load('@/lib/googleAuth');
googleAuth.startGoogleSignIn();
assert(googleRedirect.includes('/auth/google/redirect?flow='));
assert.equal(googleAuth.consumeGoogleIntent(), 'training_center');
assert.equal(googleAuth.consumeGoogleIntent(), 'job_seeker', 'Google intent must be consumed once');
assert(googleAuth.consumeGoogleFlow()?.length > 20);
assert.equal(googleAuth.consumeGoogleFlow(), null);
console.log('Google login passed: centre intent preserved, one-time flow retained.');
