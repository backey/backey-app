const _ = require('lodash');
const {
  system: { users },
} = require('../db/collections.js');

const TOKEN_PATTERN = /^bearer\s+([\w.=-]+)\w*$/i;
const ERROR_UNAUTHORIZED = new Error('invalid authorization header');
ERROR_UNAUTHORIZED.code = 401;
const ERROR_FORBIDDEN = new Error('insufficient priviledges');
ERROR_FORBIDDEN.code = 403;
const HTTP_CODE_INTERNAL_SERVER_ERROR = 500;

// TODO:  caching with LRU eviction? It should probably be pused down to the collection/db layer

const anonId = 'anonymous';

const getAuthUser = async (req) => {
  const authHeader = _.get(req, 'headers.authorization');
  if (!authHeader || !TOKEN_PATTERN.test(authHeader)) {
    // TODO: reserved username on registration
    return {
      token: null,
      principal: {
        id: anonId,
        username: anonId,
        roles: ['ANONYMOUS'],
        error: 'missing token',
      },
    };
  }
  const token = TOKEN_PATTERN.exec(authHeader)[1];
  try {
    const { value: principal } = await users.getValidJwtUser(token);
    if (!!principal) {
      return { token, principal };
    }
  } catch (error) {
    console.error(error);
  }
  return {
    token,
    principal: {
      id: anonId,
      username: anonId,
      roles: ['ANONYMOUS'],
      error: 'invalid token',
    },
  };
};

const withUser = async (req, res, next) => {
  try {
    const { token, principal } = await getAuthUser(req);
    req.token = token;
    req.principal = principal;
    next();
  } catch ({ code = HTTP_CODE_INTERNAL_SERVER_ERROR, message }) {
    // TODO: support anonymous users
    res.status(code).send({ message });
  }
};

module.exports = {
  withUser,
};
