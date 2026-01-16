#!/usr/bin/env node
/**
 * Simple script to hash passwords using bcrypt
 * Usage: node hash-password.js <password>
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: node hash-password.js <password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('Hashed password:', hash);
