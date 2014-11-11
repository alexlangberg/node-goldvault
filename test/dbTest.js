'use strict';
/* exported should */
/* jshint expr: true */
/* jshint camelcase: false */

var chai = require('chai');
chai.use(require('chai-things'));
var should = chai.should();
var Knex = require('knex');
var Db = require('../lib/db');
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
var bookshelf = require('bookshelf')(knex);
var db = new Db(bookshelf);
var fakeCart;

describe('db', function () {
  beforeEach(function (done) {
    // reset fakeCart
    fakeCart = {
      started: 61000,
      results: [{
        map: {
          name: 'Foo',
          url: 'http://www.foo.com',
          targets: 'h1'
        },
        dom: '<html><body><h1>Hello world!</h1></body></html>',
        response: 200,
        gold: [{
          timestamp: 61000,
          text: 'Hello world!',
          keywords: [
            {word: 'hello', count: 1},
            {word: 'world', count: 1}
          ],
          href: 'http://www.foo.com/bar',
          tag: 'h1',
          position: 0
        }]
      }],
      finished: 61000
    };
    // prepare database
    knex.migrate
      .latest(config)
      .then(function () {
        done();
      });
  });

  afterEach(function (done) {
    // tear down database
    knex.migrate
      .rollback(config)
      .then(function () {
        done();
      });
  });

  it('test', function (done) {
    db.insertPage(fakeCart.results[0])
      .then(function (whatever) {
        db.insertPage(fakeCart.results[0])
          .then(function (result) {
            console.log(result);
            done();
          });
      });
  });

  //it('can ensure something that does not exist', function (done) {
  //  db.ensure(
  //    knex,
  //    'source',
  //    {url: 'foo.com'},
  //    {name: 'Foo', url: 'foo.com'}
  //  )
  //    .then(function (ids) {
  //      ids.should.be.an('array');
  //      ids[0].should.equal(1);
  //      done();
  //    });
  //});
  //
  //it('can ensure something that does exist', function (done) {
  //  db.ensure(
  //    knex,
  //    'source',
  //    {url: 'foo.com'},
  //    {name: 'Foo', url: 'foo.com'}
  //  )
  //    .then(function () {
  //      return db.ensure(
  //        knex,
  //        'source',
  //        {url: 'foo.com'},
  //        {name: 'Foo', url: 'foo.com'}
  //      )
  //        .then(function (ids) {
  //          ids[0].should.equal(1);
  //          done();
  //        });
  //    });
  //});
  //
  //it('it can insert a cart of results', function (done) {
  //  db.insertCart(fakeCart)
  //    .then(function () {
  //      return knex('source').select()
  //        .then(function (items) {
  //          items[0].id.should.equal(1);
  //          items[0].name.should.equal(fakeCart.results[0].map.name);
  //          items[0].url.should.equal(fakeCart.results[0].map.url);
  //        })
  //        .then(function () {
  //          return knex('page').select()
  //            .then(function (items) {
  //              items[0].id.should.equal(1);
  //              items[0].source_id.should.equal(1);
  //              items[0].created_at.should.be.a('number');
  //              items[0].count.should.equal(fakeCart.results[0].gold.length);
  //            });
  //        })
  //        .then(function () {
  //          return knex('sentence').select()
  //            .then(function (items) {
  //              items[0].id.should.equal(1);
  //              items[0].page_id.should.equal(1);
  //              items[0].sentence.should.equal(
  //                fakeCart.results[0].gold[0].text
  //              );
  //              items[0].href.should.equal(fakeCart.results[0].gold[0].href);
  //              items[0].tag.should.equal(fakeCart.results[0].gold[0].tag);
  //              items[0].position.should.equal(
  //                fakeCart.results[0].gold[0].position
  //              );
  //            });
  //        })
  //        .then(function () {
  //          return knex('sentence_word').select()
  //            .then(function (items) {
  //              items.should.have.length(2);
  //              items[0].sentence_id.should.equal(1);
  //              items[1].sentence_id.should.equal(1);
  //              items[0].count.should.equal(1);
  //              items[1].count.should.equal(1);
  //              items[0].word_id.should.equal(1);
  //              items[1].word_id.should.equal(2);
  //            });
  //        })
  //        .then(function () {
  //          return knex('word').select()
  //            .then(function (items) {
  //              items.should.have.length(2);
  //              items[0].id.should.equal(1);
  //              items[1].id.should.equal(2);
  //              items[0].word.should.equal('hello');
  //              items[1].word.should.equal('world');
  //            });
  //        })
  //        .then(function () {
  //          done();
  //        });
  //    });
  //});
  //
  //// find out how to get this working
  //it('can fail and stuff right', function (done) {
  //  knex.raw('DROP TABLE source')
  //    .then(function() {
  //      db.insertCart(fakeCart)
  //        .then(function (result) {
  //          console.log(result);
  //        })
  //        .catch(function (errors) {
  //          console.error(errors);
  //        })
  //        .then(function() {
  //          done();
  //        });
  //    });
  //});
});