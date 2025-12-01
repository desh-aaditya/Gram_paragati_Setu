// TypeScript script to generate seed data with proper password hashes
// Run with: bun run database/generate-seed.ts > seed_with_hashes.sql

import bcrypt from 'bcrypt';

async function generateSeed() {
  // Generate password hashes
  const officerHash = await bcrypt.hash('admin123', 10);
  const empHash1 = await bcrypt.hash('emp123', 10);
  const empHash2 = await bcrypt.hash('emp123', 10);

  const seedSQL = `-- Seed data for development and testing
-- NOTE: This file is auto-generated. Password hashes are properly generated.

-- Insert sample users
INSERT INTO users (username, email, password_hash, role, full_name, phone, department) VALUES
-- Password: admin123
('officer1', 'officer1@gov.in', '${officerHash}', 'officer', 'Officer Admin', '+91-9876543210', 'Department of Social Justice and Empowerment'),
-- Password: emp123
('employee1', 'emp1@gov.in', '${empHash1}', 'employee', 'Employee Test', '+91-9876543211', 'Department of Social Justice and Empowerment'),
-- Password: emp123
('employee2', 'emp2@gov.in', '${empHash2}', 'employee', 'Employee Demo', '+91-9876543212', 'Department of Social Justice and Empowerment');

-- Rest of seed data continues from original seed.sql file...
-- (Copy remaining INSERT statements from seed.sql)
`;

  console.log(seedSQL);
}

generateSeed().catch(console.error);
