// SPDX-License-Identifier: Apache-2.0

// Builds the examples.yml job matrices from .github/examples.json.
//
// Usage: node .github/scripts/examples-matrix.js [changed-files.txt]
//
// Without a changed-files list every example is selected. With one, only examples
// whose directory changed are selected, plus the examples that depend on a changed
// examples/shared/<package> (file: dependency in their package.json). Changes to the CI
// setup itself select every example.
// Writes `build` and `solo` JSON arrays to $GITHUB_OUTPUT (or stdout).

const fs = require('fs');
const path = require('path');

const SHARED_PATHS = [
  '.github/examples.json',
  '.github/actions/setup-example-toolchain/',
  '.github/examples-relay-values.yaml',
  '.github/mirror-node-values.yaml',
  '.github/scripts/examples-matrix.js',
  '.github/workflows/examples.yml',
  '.github/workflows/support/scripts/setup-solo-stack.sh',
];

// Whether an example's package.json references examples/shared/<sharedPackage>.
const dependsOnShared = (example, sharedPackage) => {
  const packageJson = path.join(__dirname, '..', '..', example.path, 'package.json');
  return fs.existsSync(packageJson) && fs.readFileSync(packageJson, 'utf8').includes(`shared/${sharedPackage}`);
};

const examples = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'examples.json'), 'utf8')).map((example) => ({
  ...example,
  path: `examples/${example.name}`,
}));

const changedFilesPath = process.argv[2];
let selected = examples;

if (changedFilesPath) {
  const changedFiles = fs.readFileSync(changedFilesPath, 'utf8').split('\n').filter(Boolean);
  const sharedChanged = changedFiles.some((file) => SHARED_PATHS.some((shared) => file.startsWith(shared)));
  if (!sharedChanged) {
    const changedShared = new Set(
      changedFiles.filter((file) => file.startsWith('examples/shared/')).map((file) => file.split('/')[2]),
    );
    selected = examples.filter(
      (example) =>
        changedFiles.some((file) => file.startsWith(`${example.path}/`)) ||
        [...changedShared].some((sharedPackage) => dependsOnShared(example, sharedPackage)),
    );
  }
}

const build = selected.filter((example) => example.build);

// `solo_test` is either one command or a { label: command } map that splits a long
// suite into parallel jobs, each on its own Solo network.
const solo = selected.flatMap((example) => {
  if (!example.solo_test) return [];
  if (typeof example.solo_test === 'string') return [example];
  return Object.entries(example.solo_test).map(([label, command]) => ({
    ...example,
    name: `${example.name} (${label})`,
    solo_test: command,
  }));
});

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = selected.map((example) => {
    const tests = [];
    if (example.test) tests.push('offline');
    if (example.solo_test) tests.push(typeof example.solo_test === 'string' ? 'Solo' : `Solo × ${Object.keys(example.solo_test).length}`);
    const coverage = tests.length ? `build + ${tests.join(' + ')} tests` : `build only — ${example.ci_note || 'no tests'}`;
    return `| \`${example.name}\` | ${coverage} |`;
  });
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    ['### Selected examples', '', '| Example | CI |', '| --- | --- |', ...rows, ''].join('\n'),
  );
}

const output = `build=${JSON.stringify(build)}\nsolo=${JSON.stringify(solo)}\n`;
if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
}
console.log(`Selected examples: ${selected.map((example) => example.name).join(', ') || 'none'}`);
