'use strict';

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/* jshint expr: true */
/* jshint camelcase: false */

var chai = require('chai');
chai.use(require('chai-things'));
var should = chai.should();
var sinon = require('sinon');
require('sinon-as-promised');
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
var testDir = './goldvault';
var path = require('path');

describe('db', function() {
  beforeEach(function(done) {
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
      .then(function() {
        done();
      });
  });

  afterEach(function(done) {
    // tear down database
    knex.migrate
      .rollback(config)
      .then(function() {
        db.fs.remove(testDir, function() {
          done();
        });
      });
  });

  it('can receive an options object', function(done) {
    db.options.saveToDisk.should.be.false;
    var db2 = new Db(bookshelf, {saveToDisk: './goldvault'});
    db2.options.saveToDisk.should.equal('./goldvault');
    done();
  });

  it('can ensure sources', function(done) {
    db.ensureSources(fakeCart).then(function(results) {
      results.length.should.equal(2);
      done();
    });
  });

  it('can ensure already existing sources', function(done) {
    db.ensureSources(fakeCart).then(function() {
      db.ensureSources(fakeCart).then(function(results) {
        results.length.should.equal(2);
        done();
      });
    });
  });

  it('can ensure words', function(done) {
    db.ensureWords(fakeCart).then(function(results) {
      results.length.should.equal(2);
      done();
    });
  });

  it('can insert pages', function(done) {
    db.ensureSources(fakeCart).then(function() {
      return db.ensureWords(fakeCart);
    }).then(function() {
      db.bookshelf
        .transaction(function(t) {
          return db.insertPage(fakeCart.results[0], t)
            .then(function(first) {
              first.id.should.equal(1);
              return db.insertPage(fakeCart.results[0], t)
                .then(function(second) {
                  second.id.should.equal(2);
                });
            });
        })
        .then(function() {
          done();
        });
    });
  });

  it('can insert sentences', function(done) {
    db.ensureSources(fakeCart).then(function() {
      return db.ensureWords(fakeCart);
    }).then(function() {
      db.bookshelf
        .transaction(function(t) {
          return db.insertPage(fakeCart.results[0], t)
            .then(function(page) {
              return db.insertSentence(fakeCart.results[0].gold[0], page.id, t)
                .then(function(first) {
                  first.id.should.equal(1);
                  return db.insertSentence(
                    fakeCart.results[0].gold[0],
                    page.id,
                    t)
                    .then(function(second) {
                      second.id.should.equal(2);
                    });
                });
            });
        })
        .then(function() {
          done();
        });
    });
  });

  it('can insert sentence words', function(done) {
    db.ensureSources(fakeCart).then(function() {
      return db.ensureWords(fakeCart);
    }).then(function() {
      db.bookshelf
        .transaction(function(t) {
          return db.insertPage(fakeCart.results[0], t)
            .then(function(page) {
              return db.insertSentence(fakeCart.results[0].gold[0], page.id, t)
                .then(function(sentence) {
                  return db.insertSentenceWord(
                    fakeCart.results[0].gold[0].keywords[0],
                    sentence.id,
                    t)
                    .then(function(sentenceWord) {
                      sentenceWord.attributes.sentence_id.should.equal(1);
                      sentenceWord.attributes.count.should.equal(1);
                    });
                });
            });
        })
        .then(function() {
          done();
        });
    });
  });

  it('can insert cart items', function(done) {
    db.insertCart(fakeCart)
      .then(function() {
        return db.models
          .Source
          .where({id: 1})
          .fetch()
          .then(function(source) {
            source.attributes.id.should.equal(1);
          });
      })
      .then(function() {
        return db.models
          .Page
          .where({id: 1})
          .fetch()
          .then(function(page) {
            page.attributes.id.should.equal(1);
            page.attributes.created_at.should.be.a('number');
          });
      })
      .then(function() {
        return db.models
          .SentenceWord
          .fetchAll()
          .then(function(items) {
            items.length.should.equal(4);
          });
      })
      .then(function() {
        return db.models
          .Word
          .fetchAll()
          .then(function(items) {
            items.length.should.equal(2);
          });
      })
      .then(function() {
        done();
      });
  });

  it('can insert a cart', function(done) {
    db.insertCart(fakeCart)
      .then(function(result) {
        result.length.should.equal(2);
      })
      .finally(function() {
        done();
      });
  });

  it('has working Source model relations', function(done) {
    db.insertCart(fakeCart)
      .then(function() {
        return db.models
          .Source
          .where({id: 1})
          .fetch({withRelated: ['pages']})
          .then(function(item) {
            item.related('pages').length.should.equal(1);
          });
      })
      .then(function() {
        done();
      });
  });

  it('has working Page model relations', function(done) {
    db.insertCart(fakeCart)
      .then(function() {
        return db.models
          .Page
          .where({id: 1})
          .fetch({withRelated: ['source']})
          .then(function(item) {
            should.exist(item);
          });
      })
      .then(function() {
        return db.models
          .Page
          .where({id: 1})
          .fetch({withRelated: ['sentences']})
          .then(function(item) {
            item.related('sentences').length.should.equal(1);
          });
      })
      .then(function() {
        done();
      });
  });

  it('has working Source model relations', function(done) {
    db.insertCart(fakeCart)
      .then(function() {
        return db.models
          .Sentence
          .where({id: 1})
          .fetch({withRelated: ['page']})
          .then(function(item) {
            should.exist(item);
          });
      })
      .then(function() {
        return db.models
          .Sentence
          .where({id: 1})
          .fetch({withRelated: ['sentenceWords']})
          .then(function(item) {
            item.related('sentenceWords').length.should.equal(2);
          });
      })
      .then(function() {
        done();
      });
  });

  it('has working SentenceWord model relations', function(done) {
    db.insertCart(fakeCart)
      .then(function() {
        return db.models
          .SentenceWord
          .where({sentence_id: 1})
          .fetch({withRelated: ['sentence']})
          .then(function(item) {
            should.exist(item);
          });
      })
      .then(function() {
        return db.models
          .SentenceWord
          .where({sentence_id: 1})
          .fetch({withRelated: ['word']})
          .then(function(item) {
            should.exist(item);
          });
      })
      .then(function() {
        done();
      });
  });

  it('has working Word model relations', function(done) {
    db.insertCart(fakeCart)
      .then(function() {
        return db.models
          .Word
          .where({id: 1})
          .fetch({withRelated: ['sentenceWords']})
          .then(function(item) {
            item.related('sentenceWords').length.should.equal(2);
          });
      })
      .then(function() {
        done();
      });
  });

  it('can read multiple json files from disk', function(done) {
    var db2 = new Db(bookshelf, {saveToDisk: testDir});
    db2.saveCartToDisk(fakeCart).then(function() {
      db2.loadJsonFiles((testDir)).then(function(files) {
        files.should.be.an('array');
        files[0].should.deep.equal(fakeCart);
        done();
      });
    });
  });

  it('can get cart disk file name', function(done) {
    var db2 = new Db(bookshelf, {saveToDisk: testDir});
    var name = db2.cartDiskName(fakeCart);
    var nameSubfolder = db2.cartDiskName(fakeCart, 'completed');
    name.should.equal('./goldvault/61000-61000-2.json');
    nameSubfolder.should.equal('./goldvault/completed/61000-61000-2.json');
    done();
  });

  it('can catch failed cart inserts', function(done) {
    knex.migrate
      .rollback(config)
      .then(function() {
        db.insertCart(fakeCart)
          .catch(function(error) {
            error.should.be.an('object');
          })
          .finally(function() {
            done();
          });
      });
  });

  it('can save completed carts to disk', function(done) {
    var db2 = new Db(bookshelf, {saveToDisk: testDir});
    db2.insertCart(fakeCart).then(function() {
      var completedDir = path.join(testDir, 'completed');
      db2.fs.readdirAsync(completedDir).then(function(files) {
        files[0].should.equal('61000-61000-2.json');
        done();
      });
    });
  });

  it('can save failed carts to disk', function(done) {
    var db2 = new Db(bookshelf, {saveToDisk: testDir});
    knex.migrate
      .rollback(config)
      .then(function() {
        db2.insertCart(fakeCart)
          .catch(function() {
            var failed = path.join(testDir, 'failed');
            db2.fs.readdirAsync(failed).then(function(files) {
              files[0].should.equal('61000-61000-2.json');
              done();
            });
          });
      });
  });

  it('rejects if initialization fails', function(done) {
    var db2 = new Db(bookshelf, {saveToDisk: testDir});
    sinon.stub(db2, 'saveCartToDisk').rejects('Fake sinon error.');
    db2.initializeInsert(fakeCart)
      .catch(function(error) {
        error.should.be.an('object');
        done();
      });
  });

  it('warns if finalization cart file move fails', function(done) {
    var db2 = new Db(bookshelf, {saveToDisk: testDir});
    sinon.stub(db2, 'moveProcessedCart').rejects('Fake sinon error.');
    db2.finalizeInsert(fakeCart)
      .catch(function(error) {
        error.should.be.an('object');
        done();
      });
  });

  //it('can retry inserting failed carts', function(done) {
  //  var db2 = new Db(bookshelf, {saveToDisk: testDir});
  //  var fakeCart2 = R.merge(fakeCart, {started: 62000});
  //  db2.saveCartToDisk(fakeCart).then(function() {
  //    db2.saveCartToDisk(fakeCart2).then(function() {
  //      db2.retryFailed().then(function() {
  //        db2.fs.remove(testDir, function() {
  //          done();
  //        });
  //      });
  //    });
  //  });
  //});
});