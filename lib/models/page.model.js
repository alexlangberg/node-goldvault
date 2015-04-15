'use strict';

var Model = function (db) {
  db.models.Page = db.bookshelf.Model.extend({
    tableName: 'pages',
    source: function () {
      return this.belongsTo(db.models.Source);
    },
    sentences: function () {
      return this.hasMany(db.models.Sentence);
    }
  });
};
module.exports = Model;