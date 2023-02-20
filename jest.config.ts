export default {
    clearMocks: true,
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    testMatch: ['**/test/**/*.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
};
