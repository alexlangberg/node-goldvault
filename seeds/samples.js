'use strict';

exports.seed = function(knex, Promise) {
  return knex('source')
    .insert({name: 'Foo', url: 'foo.com'})
    .then(function() {
      return knex('source').where({url: 'foo.com'}).select('id')
    })
    .then(function(rows) {
      return knex('page').insert({
        source_id: rows[0].id,
        created_at: Date.now(),
        count: 1
      });
    })
    .then(Promise.resolve());
};