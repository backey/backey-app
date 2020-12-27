const { expect } = require('chai');
const { nanoid } = require('nanoid');
const { withUser } = require('../../src/api/middleware.js');
const {
  system: { users },
} = require('../../src/db/collections.js');

describe('API Middleware', () => {
  describe('withUser Request Decorator', () => {
    describe('Anonymous Users', () => {
      async function runAnonTest(req, error, token = null) {
        const res = null;
        let called = false;
        const next = () => (called = true);
        await withUser(req, res, next);
        expect(called).true;
        expect(req.token).eq(token);
        expect(req.principal).not.null;
        expect(req.principal).deep.eq({
          id: 'anonymous',
          username: 'anonymous',
          roles: ['ANONYMOUS'],
          error,
        });
      }
      it('should recognize anon user for missing authorization header', async () => {
        const req = { headers: {} };
        await runAnonTest(req, 'missing token');
      });
      it('should recognize anon user for misformed authorization header', async () => {
        const req = { headers: { authorization: 'invalid token-123' } };
        await runAnonTest(req, 'missing token');
      });
      it('should recognize anon user for invalid bearer token', async () => {
        const token = 'token-123';
        const req = { headers: { authorization: `bearer ${token}` } };
        await runAnonTest(req, 'invalid token', token);
      });
      it('should recognize anon user for invalid signature bearer token', async () => {
        const token =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDkwMTAzNzgsImV4cCI6MTYwOTA1MzU3OCwiaXNzIjoiYmFja2V5OjowLjEuMCIsInN1YiI6ImJhY2ttaW4ifQ.NoBycdLevz7yVkHeNVSCvnITvKNSE_bSNy1MyC0ANvQ';
        const req = { headers: { authorization: `bearer ${token}` } };
        await runAnonTest(req, 'invalid token', token);
      });
      it('should recognize anon user for expired bearer token', async () => {
        const token =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDkwMzk1MjksImV4cCI6MTYwOTAzOTU4OSwiaXNzIjoiYmFja2V5OikiLCJzdWIiOiJiYWNrbWluIn0.K825xtnVfV_xuIaYkA1vaMeQgPBytIsbd6s6zMpmvrA';
        const req = { headers: { authorization: `bearer ${token}` } };
        await runAnonTest(req, 'invalid token', token);
      });
    });
    it('should recognize user for valid bearer token', async () => {
      const username = `u${nanoid(4)}`;
      const password = `${nanoid()}`;
      const { value: expected } = await users.register(username, password);
      const token = await users.getUserToken(username);
      const req = { headers: { authorization: `bearer ${token}` } };
      const res = null;
      let called = false;
      const next = () => (called = true);
      await withUser(req, res, next);
      expect(called).true;
      expect(req.token).eq(token);
      expect(req.principal).not.null;
      expect(req.principal).deep.eq(expected);
    });
  });
});
