'use strict';

/* exported should */
/* jshint expr: true */
//var _ = require('underscore');
var chai = require('chai');
chai.use(require('chai-things'));
chai.use(require('sinon-chai'));
var should = chai.should();
var sinon = require('sinon');
var Goldvault = require('../index.js');
var clock;

before(function () {
  clock = sinon.useFakeTimers();
});
after(function () {
  clock.restore();
});

describe('Goldvault', function () {
  it('can be constructed', function () {
    var vault = new Goldvault();
  });
});