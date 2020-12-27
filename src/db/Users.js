const { SHA256 } = require('crypto-js');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { Collection } = require('./Collection');
const {
  system: { users, userAuth },
} = require('./index.js');
const {
  ctx: { anonCtx },
} = require('./Authorization.js');

const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || 'backey20201226';
const AUTH_JWT_EXP = process.env.AUTH_JWT_EXP || '12h';
const AUTH_JWT_ISS = process.env.AUTH_JWT_ISS || 'backey:)';
const AUTH_PASSWORD_SALT = process.env.AUTH_PASSWORD_SALT || 'backey20201226';
const AUTH_DEFAULT_ADMIN = process.env.AUTH_DEFAULT_ADMIN || 'backmin';
const AUTH_DEFAULT_PASS = process.env.AUTH_DEFAULT_PASS || 'backback'; // TODO: randomize, e.g. nanoid(16);

const hash = (password) =>
  SHA256(`${AUTH_PASSWORD_SALT}::${password}`).toString();

class Users extends Collection {
  constructor(db = users, userAuthDb = userAuth) {
    super(db /* TODO: authorication strategy */);
    this.userAuthCollection = new Collection(userAuthDb);
  }

  async init(ctx = anonCtx) {
    this._check(ctx.principal, 'init', null);
    let admin = await this.get('backmin');
    if (!admin.value) {
      console.log(
        `Creating ADMIN account for ${AUTH_DEFAULT_ADMIN} with default password="${AUTH_DEFAULT_PASS}." Please rotate the password to something when reasonably possible`,
      );
      await this.register(AUTH_DEFAULT_ADMIN, AUTH_DEFAULT_PASS);
      await this.addRole(AUTH_DEFAULT_ADMIN, 'ADMIN');
      await this.register('u', AUTH_DEFAULT_PASS);
      await this.register('u2', AUTH_DEFAULT_PASS);
    }
  }

  async register(username, password, ctx = anonCtx) {
    this._check(ctx.principal, 'register', null);
    const existing = await this.get(username);
    if (!!existing.value) {
      throw new Error('Username already exists');
    }
    const pHash = hash(password);
    const authModel = { username, pHash };
    const model = { username, roles: ['USER'] };
    await this.userAuthCollection.put(username, authModel);
    await this.put(username, model);
    const updated = await this.get(username);
    return updated;
  }

  async updatePassword(username, oldPassword, newPassword, ctx = anonCtx) {
    this._check(ctx.principal, 'updatePassword', username);
    const existing = await this.getValidBasicUser(username, oldPassword);
    const authModel = {
      ...existing.value,
      pHash: hash(newPassword),
    };
    await this.userAuthCollection.put(username, authModel);
    const updated = await this.get(username);
    return updated;
  }

  async addRole(username, role, ctx = anonCtx) {
    this._check(ctx.principal, 'addRole', username);
    const existing = await this.get(username);
    if (!existing.value) {
      throw new Error(`ADD_ROLE: User doesn't exist "${username}"`);
    }
    const roles = _.get(existing, 'value.roles', []);
    if (!roles.includes(role)) {
      roles.push(role);
      await this.put(username, existing.value);
      const updated = await this.get(username);
      return updated;
    } else {
      return existing;
    }
  }

  async removeRole(username, role, ctx = anonCtx) {
    this._check(ctx.principal, 'removeRole', null);
    const existing = await this.get(username);
    if (!existing.value) {
      throw new Error(`REMOVE_ROLE: User doesn't exist "${username}"`);
    }
    const roles = _.get(existing, 'value.roles', []);
    if (roles.includes(role)) {
      existing.value.roles = roles.filter((r) => r !== role);
      await this.put(username, existing.value);
      const updated = await this.get(username);
      return updated;
    } else {
      return existing;
    }
  }

  async getValidBasicUser(username, providedPassword) {
    const [auth, existing] = await Promise.all([
      this.userAuthCollection.get(username),
      this.get(username),
    ]);
    if (!auth.value || !existing.value) {
      throw new Error(`User ${username} does not exist`);
    }
    const pHash = hash(providedPassword);
    if (auth.value.pHash !== pHash) {
      throw new Error(`User's ${username} passwords do not match: 
        curr(${auth.value.pHash}) != provided(${pHash})`);
      // TODO: logging and reasonable error
    }
    return existing;
  }

  async getValidJwtUser(token) {
    try {
      const payload = this.validateToken(token);
      const username = payload.sub;
      const existing = await this.get(username);
      return existing;
    } catch (error) {
      // console.error(error); // TODO: logging levels
    }
    return { key: null, value: null };
  }

  async getUserToken(username) {
    const payload = {}; // TODO: what to include? + make configuration
    const token = jwt.sign(payload, AUTH_JWT_SECRET, {
      expiresIn: AUTH_JWT_EXP,
      issuer: AUTH_JWT_ISS,
      subject: username,
      // jwtid: nanoid(), TODO: research implications
      // keyid: AUTH_JWT_KEYID, TODO: implement JWT key rotation
    });
    return token;
  }

  validateToken(token) {
    return jwt.verify(token, AUTH_JWT_SECRET);
  }
}

module.exports = {
  Users,
};
