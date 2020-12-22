const { Collection } = require('./Collection.js');
const { Users } = require('./Users.js');
const { system: systemDBs } = require('./index.js');

const projects = new Collection(systemDBs.projects);
const users = new Users(systemDBs.users);

const system = {
  realm: systemDBs.realm,
  projects,
  users,
};

// TODO: initialize system collections with default users/projects
(async () => {
  await users.init();
})();

module.exports = {
  system,
};
