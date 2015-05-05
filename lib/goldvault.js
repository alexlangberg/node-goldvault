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
var Goldvault = function(config, knex) {
  var _this = this;
  _this.initialized = false;

  if (knex === undefined) {
    knex = _this.getDbConnection(config);
  }

  var bookshelf = require('bookshelf')(knex);

  _this.manifest = {
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
Goldvault.prototype.getDbConnection = function(config) {
  return require('knex')(config.database);
};

/**
 * Initiates Hapi.
 * @param callback
 */
Goldvault.prototype.init = function(callback) {
  var _this = this;
  Glue.compose(_this.manifest, {relativeTo: __dirname + '/plugins'},
    function(err, server) {
      _this.initialized = true;
      _this.server = server;
      _this.server.start(function() {
        return callback();
      });
    });
};

/**
 * Starts Hapi. Will initialize the first time.
 * Returns the server with the callback.
 * @param callback
 */
Goldvault.prototype.start = function(callback) {
  var _this = this;
  if (_this.initialized) {
    _this.server.start(function() {
      return callback(_this.server);
    });
  }
  else {
    _this.init(function() {
      callback(_this.server);
    });
  }
};

/**
 * Stops Hapi. Can be started again.
 * Returns the server with the callback.
 * @param callback
 */
Goldvault.prototype.stop = function(callback) {
  var _this = this;
  _this.server.stop(function() {
    return callback(_this.server);
  });
};

// export the constructor as the module
module.exports = Goldvault;