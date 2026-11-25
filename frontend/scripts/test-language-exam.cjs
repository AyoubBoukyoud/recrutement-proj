const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(relative, imports = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, Date, setTimeout, clearTimeout, setInterval, clearInterval,
    require(name) { return name in imports ? imports[name] : require(name); }, ...globals,
  });
  return exports;
}
const { ExamAnswerSaver } = load('src/lib/examAnswerSaver.ts');
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('finishing waits for in-flight answers and sends newer edits in order', async () => {
  const first = deferred();
  const sent = [];
  const saver = new ExamAnswerSaver(async (_, answer) => {
    sent.push(answer.text);
    if (sent.length === 1) await first.promise;
  });
  saver.set(1, { text: 'first draft' });
  const saving = saver.save(1);
  saver.set(1, { text: 'final answer' });
  let finished = false;
  const finishing = saver.flush().then(() => { finished = true; });
  await tick();
  assert.equal(finished, false);
  assert.deepEqual(sent, ['first draft']);
  first.resolve();
  await Promise.all([saving, finishing]);
  assert.deepEqual(sent, ['first draft', 'final answer']);
  assert.equal(saver.hasUnsaved, false);
});

test('failed saves stay dirty and prevent completion until a successful retry', async () => {
  let online = false;
  const saver = new ExamAnswerSaver(async () => { if (!online) throw Error('offline'); });
  saver.set(1, { text: 'answer' });
  await assert.rejects(saver.save(1), /offline/);
  await assert.rejects(saver.flush(), /offline/);
  assert.equal(saver.hasUnsaved, true);
  online = true;
  await saver.flush();
  assert.equal(saver.hasUnsaved, false);
});

test('section submission waits for an autosave that already left its debounce timer', async () => {
  let cursor = 0;
  const slots = [];
  const hooks = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], (value) => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
    useCallback(fn) { return fn; },
    useMemo(fn) {
      const i = cursor++;
      return slots[i] ??= fn();
    },
    useEffect() {},
  };
  const timers = new Map();
  let timerId = 0;
  const answer = deferred();
  let completed = false;
  const api = {
    answer: () => answer.promise,
    completeSection: async () => { completed = true; return {}; },
  };
  const { SectionRunner } = load('src/components/languageTest/SectionRunner.tsx', {
    react: hooks,
    '@/components/shared/Button': { Button: 'Button' },
    '@/lib/languageTest': { languageTestApi: api },
    '@/lib/candidateLanguageExamContent': { fill: (s) => s },
    '@/lib/examAnswerSaver': { ExamAnswerSaver },
    './ExamTasks': { QuestionsTask: 'QuestionsTask' },
  }, {
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const props = {
    state: { id: 1, current_section: 'reading', server_time: new Date().toISOString(), sections: { reading: {} }, items: [{ response_id: 1, answer: {}, item: { task_type: 'true_false' } }] },
    token: 'test', content: { runner: { task: 'Task', finish: 'Finish', confirm: 'Confirm', saveFailed: 'Failed' }, sections: { reading: 'Reading' } }, onState() {},
  };
  function render() { cursor = 0; return SectionRunner(props); }
  function nodes(node) {
    if (!node || typeof node !== 'object') return [];
    return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  }
  let tree = render();
  nodes(tree).find((n) => n.type === 'QuestionsTask').props.onChange({ answers: { q1: 'a' } });
  tree = render();
  for (const fn of timers.values()) fn();
  nodes(tree).find((n) => n.type === 'Button' && n.props.children === 'Finish').props.onClick();
  tree = render();
  nodes(tree).find((n) => n.type === 'Button' && n.props.children === 'Confirm').props.onClick();
  await tick();
  assert.equal(completed, false);
  answer.resolve({ saved: true });
  await tick();
  assert.equal(completed, true);
});

test('an unsuccessful exam shows no awarded level or premature confirmation', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const locales = Object.fromEntries(['fr', 'en', 'de', 'ar'].map((l) => [
    `@/content/candidate-language-exam.${l}.json`, { default: require(`../src/content/candidate-language-exam.${l}.json`) },
  ]));
  const contentHelpers = load('src/lib/candidateLanguageExamContent.ts', locales);
  const { PhaseOneResult } = load('src/components/languageTest/ExamScreens.tsx', {
    'next/link': { default: ({ children, href }) => React.createElement('a', { href }, children) },
    '@/components/shared/Button': { Button: ({ children }) => React.createElement('button', null, children) },
    '@/lib/languageTestBank': { CEFR_LEVELS: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
    '@/lib/languageTest': { PHASE_ONE_SECTIONS: ['reading', 'listening', 'read_aloud', 'writing'] },
    '@/lib/candidateLanguageExamContent': contentHelpers,
  });
  const state = {
    status: 'validated', exam_level: 'A1', final_cefr: null, ai_cefr: null,
    outcome: 'not_demonstrated', final_skill_results: { reading: null, listening: null, writing: null, speaking: null },
    provisional: { cefr: null, outcome: 'not_demonstrated', skill_results: {}, skill_scores: { reading: 0, listening: 0, writing: 0, speaking: 0 }, summary: null },
  };
  const content = contentHelpers.languageExamContentFor('en');
  const html = renderToStaticMarkup(PhaseOneResult({ state, content }));
  assert.match(html, /Level A1 was not demonstrated/);
  assert.doesNotMatch(html, /AMUD exam result: A1/);
  const pending = renderToStaticMarkup(PhaseOneResult({
    state: { ...state, status: 'in_progress', current_section: 'oral', provisional: { ...state.provisional, outcome: null } }, content,
  }));
  assert.match(pending, /Phase 1 is complete; speaking still needs to be assessed/);
  assert.doesNotMatch(pending, /Level A1 confirmed/);
});
