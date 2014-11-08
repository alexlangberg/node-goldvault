'use strict';
/* jshint camelcase: false */

var Promise = require('bluebird');

var Db = function (knex) {
  var obj = this;
  obj.knex = knex;
};

Db.prototype.insertCart = function (cart) {
  var obj = this;
  var pagePromises = [];
  cart.results.forEach(function(result) {
    pagePromises.push(obj.insertPage(result));
  });
  return Promise.all(pagePromises);
};

Db.prototype.insertPage = function (page) {
  var obj = this;
  return obj.ensure('source', {url: page.map.url})
    .then(function (ids) {
      return obj.knex('page').insert({
        source_id: ids[0],
        created_at: Date.now(),
        count: page.gold.length
      });
    })
    .then(function (ids) {
      var sentencePromises = [];
      page.gold.forEach(function (sentence) {
        sentencePromises.push(obj.insertSentence(ids[0]), sentence);
      });
      return Promise.all(sentencePromises);
    });
};

Db.prototype.insertSentence = function (pageId, sentence) {
  var obj = this;
  return obj.knex('sentence')
    .insert({
      page_id: pageId,
      sentence: sentence.text,
      link: sentence.href,
      tag: sentence.tag,
      position: sentence.index
    })
    .then(function (ids) {
      var sentenceWordPromises = [];
      sentence.keywords.forEach(function (sentenceWord) {
        sentenceWordPromises.push(obj.insertSentenceWord(ids[0], sentenceWord));
      });
      return Promise.all(sentenceWordPromises);
    });
};

// TODO change goldwasher to return array of keywords. Rename index to position.
Db.prototype.insertSentenceWord = function (sentenceId, sentenceWord) {
  var obj = this;
  return obj.ensure('word', {word: sentenceWord.word})
    .then(function (ids) {
      return obj.knex('sentence_word').insert({
        sentence_id: sentenceId,
        word_id: ids[0],
        count: sentenceWord.count
      });
    });
};

Db.prototype.ensure = function (table, ensureObject, selectColumn) {
  var obj = this;
  return obj.knex(table).where(ensureObject).select(selectColumn)
    .then(function (ids) {
      if (ids.length === 0) {
        return obj.knex(table)
          .insert(ensureObject);
      } else {
        return ids;
      }
    });
};

module.exports = Db;





//Db.prototype.insertCart = function (cart) {
//  return new Promise(function(resolve, reject) {
//    var obj = this;
//    var cartPromises = [];
//
//    cart.results.forEach(function(result) {
//      cartPromises.push(obj.insertPage(result));
//    });
//  });
//};

//// RESTRUCTURE GOLDWASHER
//Db.prototype.insertPage = function (page) {
//  var obj = this;
//  return obj.ensure('source', {url: page.map.url})
//    .then(function (rows) {
//      return obj.knex('page').insert({
//        source_id: rows[0],
//        created_at: Date.now(),
//        count: page.gold.length
//      });
//    });
//};
//
//Db.prototype.insertSentenceWord = function (wordObject, sentence_id) {
//  var obj = this;
//  return obj.ensure('word', {word: wordObject.word})
//    .then(function (rows) {
//      return obj.knex('sentence_word').insert({
//        sentence_id: sentence_id,
//        word_id: rows[0],
//        count: wordObject.count
//      });
//    });
//};
//

