const { execSync } = require('child_process');

try {
  console.log('Running lsof -i :3000...');
  const stdout = execSync('lsof -i :3000').toString();
  console.log(stdout);
} catch (err) {
  console.error('Error:', err.message);
}
