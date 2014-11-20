'use strict';
/* jshint camelcase: false */

var BPromise = require('bluebird');
var fs = require('fs');
var R = require('ramda');
//BPromise.promisifyAll(fs);

var Db = function (bookshelf, options) {
  var obj = this;

  obj.bookshelf = bookshelf;
  obj.options = R.mixin({
    // false or folder to save failed to
    saveFailedToDisk: false,
    // retry insertion of failed carts when schedule is run
    retryFailed: false
  }, options);

  obj.models = {
    Source: obj.bookshelf.Model.extend({
      tableName: 'sources',
      pages: function () {
        return this.hasMany(obj.models.Page, 'source_id');
      },
      ensure: function (criteria, t) {
        return obj._ensure(obj.models.Source, this.attributes, criteria, t);
      }
    }),
    Page: obj.bookshelf.Model.extend({
      tableName: 'pages',
      source: function () {
        return this.belongsTo(obj.models.Source);
      },
      sentences: function () {
        return this.hasMany(obj.models.Sentence);
      }
    }),
    Sentence: obj.bookshelf.Model.extend({
      tableName: 'sentences',
      page: function () {
        return this.belongsTo(obj.models.Page);
      },
      sentenceWords: function () {
        return this.hasMany(obj.models.SentenceWord);
      }
    }),
    Word: obj.bookshelf.Model.extend({
      tableName: 'words',
      sentenceWords: function () {
        return this.hasMany(obj.models.SentenceWord);
      },
      ensure: function (criteria, t) {
        return obj._ensure(obj.models.Word, this.attributes, criteria, t);
      }
    }),
    SentenceWord: obj.bookshelf.Model.extend({
      tableName: 'sentences_words',
      sentence: function () {
        return this.belongsTo(obj.models.Sentence);
      },
      word: function () {
        return this.belongsTo(obj.models.Word);
      }
    })
  };
};

Db.prototype.transaction = function (actions) {
  var obj = this;
  return obj.bookshelf.transaction(function (transaction) {
    return actions(transaction);
  });
};

Db.prototype._ensure = function (Model, instance, criteria, transaction) {
  return new Model(criteria)
    .fetch({transacting: transaction})
    .then(function (result) {
      if (result) {
        return result;
      }
      else {
        return new Model(instance)
          .save(null, {transacting: transaction});
      }
    });
};

// dependency inject to test?
Db.prototype.saveCartToDisk = function (cart) {
  var obj = this;
  var promise = new BPromise(function (resolve, reject) {
    fs.mkdir(obj.options.saveFailedToDisk, function (error) {
      if (error) {
        if (error.code !== 'EEXIST') {
          reject(error);
        }
      }
      var jsonCart = JSON.stringify(cart, null, 2);
      fs.writeFile(
        obj.options.saveFailedToDisk + '/lols.json',
        jsonCart,
        function (error) {
          if (error) {
            reject(error);
          }
          else {
            resolve();
          }
        }
      );
    });
  });
  return promise;
};

Db.prototype.insertCart = function (cart) {
  var obj = this;
  var promise = new BPromise(function (resolve, reject) {
    var pagePromises = [];
    cart.results.forEach(function (result) {
      pagePromises.push(obj.insertCartItem(result));
    });
    BPromise.all(pagePromises)
      .then(function (results) {
        resolve(results);
      })
      .catch(function (error) {
        if (obj.options.saveFailedToDisk) {
          obj.saveCartToDisk(cart)
            .catch(function (saveError) {
              // the show must go on
              console.error(saveError);
            })
            .finally(function () {
              reject(error);
            });
        }
        else {
          reject(error);
        }
      });
  });
  return promise;
};

Db.prototype.insertCartItem = function (cartItem) {
  var obj = this;
  return obj.transaction(function (t) {
    return obj.insertPage(cartItem, t)
      .tap(function (page) {
        return BPromise.map(cartItem.gold, function (gold) {
          return obj.insertSentence(gold, page.id, t)
            .tap(function (sentence) {
              return BPromise.map(gold.keywords, function (keyword) {
                return obj.insertSentenceWord(keyword, sentence.id, t);
              });
            });
        });
      });
  });
};

Db.prototype.insertPage = function (page, transaction) {
  var obj = this;
  return new obj.models
    .Source({name: page.map.name, url: page.map.url})
    .ensure({url: page.map.url}, transaction)
    .then(function (source) {
      return new obj.models
        .Page({
          source_id: source.id,
          created_at: Date.now(),
          count: page.gold.length
        })
        .save(null, {transacting: transaction});
    });
};

Db.prototype.insertSentence = function (sentence, pageId, transaction) {
  var obj = this;
  return new obj.models
    .Sentence({
      page_id: pageId,
      sentence: sentence.text,
      href: sentence.href,
      tag: sentence.tag,
      position: sentence.position
    })
    .save(null, {transacting: transaction});
};

Db.prototype.insertSentenceWord = function (sentenceWord,
                                            sentenceId,
                                            transaction) {
  var obj = this;
  return new obj.models
    .Word({word: sentenceWord.word})
    .ensure({word: sentenceWord.word}, transaction)
    .then(function (word) {
      return new obj.models
        .SentenceWord({
          sentence_id: sentenceId,
          word_id: word.id,
          count: sentenceWord.count
        })
        .save(null, {transacting: transaction});
    });
};

module.exports = Db;
