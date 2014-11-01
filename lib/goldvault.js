'use strict';

var _ = require('lodash');
var Hapi = require('hapi');

var Goldvault = function (options) {
  var obj = this;

  obj.pack = new Hapi.Pack();
};

// export the constructor as the module
module.exports = Goldvault;