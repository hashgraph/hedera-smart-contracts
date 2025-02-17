// SPDX-License-Identifier: Apache-2.0

import nextJest from 'next/jest.js';

/**
 * @notice More information on testing NextJs project with Jest can be found here at
 *         https://nextjs.org/docs/pages/building-your-application/optimizing/testing#jest-and-react-testing-library
 */

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['./__tests__/utils/'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
