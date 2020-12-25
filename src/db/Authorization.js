const _ = require('lodash');

class AuthoriationError extends Error {
  /**
   *
   * @param {object} principal usually the authorized user, but could be a system user for automation
   * @param {string} principal.id
   * @param {string} operation Can be any string, e.g. "READ", "create_token"
   * @param {object?} target
   * @param {string} target.kind the object type, e.g. project, user, post
   * @param {string} target.id
   */
  constructor(principal, operation, target) {
    super(`${principal.id} SHANT ${operation} on ${target.kind}@${target.id}`);
    this.principal = principal;
    this.operation = operation;
    this.target = target;
  }
}

const FAIL = async () => false;

class AuthorizationStrategy {
  constructor(handlers = {}, fallback = FAIL) {
    this.handlers = handlers;
    this.fallback = fallback;
  }
  /**
   *
   * @param {object?} principal usually the authorized user, but could be a system user for automation
   * @param {string} principal.id
   * @param {string[]} principal.roles
   * @param {string} operation Can be any string, e.g. "READ", "create_token"
   * @param {string?} targetId
   * @param {Collection?} targetCollection
   */
  async test(principal, operation, targetId, targetCollection) {
    const handler = this.handlers[operation];
    if (_.isFunction(handler)) {
      return handler(principal, operation, targetId, targetCollection);
    }
    return this.fallback(principal, operation, targetId, targetCollection);
  }

  /**
   *
   * @param {object?} principal usually the authorized user, but could be a system user for automation
   * @param {string} principal.id
   * @param {string[]} principal.roles
   * @param {string} operation Can be any string, e.g. "READ", "create_token"
   * @param {string?} targetId
   * @param {Collection?} targetCollection
   */
  async check(principal, operation, targetId, targetCollection) {
    const isAllowed = await this.test(
      principal,
      operation,
      targetId,
      targetCollection,
    );
    if (!isAllowed) {
      throw new AuthoriationError(principal, operation, target);
    }
  }
}

async function openStrat() {
  return true;
}

async function withUserStrat(principal) {
  return !!principal;
}

async function adminStrat(principal) {
  if (await withUserStrat(principal)) {
    return principal.roles.includes('ADMIN');
  }
  return false;
}

async function selfOrAdminStrat(principal, operation, targetId) {
  if (await withUserStrat(principal)) {
    if (principal.id === targetId) {
      return true;
    }
    return await adminStrat(principal);
  }
  return false;
}

const openAuthRStrategy = new AuthorizationStrategy({}, openStrat);

const systemCtx = { principal: { id: 'SYSTEM', roles: ['SYSTEM'] } };
const anonCtx = { principal: { id: 'ANONYMOUS', roles: [] } };

module.exports = {
  AuthoriationError,
  AuthorizationStrategy,
  authR: {
    openAuthRStrategy,
  },
  strats: {
    openStrat,
    withUserStrat,
    adminStrat,
    selfOrAdminStrat,
  },
  ctx: {
    anonCtx,
    systemCtx,
  },
};
