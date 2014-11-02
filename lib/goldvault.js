'use strict';

var Hapi = require('hapi');

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

Goldvault.prototype.getDbConnection = function (config) {
  return require('knex')(config.database);
};

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

Goldvault.prototype.stop = function (callback) {
  var obj = this;
  obj.pack.stop(function () {
    return callback(obj.pack);
  });
};

// export the constructor as the module
module.exports = Goldvault;