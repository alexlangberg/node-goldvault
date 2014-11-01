'use strict';

/* exported should */
/* jshint expr: true */
/* jshint camelcase: false */
/* jshint -W079 */

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
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
  tableName: 'migrations'
};
var knex = Knex.initialize(config.database);

describe('knex migration', function () {
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

  it('can insert into the source table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('source').insert(
          {
            name: 'Foo',
            url: 'https://www.foo.com'
          }
        );
      })
      .then(function () {
        done();
      });
  });

  it('can insert into the page table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('page').insert(
          {
            source_id: 1,
            created_at: '123456789',
            count: 1337
          }
        );
      })
      .then(function () {
        done();
      });
  });

  it('can insert into the sentence table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('sentence').insert(
          {
            page_id: 1,
            sentence: 'Foo bar. New bar on the way.',
            link: 'https://www.foo.com/bar.html',
            tag: 'h1',
            position: 37
          }
        );
      })
      .then(function () {
        done();
      });
  });

  it('can insert into the word table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('word').insert(
          {
            id: 1,
            word: 'foo'
          }
        );
      })
      .then(function () {
        done();
      });
  });

  it('can insert into the sentence_word table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('sentence_word').insert(
          {
            sentence_id: 1,
            word_id: 1
          }
        );
      })
      .then(function () {
        done();
      });
  });
});