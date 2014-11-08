'use strict';
/* exported should */
/* jshint expr: true */
/* jshint camelcase: false */

var chai = require('chai');
chai.use(require('chai-things'));
var should = chai.should();
var Knex = require('knex');
var config = {
  database: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },
  directory: './migrations',
  tableName: 'knex_test_migrations'
};
var knex = Knex.initialize(config.database);

describe('db', function () {
  before(function (done) {
    knex.migrate
      .rollback(config)
      .then(function () {
        done();
      });
  });

  after(function (done) {
    knex.migrate
      .rollback(config)
      .then(function () {
        done();
      });
  });

  it('can insert a page', function (done) {

    done();
  });
});