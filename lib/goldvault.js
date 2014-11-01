'use strict';

//var Knex = require('knex');
//var Config = require('./config.js');
//var knex = Knex.initialize(Config.database);
//var _ = require('lodash');

var Hapi = require('hapi');

var Goldvault = function (config) {
  var obj = this;

  obj.manifest = {
    pack: {
      app: {
        config: config
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

  obj.initialized = false;
};

Goldvault.prototype.init = function(callback) {
  var obj = this;

  Hapi.Pack.compose(obj.manifest, {requirePath: __dirname},
    function (err, pack) {
      obj.initPack(pack);
      obj.pack.start(function() {
        return callback();
      });
    }
  );
};

Goldvault.prototype.initPack = function (pack) {
  var obj = this;
  obj.initialized = true;
  obj.pack = pack;
  obj.pack.goldvault = {};
};

Goldvault.prototype.start = function (callback) {
  var obj = this;

  if (obj.initialized) {
    obj.pack.start(function () {
      return callback();
    });
  }
  else {
    obj.init(function() {
      callback();
    });
  }
};

Goldvault.prototype.stop = function (callback) {
  var obj = this;
  obj.pack.stop(function () {
    return callback();
  });
};

// export the constructor as the module
module.exports = Goldvault;