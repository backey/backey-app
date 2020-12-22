const { SHA256 } = require('crypto-js');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { Collection } = require('./Collection');
const {
  system: { users },
} = require('./index.js');

const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET;
const AUTH_JWT_EXP = process.env.AUTH_JWT_EXP;
const AUTH_JWT_ISS = process.env.AUTH_JWT_ISS;
const AUTH_PASSWORD_SALT = process.env.AUTH_PASSWORD_SALT;
const AUTH_DEFAULT_ADMIN = process.env.AUTH_DEFAULT_ADMIN;
const AUTH_DEFAULT_PASS = process.env.AUTH_DEFAULT_PASS;

const hash = (password) =>
  SHA256(`${AUTH_PASSWORD_SALT}::${password}`).toString();

class Users extends Collection {
  constructor(db = users) {
    super(db);
  }

  async init() {
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

  async register(username, password) {
    const existing = await this.get(username);
    if (!!existing.value) {
      throw new Error('Username already exists');
    }
    const pHash = hash(password);
    // TODO: I REALLY need to move pHash to another collection... maybey `system.usersAuth`
    const model = { username, pHash, roles: ['USER'] };
    await this.put(username, model);
    const updated = await this.get(username);
    return updated;
  }

  async updatePassword(username, oldPassword, newPassword) {
    const existing = await this.getValidBasicUser(username, oldPassword);
    const model = {
      ...existing.value,
      pHash: hash(newPassword),
    };
    await this.put(username, model);
    const updated = await this.get(username);
    return updated;
  }

  async addRole(username, role) {
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

  async removeRole(username, role) {
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
    const existing = await this.get(username);
    if (!existing.value) {
      throw new Error(`User ${username} does not exist`);
    }
    if (existing.value.pHash !== hash(providedPassword)) {
      throw new Error(`User's ${username} passwords do not match: 
        curr(${existing.value.pHash}) != provided(${hash(providedPassword)})`);
    }
    return existing;
  }

  async getValidJwtUser(token) {
    const payload = this.validateToken(token);
    const username = payload.sub;
    const existing = await this.get(username);
    if (!existing.value) {
      throw new Error(`User ${username} does not exist`);
    }
    return existing;
  }

  async getUserToken(username) {
    const existing = await this.get(username);
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
