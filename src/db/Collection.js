const _ = require('lodash');

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
   */
  constructor(db) {
    this.db = db;
    // TODO: AuthorizationStrategy
  }
  /**
   * See https://www.npmjs.com/package/levelup#dbcreatereadstreamoptions
   * @param {*} options
   */
  count(options) {
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
  async info() {
    const count = await this.count();
    let first = null;
    let last = null;
    if (count > 0) {
      first = (await this.list({ limit: 1 }))[0];
      last = (await this.list({ limit: 1, reverse: true }))[0];
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
  async put(key, value) {
    // TODO: updated by...
    const oldRow = await this.get(key);
    const { row, binRow } = to(key, value, oldRow);
    await this.db.put(key, binRow);
    return row;
  }
  async get(key) {
    try {
      const data = await this.db.get(key);
      return from(data);
    } catch (error) {
      //   console.error(error);
      console.trace(error);
    }
    return { key, value: null };
  }
  /**
   * See https://www.npmjs.com/package/levelup#dbcreatereadstreamoptions
   * @param {*} options
   */
  list(options = {}) {
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
  async remove(key) {
    const curr = await this.get(key);
    if (!!curr) {
      await this.db.del(key);
    }
    return curr;
  }
  async truncate() {
    const count = await this.count();
    await this.db.clear();
    return count;
  }
}

module.exports = { Collection };
