const _ = require('lodash');
const {
  authR: { openAuthRStrategy },
  ctx: { anonCtx },
} = require('./Authorization.js');

// TODO: updated by
const to = (key, value, oldRow, principal) => {
  const row = { key, value: { ...value, id: key }, updatedAt: Date.now() };
  row.updatedBy = _.get(principal, 'id', null);
  row.createdAt = _.get(oldRow, 'createdAt', row.updatedAt);
  row.createdBy = _.get(oldRow, 'createdBy', row.updatedBy);
  const binRow = Buffer.from(JSON.stringify(row));
  return { row, binRow };
};

const from = (data) => {
  if (!!data) {
    try {
      return JSON.parse(data.toString('utf8'));
    } catch (err) {
      return data.toString();
    }
  }
  return null;
};

class Collection {
  /**
   *
   * @param {object} db levelup database from `/src/db/index.js::get*Db(...)`
   * @param {AuthorizationStrategy} authorizationStrategy Strategy should handle at least
   *   the following operations: `[count, info, put, get, list, remove, truncate]`
   */
  // TODO: locked by default?
  constructor(db, authorizationStrategy = openAuthRStrategy) {
    this.db = db;
    this.authR = authorizationStrategy;
  }
  _check(principal, operation, targetId) {
    this.authR.check(principal, operation, targetId, this);
  }
  /**
   * See https://www.npmjs.com/package/levelup#dbcreatereadstreamoptions
   * @param {*} options
   */
  count(options, ctx = anonCtx) {
    this.authR.check(ctx.principal, 'count', null, this);
    return new Promise((res, rej) => {
      let count = 0;
      this.db
        .createKeyStream(options)
        .on('data', () => count++)
        .on('error', (err) => {
          console.error(err);
          rej(err);
        })
        .on('close', () => {
          // console.log('Stream closed');
        })
        .on('end', () => {
          //   console.log('Stream ended');
          res(count);
        });
    });
  }
  async info(ctx = anonCtx) {
    this.authR.check(ctx.principal, 'info', null, this);
    const count = await this.count(ctx);
    let first = null;
    let last = null;
    if (count > 0) {
      first = (await this.list({ limit: 1 }, ctx))[0];
      last = (await this.list({ limit: 1, reverse: true }, ctx))[0];
      if (first.key === last.key) {
        last = null;
      }
    }
    return {
      count,
      first,
      last,
    };
  }
  async put(key, value, ctx = anonCtx) {
    const { principal } = ctx;
    this.authR.check(principal, 'put', null, this);
    // TODO: updated by...
    const oldRow = await this.get(key, ctx);
    const { row, binRow } = to(key, value, oldRow, principal);
    await this.db.put(key, binRow);
    return row;
  }
  async get(key, ctx = anonCtx) {
    this.authR.check(ctx.principal, 'get', null, this);
    try {
      const data = await this.db.get(key);
      return from(data);
    } catch (error) {
      //   console.error(error);
      // TODO: log levels? console.trace(error);
    }
    return { key, value: null };
  }
  /**
   * See https://www.npmjs.com/package/levelup#dbcreatereadstreamoptions
   * @param {*} options
   */
  list(options = {}, ctx = anonCtx) {
    this.authR.check(ctx.principal, 'list', null, this);
    options.keys = false;
    return new Promise((res, rej) => {
      let rows = [];
      this.db
        .createReadStream(options)
        .on('data', (data) => {
          //   console.log({ data });
          rows.push(from(data));
        })
        .on('error', (err) => {
          console.error(err);
          rej(err);
        })
        .on('close', () => {
          //   console.log('Stream closed');
        })
        .on('end', () => {
          //   console.log('Stream ended');
          res(rows);
        });
    });
  }
  async remove(key, ctx = anonCtx) {
    this.authR.check(ctx.principal, 'remove', null, this);
    const curr = await this.get(key, ctx);
    if (!!curr) {
      await this.db.del(key);
    }
    return curr;
  }
  async truncate(ctx = anonCtx) {
    this.authR.check(ctx.principal, 'truncate', null, this);
    const count = await this.count(ctx);
    await this.db.clear();
    return count;
  }
}

module.exports = { Collection };
