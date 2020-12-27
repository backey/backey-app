const express = require('express');
const cors = require('cors');
const { withUser } = require('./middleware.js');

const userRoutes = require('./users.js');
const tokenRoutes = require('./tokens.js');
const projectRoutes = require('./projects.js');

const PORT = process.env.API_PORT || 8080;

const app = express();
app.use(express.json());
app.use(cors());
app.use(withUser);

app.use('/a/users', userRoutes.router);
app.use('/a/tokens', tokenRoutes.router);
app.use('/a/projects', projectRoutes.router);

app.get('/', (req, res) => {
  res.send({ message: 'Hello World!' });
});

app.get('/me', async (req, res) => {
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
  app,
  start,
};
