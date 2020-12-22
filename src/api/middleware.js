const _ = require('lodash');
const {
  system: { users },
} = require('../db/collections.js');

const TOKEN_PATTERN = /^bearer\s+([A-Za-z0-9=.-]+)\w*$/i;
const ERROR_UNAUTHORIZED = new Error('invalid authorization header');
ERROR_UNAUTHORIZED.code = 401;
const ERROR_FORBIDDEN = new Error('insufficient priviledges');
ERROR_FORBIDDEN.code = 403;
const HTTP_CODE_INTERNAL_SERVER_ERROR = 500;

// TODO: caching? It should probably be pused down to the collection/db layer

const getValidJwtUser = async (req) => {
  const authHeader = _.get(req, 'headers.authorization');
  if (!authHeader || !TOKEN_PATTERN.test(authHeader)) {
    throw ERROR_UNAUTHORIZED;
  }
  const token = TOKEN_PATTERN.exec(authHeader)[1];
  try {
    const existing = await users.getValidJwtUser(token);
    return { token, principal: existing.value };
  } catch (error) {
    console.error(error);
    throw ERROR_UNAUTHORIZED;
  }
};

const withUser = async (req, res, next) => {
  try {
    const { token, principal } = await getValidJwtUser(req);
    req.token = token;
    req.principal = principal;
    next();
  } catch ({ code = HTTP_CODE_INTERNAL_SERVER_ERROR, message }) {
    res.status(code).send({ message });
  }
};

const withUserRole = (role) => async (req, res, next) => {
  try {
    const { token, principal } = await getValidJwtUser(req);
    if (principal.roles.includes(role)) {
      req.token = token;
      req.principal = principal;

      next();
    } else {
      throw ERROR_FORBIDDEN;
    }
  } catch ({ code = HTTP_CODE_INTERNAL_SERVER_ERROR, message }) {
    res.status(code).send({ message });
  }
};

module.exports = {
  withUser,
  withUserRole,
};
