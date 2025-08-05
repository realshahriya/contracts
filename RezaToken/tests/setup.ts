import { beforeAll } from '@jest/globals';

beforeAll(async () => {
    // Global test setup
    console.log('🧪 Setting up RezaToken tests...');
    
    // Set test timeout
    jest.setTimeout(30000);
    
    // Mock console.log for cleaner test output
    const originalLog = console.log;
    console.log = (...args: any[]) => {
        if (process.env.VERBOSE_TESTS === 'true') {
            originalLog(...args);
        }
    };
});