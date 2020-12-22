const express = require('express');
const _ = require('lodash');
const { withUserRole } = require('./middleware.js');

const usersRouter = express.Router();
const tokensRouter = express.Router();

const {
  system: { users },
} = require('../db/collections.js');

const ADMIN_AUTH = withUserRole('ADMIN');

usersRouter.get('/', [ADMIN_AUTH], async (req, res) => {
  const rs = await users.list();
  res.send(rs);
});

usersRouter.get('/_info', [ADMIN_AUTH], async (req, res) => {
  const rs = await users.info();
  res.send(rs);
});

usersRouter.get('/_count', [ADMIN_AUTH], async (req, res) => {
  const rs = await users.count();
  res.send(rs);
});

// TODO: AUTH::SELF/ADMIN
usersRouter.delete('/', async (req, res) => {
  const rs = await users.info();
  await users.truncate();
  res.send(rs);
});

// REGISTER
usersRouter.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await users.register(username, password);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Username already exists' });
  }
});

// RESET PASSWORD
// TODO: AUTH::SELF/ADMIN
usersRouter.put('/:username', async (req, res) => {
  const { newPassword, oldPassword } = req.body;
  const { username } = req.params;
  try {
    const user = await users.updatePassword(username, oldPassword, newPassword);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to reset password' });
  }
});

usersRouter.post('/:username/roles/:role', [ADMIN_AUTH], async (req, res) => {
  const { username, role } = req.params;
  try {
    const user = await users.addRole(username, role);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to add role' });
  }
});

usersRouter.delete('/:username/roles/:role', [ADMIN_AUTH], async (req, res) => {
  const { username, role } = req.params;
  try {
    const user = await users.removeRole(username, role);
    res.send(user);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to add role' });
  }
});

// TODO: AUTH::SELF/ADMIN
usersRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const rs = await users.get(id);
  res.send(rs);
});

// TODO: AUTH::SELF/ADMIN
usersRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const rs = await users.get(id);
  if (!!rs.value) {
    await users.remove(id);
  }
  res.send(rs);
});

// TODO: AUTH::SELF
tokensRouter.post('/', async (req, res) => {
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
tokensRouter.get('/echo', async (req, res) => {
  const { token } = req.query;
  try {
    const payload = users.validateToken(token);
    res.send(payload);
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: 'Failed to generate token' });
  }
});

module.exports = { usersRouter, tokensRouter };
