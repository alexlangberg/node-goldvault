'use strict';

exports.up = function (knex, Promise) {
  knex.schema
    .createTable('sources', function (table) {
      table.increments('id').unique().primary();
      table.text('name');
      table.text('url').unique();
    })
    .createTable('pages', function (table) {
      table.increments('id').unique().primary();
      table.integer('source_id').unsigned().references('sources.id');
      table.timestamp('created_at');
      table.integer('count');
    })
    .createTable('sentences', function (table) {
      table.increments('id').unique().primary();
      table.integer('page_id').unsigned().references('pages.id');
      table.text('sentence');
      table.text('href');
      table.text('tag');
      table.integer('position');
    })
    .createTable('words', function (table) {
      table.increments('id').unique().primary();
      table.text('word').unique();
    })
    .createTable('sentences_words', function (table) {
      table.integer('sentence_id').unsigned().references('sentences.id');
      table.integer('word_id').unsigned().references('words.id');
      table.integer('count').unsigned();
    })
    .then(Promise.resolve());
};

exports.down = function (knex, Promise) {
  knex.schema
    .dropTable('sources')
    .dropTable('pages')
    .dropTable('sentences')
    .dropTable('words')
    .dropTable('sentences_words')
    .then(Promise.resolve());
};
