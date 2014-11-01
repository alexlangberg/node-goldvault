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
var should = chai.should();


//describe('pack', function () {
//  it('can be started', function (done) {
//    pack.start();
//    done();
//  });
//
//  it('can list information at index', function (done) {
//    var options = {
//      method: 'GET',
//      url: '/users'
//    };
//
//    pack.inject(options, function(response) {
//      var result = response.result;
//
//      response.statusCode.should.equal(200);
//      result.should.be.an('object');
//      result.should.have.property('api');
//      result.should.have.property('version');
//      result.should.have.property('documentation');
//
//      done();
//    });
//  });
//});