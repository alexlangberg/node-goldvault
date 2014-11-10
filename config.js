'use strict';

module.exports = {
  product: {
    name: 'goldvault',
    docsFolder: '/docs',
    // optionally put some additional info here
    info: {
      contact: 'foo@bar.com'
    }
  },
  server: {
    api: {
      host: 'localhost',
      port: 8000
    }
  },
  // Local database for testing
  database: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    },
    pool: {
      min: 1,
      max: 1
    }
  },
  // Below for postgresql. Fill out or set to '' to use env vars instead
  //database: {
  //  client: 'postgresql' || process.env.GOLDVAULT_DB_CLIENT,
  //  connection: {
  //    host: '127.0.0.1' || process.env.GOLDVAULT_DB_HOST,
  //    user: '' || process.env.GOLDVAULT_DB_USERNAME,
  //    password: '' || process.env.GOLDVAULT_DB_PASSWORD,
  //    database: 'goldvault' || process.env.GOLDVAULT_DB_DATABASE
  //    port: '5432' || process.env.GOLDVAULT_DB_PORT,
  //  }
  //},
  plugins: {
    'node_modules/lout': {},
    'plugins/goldvault.js': {}
  }
};