'use strict';

/* exported should */
/* jshint expr: true */

var chai = require('chai');
chai.use(require('chai-things'));
chai.use(require('sinon-chai'));
var sinon = require('sinon');
var should = chai.should();
var Goldvault = require('../lib/goldvault.js');

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
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },
  plugins: {}
};

describe('goldvault', function () {

  it('can be started, stopped and started again', function (done) {
    var vault = new Goldvault(config);
    var vaultStart = sinon.spy(vault, 'start');
    var vaultStop = sinon.spy(vault, 'stop');

    vault.start(function () {
      var serverStart = sinon.spy(vault.server, 'start');
      var serverStop = sinon.spy(vault.server, 'stop');

      vault.stop(function() {
        vault.start(function() {
          vaultStart.should.have.callCount(2);
          vaultStop.should.have.callCount(1);
          serverStart.should.have.callCount(1);
          serverStop.should.have.callCount(1);

          done();
        });
      });
    });
  });

  it('connects with bookshelf', function (done) {
    var vault = new Goldvault(config);
    var app = vault.manifest.server.app;
    app.should.have.property('bookshelf');
    app.bookshelf.should.have.property('knex');
    done();
  });

  it('can have a knex connection injected', function (done) {
    var knex = require('knex')(config.database);
    var vault = new Goldvault(config, knex);
    var app = vault.manifest.server.app;
    app.should.have.property('bookshelf');
    app.bookshelf.should.have.property('knex');
    done();
  });
});
