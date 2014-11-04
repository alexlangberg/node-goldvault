'use strict';

exports.seed = function (knex, Promise) {
  return knex('source')
    .insert({name: 'Foo', url: 'foo.com'})
    .then(function () {
      return knex('source').where({url: 'foo.com'}).select('id')
    })
    .then(function (rows) {
      return knex('page').insert({
        source_id: rows[0].id,
        created_at: Date.now(),
        count: 1
      });
    })
    .then(function (rows) {
      return knex('sentence').insert({
        page_id: rows[0],
        sentence: 'Oak is strong and also gives shade.',
        link: 'http://www.oakisstrong.com/oak/strong',
        tag: 'h1',
        position: 0
      });
    })
    .then(function (rows) {
      var words = [
        {word: 'oak', count: 1},
        {word: 'strong', count: 3},
        {word: 'gives', count: 4},
        {word: 'shade', count: 2}
      ];
      var promises = [];
      words.forEach(function (word) {
        promises.push(insertWord(knex, word, rows[0]));
      });
      return Promise.all(promises);
    });
  //.then(Promise.resolve());
};

var insertWord = function (knex, wordObject, sentence_id) {
  return ensure(knex, 'word', {word: wordObject.word})
    .then(function (rows) {
      return knex('sentence_word').insert({
        sentence_id: sentence_id,
        word_id: rows[0],
        count: wordObject.count
      });
    });
};

var ensure = function (knex, table, ensureObject, selectColumn) {
  return knex(table).where(ensureObject).select(selectColumn)
    .then(function (rows) {
      if (rows.length === 0) {
        return knex(table)
          .insert(ensureObject);
      }
      else {
        return rows;
      }
    });
};