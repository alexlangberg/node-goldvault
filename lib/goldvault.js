'use strict';

var Glue = require('glue');
var Db = require('./db');
/**
 * Constructor for goldvault.
 * Should be instantiated with "new Goldvault(config[, knex])".
 * If no knex object is provided, the database from config.js will be used.
 * @param {object} config
 * @param {Knex=} knex - an optional instance of a knex connection
 * @constructor
 */
var Goldvault = function (config, knex) {
  var obj = this;
  obj.initialized = false;

  if (knex === undefined) {
    knex = obj.getDbConnection(config);
  }
  var bookshelf = require('bookshelf')(knex);

  obj.manifest = {
    server: {
      app: {
        config: config,
        bookshelf: bookshelf,
        db: new Db(bookshelf)
      }
    },
    connections: [
      {
        host: config.server.api.host,
        port: config.server.api.port,
        labels: ['api'],
        routes: {
          cors: true
        }
      }
    ],
    plugins: config.plugins
  };
};

/**
 * Used to get a new knex connection if none was provided.
 * @param {object} config
 * @returns {Knex}
 */
Goldvault.prototype.getDbConnection = function (config) {
  return require('knex')(config.database);
};

/**
 * Initiates Hapi.
 * @param callback
 */
Goldvault.prototype.init = function (callback) {
  var obj = this;
  Glue.compose(obj.manifest, {relativeTo: __dirname + '/plugins'},
    function (err, server) {
      obj.initialized = true;
      obj.server = server;
      obj.server.start(function () {
        return callback();
      });
    }
  );
};

/**
 * Starts Hapi. Will initialize the first time.
 * Returns the server with the callback.
 * @param callback
 */
Goldvault.prototype.start = function (callback) {
  var obj = this;
  if (obj.initialized) {
    obj.server.start(function () {
      return callback(obj.server);
    });
  }
  else {
    obj.init(function () {
      callback(obj.server);
    });
  }
};

/**
 * Stops Hapi. Can be started again.
 * Returns the server with the callback.
 * @param callback
 */
Goldvault.prototype.stop = function (callback) {
  var obj = this;
  obj.server.stop(function () {
    return callback(obj.server);
  });
};

// export the constructor as the module
module.exports = Goldvault;