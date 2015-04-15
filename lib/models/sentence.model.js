'use strict';

var Model = function (db) {
  db.models.Sentence = db.bookshelf.Model.extend({
    tableName: 'sentences',
    page: function () {
      return this.belongsTo(db.models.Page);
    },
    sentenceWords: function () {
      return this.hasMany(db.models.SentenceWord);
    }
  });
};
module.exports = Model;