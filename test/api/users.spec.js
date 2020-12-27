const chai = require('chai');
const _ = require('lodash');
const { nanoid } = require('nanoid');
const chaiHttp = require('chai-http');
const { app } = require('../../src/api/index.js');
const {
  system: { users },
} = require('../../src/db/collections.js');

// Configure chai
chai.use(chaiHttp);
chai.should();

const { expect } = chai;
(async () => {
  await users.truncate();
  const username = `u${nanoid(6)}`;
  await users.register(username, nanoid());
  const token = await users.getUserToken(username);
  const authHeader = `bearer ${token}`;
  function call(url, validate, method = 'get') {
    chai
      .request(app)
      [method](url)
      .set('authorization', authHeader)
      .end(validate);
  }
  function callWithData(url, data, validate, method = 'post') {
    chai
      .request(app)
      [method](url)
      .set('authorization', authHeader)
      .send(data)
      .end(validate);
  }
  const get = (url, validate) => call(url, validate, 'get');
  const del = (url, validate) => call(url, validate, 'delete');
  const post = (url, data, validate) =>
    callWithData(url, data, validate, 'post');
  const put = (url, data, validate) => callWithData(url, data, validate, 'put');

  describe('API - Users', function () {
    describe('CollectionInfo ', () => {
      it('count should return count for initialized system collection', (done) => {
        get('/a/users/_count', (err, res) => {
          res.should.have.status(200);
          const { count } = res.body;
          expect(count).to.be.greaterThan(4);
          done();
        });
      });
      it('info should return info for initialized system collection', (done) => {
        get('/a/users/_info', (err, res) => {
          res.should.have.status(200);
          const { count, first, last } = res.body;
          expect(count).to.be.greaterThan(4);
          expect(first).not.null;
          expect(last).not.null;
          done();
        });
      });
    });
    describe('READ', () => {
      it('list should list users', (done) => {
        get('/a/users', (err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          const users = res.body;
          const usernameCount = users.filter(({ key }) => key === username)
            .length;
          expect(usernameCount).eq(1);
          done();
        });
      });
      it('details should get user details users', (done) => {
        get(`/a/users/${username}`, (err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(res.body.key).eq(username);
          expect(res.body.value).not.null;
          done();
        });
      });
    });
    describe('lifecycle', () => {
      it('should register, update, and delete user', (done) => {
        const tmpUname = `u${nanoid(6)}`;
        const tmpPw = nanoid();
        post(
          `/a/users`,
          { username: tmpUname, password: tmpPw },
          (err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            expect(res.body.key).eq(tmpUname);
            expect(res.body.value).not.null;
            put(
              `/a/users/${tmpUname}`,
              { oldPassword: tmpPw, newPassword: tmpPw },
              (err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                expect(res.body.key).eq(tmpUname);
                expect(res.body.value).not.null;
                del(`/a/users/${tmpUname}`, (err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('object');
                  expect(res.body.key).eq(tmpUname);
                  expect(res.body.value).not.null;
                  done();
                });
              },
            );
          },
        );
      });
      it('should add/remove roles', (done) => {
        const role = `r${nanoid(6)}`;
        post(`/a/users/${username}/roles/${role}`, null, (err, res) => {
          res.should.have.status(200);
          expect(res.body.key).eq(username);
          res.body.should.be.a('object');
          const roles = _.get(res.body, 'value.roles');
          expect(roles).not.null;
          expect(roles).includes(role);
          del(`/a/users/${username}/roles/${role}`, (err, res) => {
            res.should.have.status(200);
            expect(res.body.key).eq(username);
            res.body.should.be.a('object');
            const roles = _.get(res.body, 'value.roles');
            expect(roles).not.null;
            expect(roles).not.includes(role);
            done();
          });
        });
      });
    });
  });
})();
