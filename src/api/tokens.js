const express = require('express');
const _ = require('lodash');
const { withUser } = require('./middleware.js');
const {
  system: { users },
} = require('../db/collections.js');

const router = express.Router();

// TODO: DRY - dulpicated
const checkSelfOrAdmin = (req) => {
  const { username } = req.params;
  const principal = req.principal;
  if (principal.username !== username && !principal.roles.includes('ADMIN')) {
    throw ERROR_FORBIDDEN;
  }
};

/*
 * =====================
 *   MANAGE TOKENS
 * =====================
 */

/**
 * Generate a new token
 */
router.post('/', [withUser], async (req, res) => {
  try {
    checkSelfOrAdmin(req);
  } catch ({ code, message }) {
    console.error(message);
    res.status(code).send({ message });
  }
  const { username, password } = req.body;
  try {
    users.getValidBasicUser(username, password);
    const token = await users.getUserToken(username);
    res.send({ token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to generate token' });
  }
});

// TODO: better route/verb?
router.get('/echo', async (req, res) => {
  const { token } = req.query;
  try {
    const payload = users.validateToken(token);
    res.send(payload);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to generate token' });
  }
});

module.exports = router;
