const path = require('path');
const fs = require('fs');

/**
 * @param {string} contract
 * @returns {{ abi: unknown, bytecode: string }}
 */
function loadArtifact(contract) {
  const artifactPath = path.resolve(__dirname, `../../artifacts/contracts/${contract}.sol/${contract}.json`);
  if (!fs.existsSync(artifactPath)) throw new Error(`Artifact not found at path: ${artifactPath}`);
  return require(artifactPath);
}

module.exports = { loadArtifact }
