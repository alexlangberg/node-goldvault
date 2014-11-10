'use strict';
/* jshint camelcase: false */

var BPromise = require('bluebird');

var Db = function (knex) {
  var obj = this;
  obj.knex = knex;
};

Db.prototype.insertCart = function (cart) {
  var obj = this;
  var pagePromises = [];
  cart.results.forEach(function (result) {
    pagePromises.push(obj.insertPage(result));
  });
  return BPromise.all(pagePromises);
};

Db.prototype.insertPage = function (page) {
  var obj = this;

  return obj.knex.transaction(function (trx) {
    return obj.ensure(
      trx,
      'source',
      {url: page.map.url},
      {name: page.map.name, url: page.map.url}
    )
      .then(function (ids) {
        return trx('page').insert({
          source_id: ids[0],
          created_at: Date.now(),
          count: page.gold.length
        });
      })
      .then(function (ids) {
        var sentencePromises = [];
        page.gold.forEach(function (sentence) {
          sentencePromises.push(obj.insertSentence(trx, ids[0], sentence));
        });
        return BPromise.all(sentencePromises);
      });
  });
};

Db.prototype.insertSentence = function (knex, pageId, sentence) {
  var obj = this;
  return knex('sentence')
    .insert({
      page_id: pageId,
      sentence: sentence.text,
      href: sentence.href,
      tag: sentence.tag,
      position: sentence.position
    })
    .then(function (ids) {
      var sentenceWordPromises = [];
      sentence.keywords.forEach(function (sentenceWord) {
        sentenceWordPromises.push(
          obj.insertSentenceWord(knex, ids[0], sentenceWord)
        );
      });
      return BPromise.all(sentenceWordPromises);
    });
};

// TODO change goldwasher to return array of keywords. Rename index to position.
Db.prototype.insertSentenceWord = function (knex, sentenceId, sentenceWord) {
  var obj = this;
  return obj.ensure(
    knex,
    'word',
    {word: sentenceWord.word},
    {word: sentenceWord.word}
  )
    .then(function (ids) {
      return knex('sentence_word').insert({
        sentence_id: sentenceId,
        word_id: ids[0],
        count: sentenceWord.count
      });
    });
};

Db.prototype.ensure = function (knex, table, ensureSearch, itemObject) {
  return knex(table).where(ensureSearch).select()
    .then(function (ids) {
      if (ids.length === 0) {
        return knex(table)
          .insert(itemObject);
      } else {
        // return in same format as above
        return [ids[0].id];
      }
    });
};

module.exports = Db;
