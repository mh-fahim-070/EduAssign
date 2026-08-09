import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateToken, verifyToken, hashPassword, verifyPassword } from '../server/auth.js';
import { loginSchema, createUserSchema } from '../server/validation.js';
import { UserRole } from '../types/index.js';

describe('JWT Service & Password Hashing Unit Tests', () => {
  test('should correctly hash and verify password', () => {
    const rawPassword = 'SecurePassword123!';
    const hash = hashPassword(rawPassword);

    assert.ok(hash !== rawPassword);
    assert.strictEqual(verifyPassword(rawPassword, hash), true);
    assert.strictEqual(verifyPassword('WrongPassword', hash), false);
  });

  test('should generate and verify JWT token payload', () => {
    const dummyUser = {
      id: 'usr-admin-1',
      name: 'System Admin',
      email: 'admin@school.edu',
      role: 'Admin' as UserRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const token = generateToken(dummyUser);
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = verifyToken(token);
    assert.ok(decoded !== null);
    assert.strictEqual(decoded.userId, dummyUser.id);
    assert.strictEqual(decoded.email, dummyUser.email);
    assert.strictEqual(decoded.role, dummyUser.role);
  });

  test('should fail token verification for invalid or malformed tokens', () => {
    assert.strictEqual(verifyToken('invalid.token.string'), null);
    assert.strictEqual(verifyToken(''), null);
  });

  test('should validate Login Request DTO using loginSchema', () => {
    const validLogin = loginSchema.safeParse({
      email: 'teacher@school.edu',
      password: 'password123',
    });
    assert.strictEqual(validLogin.success, true);

    const invalidEmail = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });
    assert.strictEqual(invalidEmail.success, false);

    const missingPassword = loginSchema.safeParse({
      email: 'teacher@school.edu',
    });
    assert.strictEqual(missingPassword.success, false);
  });

  test('should validate Create User DTO using createUserSchema', () => {
    const validUser = createUserSchema.safeParse({
      name: 'New Teacher',
      email: 'newteacher@school.edu',
      password: 'secretPassword123',
      role: 'Teacher',
    });
    assert.strictEqual(validUser.success, true);

    const invalidRole = createUserSchema.safeParse({
      name: 'Super User',
      email: 'superuser@school.edu',
      password: 'secretPassword123',
      role: 'SuperAdmin',
    });
    assert.strictEqual(invalidRole.success, false);
  });
});
