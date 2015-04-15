'use strict';

var Model = function (db) {
  db.models.Source = db.bookshelf.Model.extend({
    tableName: 'sources',
    pages: function () {
      return this.hasMany(db.models.Page, 'source_id');
    },
    ensure: function (criteria, t) {
      return db._ensure(db.models.Source, this.attributes, criteria, t);
    }
  });
};
module.exports = Model;