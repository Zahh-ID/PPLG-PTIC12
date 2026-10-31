if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required.');
process.env.TEST_DATABASE_URL=process.env.DATABASE_URL;
await import('../tests/browser.mjs');
