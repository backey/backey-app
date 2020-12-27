const { expect } = require('chai');
const { nanoid } = require('nanoid');
const { system } = require('../../src/db/collections.js');
const { projects, realm, userAuth, users } = system;

const AUTH_DEFAULT_ADMIN = 'backmin';
const AUTH_DEFAULT_PASS = 'backback';
const PROJECT_DEFAULT_NAME = 'main';

describe('System Collections', () => {
  describe('system', () => {
    it('should have non-null projects collection', () =>
      expect(projects).not.null);
    it('should have non-null userAuth collection', () =>
      expect(userAuth).not.null);
    it('should have non-null users collection', () => expect(users).not.null);
    it('should have standard "system" realm', () => expect(realm).eq('system'));
  });
  describe('System Users', () => {
    const expectedAdmin = {
      id: AUTH_DEFAULT_ADMIN,
      username: AUTH_DEFAULT_ADMIN,
      roles: ['USER', 'ADMIN'],
    };
    it('should initialize users with default admin user', async () => {
      const admin = await users.get(AUTH_DEFAULT_ADMIN); // TODO: pass in appropriate context
      expect(admin.value).not.null;
      expect(admin.value).deep.eq(expectedAdmin);
    });
    it('should use default credentials for admin user', async () => {
      const basicUser = await users.getValidBasicUser(
        AUTH_DEFAULT_ADMIN,
        AUTH_DEFAULT_PASS,
      );
      expect(basicUser.value).deep.eq(expectedAdmin);
    });
  });
  describe('System Projects', () => {
    it('should initialize projects with default main project', async () => {
      const main = await projects.get(PROJECT_DEFAULT_NAME);
      expect(main.value).deep.eq({
        id: PROJECT_DEFAULT_NAME,
        name: PROJECT_DEFAULT_NAME,
        description: 'Default project.',
      });
    });
  });
});
