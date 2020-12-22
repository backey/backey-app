const router = require('express').Router();
const {
  system: { users },
} = require('../db/collections.js');

router.get('/', async (req, res) => {
  const rs = await users.list();
  res.send(rs);
});

router.get('/_info', async (req, res) => {
  const rs = await users.info();
  res.send(rs);
});

router.get('/_count', async (req, res) => {
  const rs = await users.count();
  res.send(rs);
});

router.delete('/', async (req, res) => {
  const rs = await users.info();
  await users.truncate();
  res.send(rs);
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const rs = await users.get(id);
  res.send(rs);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const rs = await users.get(id);
  await users.remove(id);
  res.send(rs);
});

module.exports = router;
