import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        fileParallelism: false,
        include: [
            'tests/**/*.test.ts',
            'tests/**/*.spec.ts',
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
        ],
        exclude: [
            'frontend/**',
            'node_modules/**',
            'dist/**',
        ],
    },
});
