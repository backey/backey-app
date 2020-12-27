const { SHA256 } = require('crypto-js');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const {
  ctx: { anonCtx },
} = require('./Authorization.js');
const { Collection } = require('./Collection');
const {
  system: { projects },
} = require('./index.js');

const PROJECT_DEFAULT_NAME = process.env.PROJECT_DEFAULT_NAME || 'main';

class Projects extends Collection {
  constructor(db = projects) {
    super(db /* TODO: AuthR Strategy */);
  }

  async init(ctx = anonCtx) {
    this._check(ctx.principal, 'init');
    const defaultProject = await this.get(PROJECT_DEFAULT_NAME);
    if (!defaultProject.value) {
      console.log(
        `Creating DEFAULT project with name="${PROJECT_DEFAULT_NAME}"`,
      );
      // TODO: Create as with reasonable context/admin account
      await this.create(PROJECT_DEFAULT_NAME, 'Default project.');
    }
  }

  async create(name, description, ctx = anonCtx) {
    this._check(ctx.principal, 'create');
    const existing = await this.get(name);
    if (!!existing.value) {
      throw new Error(`Project with name ${name} already exists`);
    }
    const project = {
      id: name,
      name,
      description,
    };
    await this.put(PROJECT_DEFAULT_NAME, project);
  }
}

module.exports = {
  Projects,
};
