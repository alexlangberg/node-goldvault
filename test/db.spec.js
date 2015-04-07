'use strict';
/* exported should */
/* jshint expr: true */
/* jshint camelcase: false */

var chai = require('chai');
chai.use(require('chai-things'));
var sinon = require('sinon');
var should = chai.should();
var Knex = require('knex');
var rimraf = require('rimraf');
var fs = require('fs');
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
var testDir = './testfailed';

describe('db', function () {
  beforeEach(function (done) {
    // reset fakeCart
    fakeCart = {
      started: 61000,
      results: [
        {
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
        },
        {
          map: {
            name: 'Bar',
            url: 'http://www.bar.com',
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
            href: 'http://www.bar.com/foo',
            tag: 'h1',
            position: 0
          }]
        }
      ],
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

  it('can insert pages', function (done) {
    db
      .transaction(function (t) {
        return db.insertPage(fakeCart.results[0], t)
          .then(function (first) {
            first.id.should.equal(1);
            return db.insertPage(fakeCart.results[0], t)
              .then(function (second) {
                second.id.should.equal(2);
              });
          });
      })
      .then(function () {
        done();
      });
  });

  it('can insert sentences', function (done) {
    db
      .transaction(function (t) {
        return db.insertPage(fakeCart.results[0], t)
          .then(function (page) {
            return db.insertSentence(fakeCart.results[0].gold[0], page.id, t)
              .then(function (first) {
                first.id.should.equal(1);
                return db.insertSentence(
                  fakeCart.results[0].gold[0],
                  page.id,
                  t)
                  .then(function (second) {
                    second.id.should.equal(2);
                  });
              });
          });
      })
      .then(function () {
        done();
      });
  });

  it('can insert sentence words', function (done) {
    db
      .transaction(function (t) {
        return db.insertPage(fakeCart.results[0], t)
          .then(function (page) {
            return db.insertSentence(fakeCart.results[0].gold[0], page.id, t)
              .then(function (sentence) {
                return db.insertSentenceWord(
                  fakeCart.results[0].gold[0].keywords[0],
                  sentence.id,
                  t)
                  .then(function (sentenceWord) {
                    sentenceWord.attributes.sentence_id.should.equal(1);
                    sentenceWord.attributes.word_id.should.equal(1);
                    sentenceWord.attributes.count.should.equal(1);
                  });
              });
          });
      })
      .then(function () {
        done();
      });
  });

  it('can insert cart items', function (done) {
    db.insertCartItem(fakeCart.results[0])
      .then(function () {
        return db.models
          .Source
          .where({id: 1})
          .fetch()
          .then(function (source) {
            source.attributes.id.should.equal(1);
            source.attributes.name.should.equal(fakeCart.results[0].map.name);
            source.attributes.url.should.equal(fakeCart.results[0].map.url);
          });
      })
      .then(function () {
        return db.models
          .Page
          .where({id: 1})
          .fetch()
          .then(function (page) {
            page.attributes.id.should.equal(1);
            page.attributes.source_id.should.equal(1);
            page.attributes.count.should.equal(fakeCart.results[0].gold.length);
            page.attributes.created_at.should.be.a('number');
          });
      })
      .then(function () {
        return db.models
          .SentenceWord
          .fetchAll()
          .then(function (items) {
            items.length.should.equal(2);
          });
      })
      .then(function () {
        return db.models
          .Word
          .fetchAll()
          .then(function (items) {
            items.length.should.equal(2);
          });
      })
      .then(function () {
        done();
      });
  });

  it('can insert a cart', function (done) {
    db.insertCart(fakeCart)
      .then(function (result) {
        result.length.should.equal(2);
      })
      .finally(function () {
        done();
      });
  });

  it('has working Source model relations', function (done) {
    db.insertCart(fakeCart)
      .then(function () {
        return db.models
          .Source
          .where({id: 1})
          .fetch({withRelated: ['pages']})
          .then(function (item) {
            item.related('pages').length.should.equal(1);
          });
      })
      .then(function () {
        done();
      });
  });

  it('has working Page model relations', function (done) {
    db.insertCart(fakeCart)
      .then(function () {
        return db.models
          .Page
          .where({id: 1})
          .fetch({withRelated: ['source']})
          .then(function (item) {
            item.related('source').id.should.equal(1);
          });
      })
      .then(function () {
        return db.models
          .Page
          .where({id: 1})
          .fetch({withRelated: ['sentences']})
          .then(function (item) {
            item.related('sentences').length.should.equal(1);
          });
      })
      .then(function () {
        done();
      });
  });

  it('has working Source model relations', function (done) {
    db.insertCart(fakeCart)
      .then(function () {
        return db.models
          .Sentence
          .where({id: 1})
          .fetch({withRelated: ['page']})
          .then(function (item) {
            item.related('page').id.should.equal(1);
          });
      })
      .then(function () {
        return db.models
          .Sentence
          .where({id: 1})
          .fetch({withRelated: ['sentenceWords']})
          .then(function (item) {
            item.related('sentenceWords').length.should.equal(2);
          });
      })
      .then(function () {
        done();
      });
  });

  it('has working SentenceWord model relations', function (done) {
    db.insertCart(fakeCart)
      .then(function () {
        return db.models
          .SentenceWord
          .where({sentence_id: 1})
          .fetch({withRelated: ['sentence']})
          .then(function (item) {
            item.related('sentence').id.should.equal(1);
          });
      })
      .then(function () {
        return db.models
          .SentenceWord
          .where({sentence_id: 1})
          .fetch({withRelated: ['word']})
          .then(function (item) {
            item.related('word').id.should.equal(1);
          });
      })
      .then(function () {
        done();
      });
  });

  it('has working Word model relations', function (done) {
    db.insertCart(fakeCart)
      .then(function () {
        return db.models
          .Word
          .where({id: 1})
          .fetch({withRelated: ['sentenceWords']})
          .then(function (item) {
            item.related('sentenceWords').length.should.equal(2);
          });
      })
      .then(function () {
        done();
      });
  });

  it('can catch failed cart inserts', function (done) {
    knex.migrate
      .rollback(config)
      .then(function () {
        db.insertCart(fakeCart)
          .catch(function (error) {
            error.should.be.an('object');
          })
          .finally(function () {
            done();
          });
      });
  });

  it('can receive an options object', function (done) {
    db.options.saveFailedToDisk.should.be.false;
    var db2 = new Db(bookshelf, {saveFailedToDisk: './failed'});
    db2.options.saveFailedToDisk.should.equal('./failed');
    done();
  });

  it('writes failed inserts to disk for retrying', function (done) {
    var db2 = new Db(bookshelf, {saveFailedToDisk: testDir});
    knex.migrate
      .rollback(config)
      .then(function () {
        db2.insertCart(fakeCart)
          .catch(function (error) {
            error.should.be.an('object');
            fs.readdir(testDir, function(err, files) {
              fs.readFile(testDir + '/' + files[0],
                'utf8',
                function(err, data) {
                var savedCart = JSON.parse(data);
                savedCart.should.deep.equal(fakeCart);
              });
            });
          })
          .finally(function () {
            rimraf(testDir, function() {
              done();
            });
          });
      });
  });

  it('proceeds even if folder for failed already exists', function (done) {
    var db2 = new Db(bookshelf, {saveFailedToDisk: testDir});
    db2.fs.mkdir(testDir, function() {
      knex.migrate
        .rollback(config)
        .then(function () {
          db2.insertCart(fakeCart)
            .catch(function (error) {
              error.should.be.an('object');
            })
            .finally(function () {
              rimraf(testDir, function() {
                done();
              });
            });
        });
    });
  });

  it('rejects if folder creation fails', function (done) {
    var db2 = new Db(bookshelf, {saveFailedToDisk: testDir});
    // we don't want to throw an actual error in our test console
    sinon.stub(console, 'error');
    sinon.stub(db2.fs, 'mkdir', function(name, callback) {
      callback({code: 'FOO'});
    });
    knex.migrate
      .rollback(config)
      .then(function () {
        db2.insertCart(fakeCart)
          .catch(function (error) {
            error.should.be.an('object');
          })
          .finally(function () {
            rimraf(testDir, function() {
              db2.fs.mkdir.restore();
              // restore console.error function to let errors work again
              console.error.restore();
              done();
            });
          });
      });
  });

  it('rejects if file creation fails', function (done) {
    var db2 = new Db(bookshelf, {saveFailedToDisk: testDir});
    // we don't want to throw an actual error in our test console
    sinon.stub(console, 'error');
    sinon.stub(db2.fs, 'writeFile', function(name, data, callback) {
      callback({code: 'FOO'});
    });
    knex.migrate
      .rollback(config)
      .then(function () {
        db2.insertCart(fakeCart)
          .catch(function (error) {
            error.should.be.an('object');
          })
          .finally(function () {
            rimraf(testDir, function() {
              db2.fs.writeFile.restore();
              // restore console.error function to let errors work again
              console.error.restore();
              done();
            });
          });
      });
  });
});