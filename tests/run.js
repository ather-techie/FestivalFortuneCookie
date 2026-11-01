const { validateAll } = require('./validate-data');
const { checkApp } = require('./check-app');

let passed = 0;
let failed = 0;

function run(name, fn) {
  try {
    fn();
    passed++;
    console.log(`\nPASS: ${name}`);
  } catch (err) {
    failed++;
    console.error(`\nFAIL: ${name}`);
    console.error(err.message);
  }
}

run('Validate festival data', validateAll);
run('Check app structure', checkApp);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
