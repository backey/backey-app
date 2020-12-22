const express = require('express');
const cors = require('cors');
const { withUser } = require('./middleware.js');

const { usersRouter, tokensRouter } = require('./users.js');

const PORT = process.env.API_PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors());

app.use('/a/users', usersRouter);
app.use('/a/tokens', tokensRouter);

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
