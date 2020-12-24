const fs = require('fs');
const path = require('path');
const levelup = require('levelup');
const leveldown = require('leveldown');

const CACHE = {};

const DATA_PATH = process.env.DB_DATA_PATH;
const REALM_APP = 'app';
const REALM_SYSTEM = 'system';

if (!DATA_PATH) {
  throw new Error('Persistent data path not found');
}

const getDb = (dbFilePath) => {
  console.log('Fetching DB for', { dbFilePath });

  if (!CACHE[dbFilePath]) {
    if (!fs.existsSync(dbFilePath)) {
      fs.mkdirSync(dbFilePath, { recursive: true });
    }
    CACHE[dbFilePath] = levelup(leveldown(dbFilePath));
  }
  return CACHE[dbFilePath];
};

/**
 *
 * @param {string} projectId
 * @param {string} collectionId
 * @returns kv database
 */
function getAppDb(projectId, collectionId) {
  console.log(`Fetching app DB for ${projectId}@${collectionId}`);
  return getDb(
    path.join(DATA_PATH, 'projects', projectId, REALM_APP, collectionId),
  );
}

/**
 *
 * @param {string} projectId
 * @param {string} collectionId
 * @returns kv database
 */
const getSystemDb = (collectionId) => {
  console.log(`Fetching system DB for ${collectionId}`);
  return getDb(path.join(DATA_PATH, REALM_SYSTEM, collectionId));
};

// TODO: get project DB to enumerate collections within a project

const system = {
  realm: REALM_SYSTEM,
  projects: getSystemDb('projects'),
  users: getSystemDb('users'),
  userAuth: getSystemDb('userAuth'),
};

module.exports = {
  getAppDb,
  getSystemDb,
  system,
};
