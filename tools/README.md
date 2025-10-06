# Tools

This folder groups analysis, indexing, and custom utilities that support development and security review of the smart contracts.

## Subfolders
- analysis/: Integrations with security tools (e.g., Slither, Manticore, Maian). See each subfolder README for installation and usage.
- custom/: Purpose-built helpers such as sevm and raw-bytecode-analyser.
- erc-repository-indexer/: Scripts to index ERC standard contracts from external repositories.

## How to use
- Each subfolder contains a README with installation instructions and example commands.
- Some tools require external dependencies (Python, Docker, etc.). Review the subfolder docs first.

## Related docs
- README.md (root): project overview and prerequisites
- TEST_SETUP.md: testing guidance and environment setup