'use strict';

var Model = function (db) {
  db.models.SentenceWord = db.bookshelf.Model.extend({
    tableName: 'sentences_words',
    sentence: function () {
      return this.belongsTo(db.models.Sentence);
    },
    word: function () {
      return this.belongsTo(db.models.Word);
    }
  });
};
module.exports = Model;