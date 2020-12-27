const express = require('express');
const _ = require('lodash');
const {
  system: { users },
} = require('../db/collections.js');

const router = express.Router();

/*
 * =====================
 *   MANAGE TOKENS
 * =====================
 */

/**
 * Generate a new token
 */
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    await users.getValidBasicUser(username, password);
    const token = await users.getUserToken(username);
    res.send({ token });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to generate token' });
  }
});

// TODO: better route/verb?
router.get('/check', async (req, res) => {
  const { token } = req.query;
  try {
    const payload = users.validateToken(token);
    res.send(payload);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Invalid bearker token' });
  }
});

module.exports = { router };
