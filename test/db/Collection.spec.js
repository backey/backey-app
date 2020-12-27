const { expect } = require('chai');
const { nanoid } = require('nanoid');
const { Collection } = require('../../src/db/Collection.js');
const { getAppDb } = require('../../src/db/index.js');

describe('Collection', () => {
  describe('Collection with Anonymous User', () => {
    const appDb = getAppDb(`p-${nanoid(6)}`, `c-${nanoid(6)}`);
    const col = new Collection(appDb /* TODO: authorizationStrategy */);
    it('should allow CRUD', async () => {
      const id = 'testKey-' + nanoid(6);
      const model = { test: true, num: 44 };
      const expected = { id, test: true, num: 44 };
      // Ensure Pre-condition
      let rs = await col.get(id); // NOTE: No context provided, i.e. default to anon
      expect(rs).not.null;
      expect(rs.value).null;
      expect(rs.key).eq(id);
      // CREATE
      rs = await col.put(id, model);
      expect(rs.value).deep.eq(expected);
      // READ
      rs = await col.get(id);
      expect(rs.value).deep.eq(expected);
      // UPDATE
      model.num = 888;
      expected.num = 888;
      rs = await col.put(id, model);
      expect(rs.value).deep.eq(expected);
      rs = await col.get(id);
      expect(rs.value).deep.eq(expected);
      // DELETE
      await col.remove(id);
      rs = await col.get(id);
      expect(rs).not.null;
      expect(rs.value).null;
      expect(rs.key).eq(id);
    });
    it('should allow list and truncate', async () => {
      const expected = [];
      let rs = await col.list();
      expect(rs).deep.eq(expected);
      expected.push(await col.put('a', 1));
      expected.push(await col.put('b', 2));
      expected.push(await col.put('c', 3));
      rs = await col.list();
      expect(rs).deep.eq(expected);
      await col.truncate();
      rs = await col.list();
      expect(rs).deep.eq([]);
    });
    it('should allow count, info and truncate', async () => {
      let count = await col.count();
      let info = await col.info();
      expect(count).deep.eq(0);
      expect(info).deep.eq({ count, first: null, last: null });
      const a = await col.put('a', 1);
      count = await col.count();
      info = await col.info();
      expect(count).deep.eq(1);
      expect(info).deep.eq({ count, first: a, last: null });

      const c = await col.put('c', 3);
      await col.put('b', 2);
      count = await col.count();
      info = await col.info();
      expect(count).deep.eq(3);
      expect(info).deep.eq({ count, first: a, last: c });

      await col.truncate();
      count = await col.count();
      info = await col.info();
      expect(count).deep.eq(0);
      expect(info).deep.eq({ count, first: null, last: null });
    });
  });
});
