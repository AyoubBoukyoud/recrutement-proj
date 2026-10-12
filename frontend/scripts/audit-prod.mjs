#!/usr/bin/env node
/*
 * `npm audit --omit=dev --audit-level=high`, minus advisories that have been
 * looked at and accepted on purpose.
 *
 * The plain command cannot express that: it fails for as long as an advisory
 * has no fix, so a build-time-only finding would either keep CI red for
 * everyone or get the whole step switched off — and then the next real
 * vulnerability slips through unseen. Each exception below names why it is
 * safe and when it must be looked at again; after that date it fails the
 * build again, so an exception cannot quietly become permanent.
 */
import { execFileSync } from 'node:child_process';

const ACCEPTED = {
  // `braces` — stack exhaustion on deeply nested brace patterns. No patched
  // release exists (3.0.3 is the latest). It is reached only through
  // next-pwa → workbox → globby/fast-glob/micromatch and tailwindcss, which
  // expand globs written in this repository's own build configuration. No
  // pattern ever comes from a request, and none of it runs in the server.
  'GHSA-vfj7-8cjw-p6xm': { until: '2027-01-11', reason: 'build-time glob expansion of our own config; no fix published' },
};

const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const FAIL_FROM = SEVERITIES.indexOf('high');

let raw;
try {
  raw = execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
} catch (error) {
  // `npm audit` exits non-zero whenever it finds anything; the report is on stdout.
  raw = error.stdout;
}

const report = JSON.parse(raw);
if (report.error) {
  console.error(`npm audit failed: ${report.error.summary ?? JSON.stringify(report.error)}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const advisories = new Map();
for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vulnerability.via) {
    if (typeof via === 'string') continue;
    advisories.set(via.url, { ...via, package: vulnerability.name });
  }
}

const failing = [];
for (const [url, advisory] of advisories) {
  if (SEVERITIES.indexOf(advisory.severity) < FAIL_FROM) continue;

  const id = url.split('/').pop();
  const accepted = ACCEPTED[id];
  if (accepted && accepted.until >= today) {
    console.log(`accepted  ${id}  ${advisory.package}  (${accepted.reason}; review by ${accepted.until})`);
    continue;
  }
  failing.push(`${advisory.severity.padEnd(8)}  ${id}  ${advisory.package}  ${advisory.title}${accepted ? `  [acceptance expired ${accepted.until}]` : ''}`);
}

if (failing.length > 0) {
  console.error(`\n${failing.length} high/critical production advisories:\n${failing.join('\n')}\n\nRun \`npm audit --omit=dev\` for the fix paths.`);
  process.exit(1);
}

console.log('No unaccepted high or critical advisories in production dependencies.');
