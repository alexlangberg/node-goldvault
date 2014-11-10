// Update with your config settings.

'use strict';

var Config = require('./config.js');

module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    pool: {
      min: 1,
      max: 1
    }
  },

  production: {
    client: Config.database.client,
    connection: Config.database.connection,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

  //staging: {
  //  client: 'postgresql',
  //  connection: {
  //    database: 'my_db',
  //    user:     'username',
  //    password: 'password'
  //  },
  //  pool: {
  //    min: 2,
  //    max: 10
  //  },
  //  migrations: {
  //    tableName: 'knex_migrations'
  //  }
  //},
};
