const { Collection } = require('./Collection.js');
const { Users } = require('./Users.js');
const { Projects } = require('./Projects.js');
const { system: systemDBs } = require('./index.js');

const projects = new Projects(systemDBs.projects);
const users = new Users(systemDBs.users);
const userAuth = new Collection(systemDBs.userAuth);

const system = {
  realm: systemDBs.realm,
  projects,
  users,
  userAuth,
};

// initialize system collections with default users/projects
(async () => {
  await users.init();
  await projects.init(); // can/should this be done in parallel?
})();

module.exports = {
  system,
};
