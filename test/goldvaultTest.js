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
var Goldvault = require('../index.js');

describe('Goldvault', function () {
  it('can be constructed', function (done) {
    var vault = new Goldvault();
    vault.dummy();
    done();
  });
});