import fs from 'node:fs';import assert from 'node:assert/strict';import YAML from 'yaml';
const read=n=>YAML.parse(fs.readFileSync(new URL('../.github/workflows/'+n,import.meta.url),'utf8'));
const checks=read('check.yml'),pages=read('pages.yml');assert.ok(Object.hasOwn(checks.on,'push')&&Object.hasOwn(checks.on,'pull_request'));assert.deepEqual(Object.keys(pages.on),['workflow_dispatch']);assert.equal(pages.on.workflow_dispatch.inputs.publish.default,false);
assert.match(pages.jobs.deploy.if,/inputs\.publish/);assert.match(pages.jobs.deploy.if,/refs\/heads\/main/);assert.equal(pages.jobs.deploy.needs,'build');assert.equal(pages.jobs.deploy.permissions.pages,'write');assert.equal(pages.jobs.deploy.permissions['id-token'],'write');
for(const workflow of [checks,pages]){const job=workflow.jobs.test??workflow.jobs.build;for(const cmd of ['npm ci','npm test','npm run build:web','npm run test:browser'])assert.ok(job.steps.some(s=>s.run===cmd),cmd+' must run before deployment');}
console.log('Workflow checks OK: CI tests/builds; Pages is manual, default dry-run, main-only and gated by successful tests.');
