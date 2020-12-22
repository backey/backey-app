const express = require('express');
const _ = require('lodash');
const { withUser, withUserRole } = require('./middleware.js');
const {
  system: { users },
} = require('../db/collections.js');

const ADMIN_AUTH = withUserRole('ADMIN');
const ERROR_FORBIDDEN = new Error('insufficient privileges');
ERROR_FORBIDDEN.code = 403;

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
 *   USERS COLLECTION
 * =====================
 */

/**
 * List users
 */
router.get('/', [ADMIN_AUTH], async (req, res) => {
  const rs = await users.list();
  res.send(rs);
});

/**
 * Get Users collection information
 */
router.get('/_info', [ADMIN_AUTH], async (req, res) => {
  const rs = await users.info();
  res.send(rs);
});

/**
 * Count users in collection
 */
router.get('/_count', [ADMIN_AUTH], async (req, res) => {
  const rs = await users.count();
  res.send(rs);
});

/**
 * Truncate and re-initilize admin collection
 */
router.delete('/', [ADMIN_AUTH], async (req, res) => {
  const before = await users.info();
  await users.truncate();
  await users.init();
  const after = await users.info();
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
router.put('/:username', [withUser], async (req, res) => {
  try {
    checkSelfOrAdmin(req);
    const { newPassword, oldPassword } = req.body;
    const { username } = req.params;
    const principal = req.principal;
    if (principal.username !== username && !principal.roles.includes('ADMIN')) {
      res.status(403).send({ message: 'insufficient privileges' });
      return;
    }
    const user = await users.updatePassword(username, oldPassword, newPassword);
    res.send(user);
  } catch ({ code = 500, message }) {
    console.error(message);
    res.status(code).send({ message });
  }
});

/**
 * Fetch use details by id
 */
router.get('/:username', [withUser], async (req, res) => {
  try {
    checkSelfOrAdmin(req);
    const { username } = req.params;
    const existing = await users.get(username);
    res.send(existing);
  } catch ({ code = 500, message }) {
    console.error(message);
    res.status(code).send({ message });
  }
});

/**
 * Delete user by id
 */
router.delete('/:username', [withUser], async (req, res) => {
  try {
    checkSelfOrAdmin(req);
    const { username } = req.params;
    const existing = await users.get(username);
    if (!!existing.value) {
      await users.remove(username);
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
router.post('/:username/roles/:role', [ADMIN_AUTH], async (req, res) => {
  const { username, role } = req.params;
  try {
    const user = await users.addRole(username, role);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to add role' });
  }
});

/**
 * Remove role from user. Idempotent.
 */
router.delete('/:username/roles/:role', [ADMIN_AUTH], async (req, res) => {
  const { username, role } = req.params;
  try {
    const user = await users.removeRole(username, role);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to add role' });
  }
});

module.exports = router;
