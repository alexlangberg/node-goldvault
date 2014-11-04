'use strict';
/* jshint camelcase: false */

var Db = function (knex) {
  var obj = this;
  obj.knex = knex;
};

//// RESTRUCTURE GOLDWASHER
//Db.prototype.insertPage = function (cart) {
//  var obj = this;
//  return obj.ensure('source', {url: cart.map.url})
//    .then(function (rows) {
//      return obj.knex('page').insert({
//        source_id: rows[0],
//        created_at: cart.finished,
//        count: cart.results.gold.length
//      });
//    });
//};

Db.prototype.insertWord = function (wordObject, sentence_id) {
  var obj = this;
  return obj.ensure('word', {word: wordObject.word})
    .then(function (rows) {
      return obj.knex('sentence_word').insert({
        sentence_id: sentence_id,
        word_id: rows[0],
        count: wordObject.count
      });
    });
};

Db.prototype.ensure = function (table, ensureObject, selectColumn) {
  var obj = this;
  return obj.knex(table).where(ensureObject).select(selectColumn)
    .then(function (rows) {
      if (rows.length === 0) {
        return obj.knex(table)
          .insert(ensureObject);
      } else {
        return rows;
      }
    });
};

module.exports = Db;