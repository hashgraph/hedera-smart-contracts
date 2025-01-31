import type { Config } from 'jest';

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
		'@/(.*)': '<rootDir>/src/$1',
	},
  collectCoverageFrom: ['**/*.{js,jsx}'],
  moduleDirectories: ['node_modules'],
};

export default config;
