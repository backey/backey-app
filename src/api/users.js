'strict';
const express = require('express');
const _ = require('lodash');
const {
  system: { users },
} = require('../db/collections.js');

const router = express.Router();

/*
 * =====================
 *   USERS COLLECTION
 * =====================
 */

/**
 * List users
 */
router.get('/', async (req, res) => {
  const { principal } = req;
  const rs = await users.list(principal);
  res.send(rs);
});

/**
 * Get Users collection information
 */
router.get('/_info', async (req, res) => {
  const { principal } = req;
  const rs = await users.info(principal);
  res.send(rs);
});

/**
 * Count users in collection
 */
router.get('/_count', async (req, res) => {
  const { principal } = req;
  const rs = await users.count(principal);
  res.send({ count: rs });
});

/**
 * Truncate and re-initilize admin collection
 */
router.delete('/', async (req, res) => {
  // TODO: AuthR check for all operations
  const { principal } = req;
  const before = await users.info(principal);
  await users.truncate(principal);
  await users.init(principal);
  const after = await users.info(principal);
  res.send({ before, after });
});

/*
 * =====================
 *   CREATE ACCOUNTS
 * =====================
 */

/**
 * Register new user
 */
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await users.register(username, password);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Username already exists' });
  }
});

/*
 * =====================
 *   MANAGE USERS
 * =====================
 */

/**
 * Update user password
 */
router.put('/:username', async (req, res) => {
  try {
    const { principal } = req;
    const { newPassword, oldPassword } = req.body;
    const { username } = req.params;
    const user = await users.updatePassword(
      username,
      oldPassword,
      newPassword,
      principal,
    );
    res.send(user);
  } catch ({ code = 500, message }) {
    console.error(message);
    res.status(code).send({ message });
  }
});

/**
 * Fetch use details by id
 */
router.get('/:username', async (req, res) => {
  try {
    const { principal } = req;
    const { username } = req.params;
    const existing = await users.get(username, principal);
    res.send(existing);
  } catch ({ code = 500, message }) {
    console.error(message);
    res.status(code).send({ message });
  }
});

/**
 * Delete user by id
 */
router.delete('/:username', async (req, res) => {
  try {
    const { principal } = req;
    const { username } = req.params;
    const existing = await users.get(username, principal);
    if (!!existing.value) {
      await users.remove(username, principal);
    }
    res.send(existing);
  } catch ({ code = 500, message }) {
    console.error(message);
    res.status(code).send({ message });
  }
});

/*
 * =====================
 *   MANAGE ROLES
 * =====================
 */

/**
 * Add role to user. Idempotent.
 */
router.post('/:username/roles/:role', async (req, res) => {
  const { principal } = req;
  const { username, role } = req.params;
  try {
    const user = await users.addRole(username, role, principal);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to add role' });
  }
});

/**
 * Remove role from user. Idempotent.
 */
router.delete('/:username/roles/:role', async (req, res) => {
  const { principal } = req;
  const { username, role } = req.params;
  try {
    const user = await users.removeRole(username, role, principal);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to add role' });
  }
});

module.exports = {
  router,
};
