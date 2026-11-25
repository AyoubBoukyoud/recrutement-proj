// Exercise the real fixture initialization in an isolated browser-like store.
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const PRESENTATION_ACCESS_SECRET = 'verify-secret-0123456789abcdef0123456789';
// Same format as Laravel's PresentationAccessController.
function grant({ exp = Math.floor(Date.now() / 1000) + 600, secret = PRESENTATION_ACCESS_SECRET } = {}) {
  const payload = Buffer.from(JSON.stringify({ v: 1, uid: 1, exp })).toString('base64url');
  return `${payload}.${require('node:crypto').createHmac('sha256', secret).update(payload).digest('base64url')}`;
}
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
    window, localStorage: window.localStorage, CustomEvent: class {}, Event: class {}, console, Date, Set, Map, URLSearchParams,
    crypto: require('node:crypto').webcrypto, TextEncoder, TextDecoder, atob,
    process: { env: { NEXT_PUBLIC_USE_MOCKS: '0', NEXT_PUBLIC_ENABLE_PROTOTYPES: '0', PRESENTATION_ACCESS_SECRET } },
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

// Prototype portals need a Laravel-signed presentation grant; a role cookie never suffices.
const { proxy } = load('@/proxy');
const { UPCOMING_CENTRE_PAGES } = load('@/lib/amud/timetable/paths');
function request(pathname, role, presentation) {
  return {
    nextUrl: { pathname, clone: () => new URL('http://localhost' + pathname) },
    cookies: { get: (key) => (key === 'as_role' && role ? { value: role } : key === 'amud_presentation' && presentation ? { value: presentation } : undefined) },
  };
}
const target = async (...args) => (await proxy(request(...args))).url?.pathname ?? null;

async function verifyProxy() {
  const valid = grant();
  for (const role of DEMO_ROLES) {
    assert.equal(await target(role.path, 'admin', valid), null, `Granted admins reach ${role.path}`);
    if (role.id !== 'centre') {
      assert.notEqual(await target(role.path, 'admin'), null, `A login alone must not open ${role.path}`);
      assert.notEqual(await target(role.path), null, `Anonymous users must not open ${role.path}`);
    }
  }
  for (const portal of ['/amud/teacher/dashboard', '/amud/student/payments', '/amud/candidat', '/amud/candidat/profil']) {
    for (const role of [undefined, 'centre', 'candidate', 'admin']) assert.equal(await target(portal, role), '/', `${portal} closed for ${role ?? 'anonymous'}`);
    assert.equal(await target(portal, 'admin', grant({ secret: 'forged-secret-0123456789abcdef0123456789' })), '/', 'Forged grants are rejected');
    assert.equal(await target(portal, 'admin', grant({ exp: Math.floor(Date.now() / 1000) - 1 })), '/', 'Expired grants are rejected');
    assert.equal(await target(portal, 'admin', 'garbage'), '/', 'Malformed grants are rejected');
  }
  for (const page of UPCOMING_CENTRE_PAGES) {
    assert.equal(await target(page.path, 'centre'), `/amud/centre/a-venir/${page.slug}`, `${page.path} shows its placeholder`);
    assert.equal(await target(page.path, 'admin'), `/amud/centre/a-venir/${page.slug}`);
    assert.equal(await target(page.path, 'centre', valid), null, 'A granted presentation keeps the prototype');
    assert.equal(await target(page.path), '/auth-phone');
  }
  for (const live of ['/amud/centre/dashboard', '/amud/centre/etudiants', '/amud/centre/planning', '/amud/centre/paiements-etudiants', '/amud/centre/a-venir/presences']) {
    assert.equal(await target(live, 'centre'), null, `${live} stays available to centre accounts`);
    assert.equal(await target(live, 'admin'), null, `${live} stays available to administrators`);
  }
  assert.equal(await target('/amud/admin', 'candidate'), '/admin');
  assert.equal(await target('/amud/admin', 'admin'), '/admin');
  assert.equal(await target('/amud/entreprise/dashboard', 'candidate'), '/recruiter');
  assert.equal(await target('/amud/centre/dashboard'), '/auth-phone');
  assert.equal((await proxy(request('/amud/centre/dashboard'))).url.searchParams.get('intent'), 'training_center');
  assert.equal(await target('/amud/admin', 'centre'), '/admin');
  assert.equal(await target('/admin', 'candidate'), '/dashboard');
  assert.equal(await target('/recruiter', 'admin'), '/auth-phone');
  assert.equal(await target('/admin', 'centre'), '/auth-phone');
  assert.equal(await target('/recruiter', 'centre'), '/auth-phone');
  console.log('Proxy passed: signed presentation grants only, forged/expired grants rejected, placeholders for unfinished centre pages, live pages kept, real role restrictions.');
}

