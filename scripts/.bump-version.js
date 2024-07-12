const replace = require('replace');
const { execSync } = require('child_process');

const versionRegex = /\d+\.\d+\.\d+(-\w+)?/i;
const newVersion = process.env.SEM_VER;

function checkVersion(semver) {
  if (semver == undefined || semver == '') {
    console.log('semver cannot be blank');
    process.exit(1);
  }

  if (semver.match(versionRegex) == undefined) {
    console.log(
      `semver: ${semver} must be Semantic Version <Major>.<Minnor>.<Patch>[-<type>], examples: '0.20.0', '0.20.0-rc1'`
    );
    process.exit(1);
  }

  return semver;
}

// check is a valid version
checkVersion(newVersion);
console.log(`Bumping version to: ${newVersion}`);

// bumping version using replace for ./package.json
// looking for: "version": "0.9.0-SNAPSHOT", "version": "0.9.0-rc1", "version": "0.9.0"
const packageRegex = '"version": "\\d+\\.\\d+\\.\\d+(-\\w+)?"';
replace({
  regex: packageRegex,
  replacement: `"version": "${newVersion}"`,
  paths: ['package.json'],
  recursive: false,
  silent: false,
});

// bump package-lock.json using npm itself, by running install it will update packages versions based on previous files
execSync('npm install');
console.log('package-lock.json');
console.log('All files were bumped successfully!');
