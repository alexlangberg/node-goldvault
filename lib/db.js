'use strict';
/* jshint camelcase: false */

var BPromise = require('bluebird');

var Db = function (bookshelf) {
  var obj = this;
  obj.bookshelf = bookshelf;
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

Db.prototype.insertCart = function (cart) {
  var obj = this;
  var pagePromises = [];
  cart.results.forEach(function (result) {
    pagePromises.push(obj.insertCartItem(result));
  });
  return BPromise.all(pagePromises);
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
