// SPDX-License-Identifier: Apache-2.0

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/'], // Ignore these folders
  moduleFileExtensions: ['ts', 'js', 'json', 'node'], // File extensions to be considered
  transform: {
    '^.+\\.ts$': 'ts-jest', // Transform TypeScript files
  },
};