const { destinationForRole } = load('@/lib/roleDestination');
assert.equal(destinationForRole('centre', 1), '/amud/centre/dashboard');
assert.equal(destinationForRole('candidate', 1), '/profile-creation?step=1');
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

// A presentation must be reversible and must never write into the real workspace.
async function verifyTrainingDemo() {
  const { prepareTrainingDemo } = load('@/lib/amud/prepareTrainingDemo');
  const { setTrainingDemo, isTrainingDemo } = load('@/lib/amud/trainingDemo');
  const presentation = load('@/lib/amud/presentationAccess');
  setTrainingDemo(true);
  assert.equal(isTrainingDemo(), false, 'The local switch alone must never show fictional data');
  window.localStorage.removeItem('amud_training_demo_enabled');
  presentation.setPresentationAccessForTesting(true);
  const { createCollection } = load('@/lib/amud/storage/collection');
  const service = load('@/lib/amud/timetable/demoService').demoTimetableService;
  const students = createCollection(keys.centerStudents);
  students.replace([{ id: 'real-student', prenom: 'Keep this student' }]);
  const original = JSON.stringify([...storage]);
  prepareTrainingDemo();
  assert.equal(isTrainingDemo(), false, 'Preparation must not enable demo prematurely');
  setTrainingDemo(true);
  assert(students.getAll().length > 1, 'Demo fills the training centre');
  assert(!students.getById('real-student'), 'Original rows are isolated');
  students.update(students.getAll()[0].id, { prenom: 'Demo edit' });
  const demoRows = JSON.stringify(students.getAll());
  const centers = (await service.centers('')).centers;
  assert.equal(centers.length, 4);
  const center = centers[0];
  const resources = await service.resources('', center.id);
  for (const kind of ['teachers', 'modules', 'groups', 'rooms']) assert(resources[kind].length > 0);
  const { academicToday, mondayOf, addDays } = load('@/lib/amud/timetable/calendar');
  const monday = mondayOf(academicToday());
  const sessions = (await service.sessions('', center.id, monday, addDays(monday, 6))).sessions;
  assert(sessions.length > 0, 'Current week must contain courses');
  const session = sessions[0];
  const blocked = await service.availability('', center.id, session);
  assert.equal(blocked.available, false);
  assert(blocked.alternatives.length > 0, 'Conflicts have alternatives');
  await assert.rejects(service.save('', center.id, session, 'collision'), { status: 422 });
  const range = blocked.alternatives[0];
  const saved = await service.save('', center.id, { ...session, ...range }, 'new-demo-course');
  assert(saved.id !== session.id);
  assert.equal((await service.save('', center.id, { ...saved, end_time: range.end_time }, saved.request_key)).id, saved.id);
  const edited = await service.save('', center.id, saved, saved.request_key, saved);
  assert.equal(edited.version, 2);
  await assert.rejects(service.remove('', center.id, saved), { status: 409 });
  await service.remove('', center.id, edited);
  await assert.rejects(service.removeResource('', center.id, 'rooms', session.room_id), { status: 422 });
  const room = await service.saveResource('', center.id, 'rooms', 'Salle de démonstration');
  await service.removeResource('', center.id, 'rooms', room.id);
  setTrainingDemo(false);
  assert.equal(students.getAll()[0].id, 'real-student', 'Switching off restores original rows');
  // Ignore only the new demo namespace and toggle flag when comparing all data.
  assert.equal(JSON.stringify([...storage].filter(([key]) => !key.startsWith('amud_training_demo'))), original);
  prepareTrainingDemo(); setTrainingDemo(true);
  assert.equal(JSON.stringify(students.getAll()), demoRows, 'Demo edits survive toggles');
  setTrainingDemo(false);
  console.log('Training demo passed: reversible isolation, preserved edits/auth, current-week calendar, conflict checks, CRUD and stale versions.');
}
verifyProxy().then(verifyTrainingDemo).catch((error) => { console.error(error); process.exitCode = 1; });
