// Simple script to generate bcrypt password hashes for seed data
// Run with: bun run database/generate-hashes.js

import bcrypt from 'bcryptjs';

const passwords = {
  officer1: 'admin123',
  employee1: 'emp123',
  employee2: 'emp123',
};

console.log('Generating bcrypt hashes for seed data:\n');

for (const [username, password] of Object.entries(passwords)) {
  const hash = await bcrypt.hash(password, 10);
  console.log(`-- Password for ${username}: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log(`SQL: ('${username}', '${hash}')`);
  console.log('');
}

console.log('\nCopy the hashes into database/seed.sql file.');
