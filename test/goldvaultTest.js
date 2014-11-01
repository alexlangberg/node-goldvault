'use strict';

/* exported should */
/* jshint expr: true */
/* jshint -W079 */

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var chai = require('chai');
chai.use(require('chai-things'));
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var should = chai.should();
var Goldvault = require('../index.js');
var lout = require('lout');

var config = {
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
      database: 'goldvault' || process.env.GOLDVAULT_DB_DATABASE,
      //port: '27017' || process.env.GOLDVAULT_DB_PORT,
    },
    migrations: {
      tableName: 'migrations'
    }
  }
};

describe('goldvault', function () {

});