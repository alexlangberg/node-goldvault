'use strict';
/* jshint camelcase: false */

//var BPromise = require('bluebird');

var Db = function (bookshelf) {
  var obj = this;
  obj.bookshelf = bookshelf;
  obj.models = {
    Source: obj.bookshelf.Model.extend({
      tableName: 'source',
      pages: function () {
        return this.hasMany(obj.models.Page);
      },
      ensure: function (criteria, transaction) {
        return obj._ensure(obj.models.Source, this.attributes, criteria, transaction);
      }
    }),
    Page: obj.bookshelf.Model.extend({
      tableName: 'page',
      source: function () {
        return this.belongsTo(obj.models.Source);
      }
    })
  };
};

Db.prototype.insertPage = function (page) {
  var obj = this;
  obj.bookshelf.transaction(function(t) {
    return new obj.models
      .Source({name: page.map.name, url: page.map.url})
      .ensure({url: page.map.url}, {transacting: t})
      .then(function (source) {
        return new obj.models
          .Page({
            source_id: source.id,
            created_at: Date.now(),
            count: page.gold.length
          })
          .save(null, {transacting: t})
          .then(function(page) {
            return page;
          });
      });
  });
};

Db.prototype._ensure = function (Model, instance, criteria, transaction) {
  return new Model(criteria)
    .fetch()
    .then(function (result) {
      if (result) {
        return result;
      }
      else {
        return new Model(instance)
          .save(null, transaction)
          .then(function (result) {
            return result;
          });
      }
    });
};























//Db.prototype.insertPage = function (page) {
//  var obj = this;
//  return new obj.models.Source({url: page.map.url})
//    .fetch()
//    .then(function (model) {
//      if (!model) {
//        return new obj.models.Source({name: page.map.name, url: page.map.url})
//          .save().then(function (model) {
//            console.log('yaya');
//            return model;
//          });
//      }
//    });
//};

//Db.prototype.insertCart = function (cart) {
//  var obj = this;
//  var pagePromises = [];
//  cart.results.forEach(function (result) {
//    pagePromises.push(obj.insertPage(result));
//  });
//  return BPromise.all(pagePromises);
//};
//
//Db.prototype.insertPage = function (page) {
//  var obj = this;
//  return obj.knex.transaction(function (trx) {
//    return obj.ensure(
//      trx,
//      'source',
//      {url: page.map.url},
//      {name: page.map.name, url: page.map.url}
//    )
//      .then(function (ids) {
//        return trx('page').insert({
//          source_id: ids[0],
//          created_at: Date.now(),
//          count: page.gold.length
//        });
//      })
//      .then(function (ids) {
//        var sentencePromises = [];
//        page.gold.forEach(function (sentence) {
//          sentencePromises.push(obj.insertSentence(trx, ids[0], sentence));
//        });
//        return BPromise.all(sentencePromises);
//      });
//  });
//};
//
//Db.prototype.insertSentence = function (knex, pageId, sentence) {
//  var obj = this;
//  return knex('sentence')
//    .insert({
//      page_id: pageId,
//      sentence: sentence.text,
//      href: sentence.href,
//      tag: sentence.tag,
//      position: sentence.position
//    })
//    .then(function (ids) {
//      var sentenceWordPromises = [];
//      sentence.keywords.forEach(function (sentenceWord) {
//        sentenceWordPromises.push(
//          obj.insertSentenceWord(knex, ids[0], sentenceWord)
//        );
//      });
//      return BPromise.all(sentenceWordPromises);
//    });
//};
//
//Db.prototype.insertSentenceWord = function (knex, sentenceId, sentenceWord) {
//  var obj = this;
//  return obj.ensure(
//    knex,
//    'word',
//    {word: sentenceWord.word},
//    {word: sentenceWord.word}
//  )
//    .then(function (ids) {
//      return knex('sentence_word').insert({
//        sentence_id: sentenceId,
//        word_id: ids[0],
//        count: sentenceWord.count
//      });
//    });
//};
//
//Db.prototype.ensure = function (knex, table, ensureSearch, itemObject) {
//  return knex(table).where(ensureSearch).select()
//    .then(function (ids) {
//      if (ids.length === 0) {
//        return knex(table)
//          .insert(itemObject);
//      } else {
//        // return in same format as above
//        return [ids[0].id];
//      }
//    });
//};

module.exports = Db;
