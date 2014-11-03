'use strict';

exports.up = function (knex, Promise) {
  knex.schema
    .createTable('source', function (table) {
      table.increments('id').unique().primary();
      table.text('name');
      table.text('url').unique();
    })
    .createTable('page', function (table) {
      table.increments('id').unique().primary();
      table.integer('source_id').unsigned().references('source.id');
      table.timestamp('created_at');
      table.integer('count');
    })
    .createTable('sentence', function (table) {
      table.increments('id').unique().primary();
      table.integer('page_id').unsigned().references('page.id');
      table.text('sentence');
      table.text('link');
      table.text('tag');
      table.integer('position');
    })
    .createTable('word', function (table) {
      table.increments('id').unique().primary();
      table.text('word');
    })
    .createTable('sentence_word', function (table) {
      table.integer('sentence_id').unsigned().references('sentence.id');
      table.integer('word_id').unsigned().references('word.id');
    })
    .then(Promise.resolve());
};

exports.down = function (knex, Promise) {
  knex.schema
    .dropTable('source')
    .dropTable('page')
    .dropTable('sentence')
    .dropTable('word')
    .dropTable('sentence_word')
    .then(Promise.resolve());
};
