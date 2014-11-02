'use strict';

var Goldvault = require('index.js');
var config = require('config.js');

var vault = new Goldvault(config);
vault.start(function() {
  console.log('Goldvault open!');
});