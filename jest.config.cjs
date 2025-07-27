module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    '^react-firebase-hooks/auth$': '<rootDir>/src/__mocks__/react-firebase-hooks/auth.js',
    '^.*[\\/]+firebase$': '<rootDir>/src/__mocks__/firebase.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
