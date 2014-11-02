'use strict';

var Hapi = require('hapi');

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

  obj.manifest = {
    pack: {
      app: {
        config: config,
        knex: knex || obj.getDbConnection(config)
      }
    },
    servers: [
      {
        host: config.server.api.host,
        port: config.server.api.port,
        options: {
          labels: 'api',
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
Goldvault.prototype.init = function(callback) {
  var obj = this;

  Hapi.Pack.compose(obj.manifest, {requirePath: __dirname},
    function (err, pack) {
      obj.initialized = true;
      obj.pack = pack;
      obj.pack.start(function() {
        return callback();
      });
    }
  );
};

/**
 * Starts Hapi. Will initialize the first time.
 * Returns the pack with the callback.
 * @param callback
 */
Goldvault.prototype.start = function (callback) {
  var obj = this;

  if (obj.initialized) {
    obj.pack.start(function () {
      return callback(obj.pack);
    });
  }
  else {
    obj.init(function() {
      callback(obj.pack);
    });
  }
};

/**
 * Stops Hapi. Can be started again.
 * Returns the pack with the callback.
 * @param callback
 */
Goldvault.prototype.stop = function (callback) {
  var obj = this;
  obj.pack.stop(function () {
    return callback(obj.pack);
  });
};

// export the constructor as the module
module.exports = Goldvault;