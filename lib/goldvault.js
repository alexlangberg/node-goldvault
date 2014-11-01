'use strict';

var _ = require('lodash');
var Hapi = require('hapi');
var lout = require('lout');

var Goldvault = function (options) {
  var obj = this;

  if (options === undefined) {
    options = {};
  }
  obj.options = _.extend({
    plugins: []
  }, options);

  obj.pack = new Hapi.Pack();
};

Goldvault.prototype.init = function (callback) {
  var obj = this;
  if (!_.find(obj.options.plugins, lout)) {
    obj.options.plugins.push(lout);
  }
  var pluginObjects = obj.wrapPluginsInObjects(obj.options.plugins);
  obj.registerPlugins(pluginObjects, function() {
    return callback();
  });
};

Goldvault.prototype.registerPlugins = function(pluginObjects, callback) {
  var obj = this;
  obj.pack.register(pluginObjects, function () {
    return callback();
  });
};

Goldvault.prototype.wrapPluginsInObjects = function (plugins) {
  return _.map(plugins, function (item) {
    return {plugin: item};
  });
};

Goldvault.prototype.open = function () {
  var obj = this;
  obj.pack.start(function () {
    console.log('Server started.', obj.pack.info.uri);
  });
};

Goldvault.prototype.close = function () {
  var obj = this;
  obj.pack.stop(function () {
    console.log('Server stopped.');
  });
};

// export the constructor as the module
module.exports = Goldvault;