'use strict';

module.exports = {
  product: {
    name: 'goldvault'
  },
  server: {
    api: {
      host: 'localhost',
      port: 8000
    }
  },
  database: {
    client: 'postgresql' || process.env.GOLDVAULT_DB_CLIENT,
    connection: {
      host: '127.0.0.1' || process.env.GOLDVAULT_DB_HOST,
      user: '' || process.env.GOLDVAULT_DB_USERNAME,
      password: '' || process.env.GOLDVAULT_DB_PASSWORD,
      database: 'goldvault' || process.env.GOLDVAULT_DB_DATABASE
      //port: '27017' || process.env.GOLDVAULT_DB_PORT,
    }
  },
  plugins: {}
  //plugins: {
  //  'node_modules/good'                 : config.plugins.good,
  //  'node_modules/hapi-swagger'         : config.plugins['hapi-swagger']
  //  'myapp/plugins/database'            : config.database,
  //  'myapp/plugins/auth'                : config.plugins.auth,
  //}
};