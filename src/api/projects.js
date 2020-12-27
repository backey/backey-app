const router = require('express').Router();
const {
  system: { projects },
} = require('../db/collections.js');

router.get('/', async (req, res) => {
  // TODO: Owner/Collaborator/Admin check
  const rs = await projects.list();
  res.send(rs);
});

router.get('/_info', async (req, res) => {
  const rs = await projects.info();
  res.send(rs);
});

router.get('/_count', async (req, res) => {
  const rs = await projects.count();
  res.send(rs);
});

router.delete('/', async (req, res) => {
  const rs = await projects.info();
  await users.truncate();
  res.send(rs);
});

router.get('/:id', async (req, res) => {
  // TODO: Owner/Collaborator/Admin check
  const { id } = req.params;
  const rs = await projects.get(id);
  res.send(rs);
});

router.delete('/:id', async (req, res) => {
  // TODO: Owner/Admin check
  const { id } = req.params;
  const rs = await projects.get(id);
  await projects.remove(id);
  res.send(rs);
});

module.exports = { router };
