'use strict';

var Model = function (db) {
  return db.bookshelf.Model.extend({
    tableName: 'words',
    sentenceWords: function () {
      return this.hasMany(db.models.SentenceWord);
    },
    ensure: function (criteria, t) {
      return db._ensure(db.models.Word, this.attributes, criteria, t);
    }
  });
};
module.exports = Model;