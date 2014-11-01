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

  it('can initialize packs', function (done) {
    var vault = new Goldvault(config);
    var fakePack = {foo: 'bar'};

    vault.initPack(fakePack);

    vault.initialized.should.be.true;
    vault.pack.should.equal(fakePack);
    vault.pack.should.have.property('goldvault');
    vault.pack.goldvault.should.be.an('object');

    done();
  });

  it('can be started, stopped and started again', function (done) {
    var vault = new Goldvault(config);
    var vaultStart = sinon.spy(vault, 'start');
    var vaultStop = sinon.spy(vault, 'stop');

    vault.start(function () {
      var packStart = sinon.spy(vault.pack, 'start');
      var packStop = sinon.spy(vault.pack, 'stop');

      vault.stop(function() {
        vault.start(function() {
          vaultStart.should.have.callCount(2);
          vaultStop.should.have.callCount(1);
          packStart.should.have.callCount(1);
          packStop.should.have.callCount(1);

          done();
        });
      });
    });
  });

});