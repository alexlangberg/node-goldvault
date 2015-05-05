'use strict';

var Model = function (db) {
  db.models.Cart = db.bookshelf.Model.extend({
    tableName: 'carts',
    pages: function () {
      return this.hasMany(db.models.Page);
    }
  });
};
module.exports = Model;