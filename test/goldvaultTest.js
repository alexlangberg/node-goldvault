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

describe('goldvault', function () {
  it('can be constructed without options', function (done) {
    var vault = new Goldvault();
    vault.options.should.be.an('object');
    done();
  });

  it('can be constructed with options', function (done) {
    var vault = new Goldvault({foo: 'bar'});
    vault.options.should.be.an('object');
    vault.options.foo.should.equal('bar');
    done();
  });

  it('can wrap plugins in objects for Hapi', function (done) {
    var vault = new Goldvault();
    var wrapped = vault.wrapPluginsInObjects([lout, lout]);
    wrapped.should.have.length(2);
    wrapped.should.all.have.property('plugin');
    done();
  });

  it('can initialize by registering plugins in pack', function (done) {
    var vault = new Goldvault();
    vault.registerPlugins = sinon.spy(vault.registerPlugins);
    vault.init(function () {
      vault.registerPlugins.should.have.been.called;
      done();
    });
  });

  it('can initialize despite abundant plugin', function (done) {
    var vault = new Goldvault({plugins: [lout]});
    vault.registerPlugins = sinon.spy(vault.registerPlugins);
    vault.init(function () {
      vault.registerPlugins.should.have.been.called;
      done();
    });
  });

  it('fails if not passed a faulty plugin', function (done) {
    var vault = new Goldvault({plugins: ['foo']});
    var faulty = function () {
      vault.init(function() {
        done();
      });
    };
    (faulty).should.throw(Error);
    done();
  });
});