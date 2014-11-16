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

  it('can insert into the sources table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('sources').insert(
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

  it('can insert into the pages table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('pages').insert(
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

  it('can insert into the sentences table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('sentences').insert(
          {
            page_id: 1,
            sentence: 'Foo bar. New bar on the way.',
            href: 'https://www.foo.com/bar.html',
            tag: 'h1',
            position: 37
          }
        );
      })
      .then(function () {
        done();
      });
  });

  it('can insert into the words table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('words').insert(
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

  it('can insert into the sentences_words table', function (done) {
    knex.migrate
      .latest(config)
      .then(function () {
        return knex('sentences_words').insert(
          {
            sentence_id: 1,
            word_id: 1,
            count: 1
          }
        );
      })
      .then(function () {
        done();
      });
  });
});