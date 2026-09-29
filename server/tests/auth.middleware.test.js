import test from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'test-only-secret';

const { authenticate } = await import('../src/middleware/auth.middleware.js');
const { generateToken } = await import('../src/utils/jwt.js');

test('protected routes reject a request without a session', async () => {
  const error = await new Promise((resolve) => authenticate({ headers: {} }, {}, resolve));
  assert.equal(error.statusCode, 401);
});

test('protected routes accept an HttpOnly session cookie', async () => {
  const token = generateToken({ id: 7, email: 'staff@example.test', role: 'STAFF' });
  const request = { headers: { cookie: `astraeon_session=${token}` } };
  const error = await new Promise((resolve) => authenticate(request, {}, resolve));
  assert.equal(error, undefined);
  assert.deepEqual(request.user, { id: 7, email: 'staff@example.test', role: 'STAFF' });
});
