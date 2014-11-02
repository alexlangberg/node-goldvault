'use strict';

/* exported should */
/* jshint expr: true */

var chai = require('chai');
chai.use(require('chai-things'));
//chai.use(require('sinon-chai'));
//var sinon = require('sinon');
var should = chai.should();
var Hapi = require('hapi');

describe('goldvault plugin', function () {
  var server = new Hapi.Server();

  it('loads', function (done) {
    server.pack.register(require('../plugins/goldvault.js'), function(err) {
      should.not.exist(err);
      done();
    });
  });

  it('registers routes', function (done) {
    var table = server.table();
    table.should.have.length(1);
    table[0].path.should.equal('/');
    done();
  });

  it('has a working route', function (done) {
    server.pack.app.config = {
      product: {
        info: {}
      }
    };
    server.inject({method: 'GET', url:'/'}, function(response) {
      response.statusCode.should.equal(200);
      done();
    });
  });

  it('has a working route even without info object', function (done) {
    server.pack.app.config = {
      product: {}
    };
    server.inject({method: 'GET', url:'/'}, function(response) {
      response.statusCode.should.equal(200);
      done();
    });
  });
});