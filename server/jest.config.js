/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^shared/(.*)$': '<rootDir>/../shared/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        rootDir: '..',
        baseUrl: '..',
        paths: {
          'shared/*': ['shared/*'],
        },
      },
    }],
  },
};
