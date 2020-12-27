const { expect } = require('chai');
const { getAppDb, getSystemDb, system } = require('../../src/db/index.js');
const { projects, realm, userAuth, users } = system;

describe('DB', () => {
  describe('`system` services', () => {
    it('should have non-null projects database', () =>
      expect(projects).not.null);
    it('should have non-null userAuth database', () =>
      expect(userAuth).not.null);
    it('should have non-null users database', () => expect(users).not.null);
    it('should have standard "system" realm', () => expect(realm).eq('system'));
  });
});
