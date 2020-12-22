const express = require('express');
const cors = require('cors');
const { withUser } = require('./middleware.js');

const userRoutes = require('./users.js');
const tokenRoutes = require('./tokens.js');

const PORT = process.env.API_PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors());

app.use('/a/users', userRoutes);
app.use('/a/tokens', tokenRoutes);

app.get('/', (req, res) => {
  res.send({ message: 'Hello World!' });
});

app.get('/me', [withUser], async (req, res) => {
  res.send(req.principal);
});

function start() {
  return new Promise((res) => {
    app.listen(PORT, () => {
      console.log(`Server listening on port=${PORT}`);
      res();
    });
  });
}

module.exports = {
  start,
};