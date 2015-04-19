'use strict';
/* jshint camelcase: false */

var BPromise = require('bluebird');
var R = require('ramda');
var path = require('path');
//BPromise.promisifyAll(fs);

var Db = function (bookshelf, options) {
  var obj = this;
  // we keep the fs to be able to stub it in tests
  obj.fs = require('fs-extra');
  BPromise.promisifyAll(obj.fs);
  obj.bookshelf = bookshelf;

  // load and attach all models to bookshelf and obj.models automatically
  obj.models = {};
  // TODO promisify fs
  obj.fs.readdir('./lib/models', function(error, fileNames) {
    R.forEach(function(fileName) {
      require('./models/' + fileName)(obj);
    }, fileNames);
  });

  // merge options over default options
  obj.options = R.merge({
    // false or folder to save failed to
    saveFailedToDisk: false,
    // retry insertion of failed carts when next schedule is run
    retryFailedOnNextRun: false
  }, options);
  // TODO create saveFailedToDisk folder on startup
};

Db.prototype._ensure = function (Model, instance, criteria, transaction) {
  return new Model(criteria)
    .fetch({transacting: transaction})
    .then(function (result) {
      if (result) {
        return result;
      } else {
        return new Model(instance)
          .save(null, {transacting: transaction});
      }
    });
};

Db.prototype.failedDiskName = function (cart) {
  var obj = this;
  var name = obj.options.saveFailedToDisk + '/' +
    cart.started + '-' +
    cart.finished + '-' +
    cart.results.length +
    '.json';
  return name;
};

// TODO promisify fs
Db.prototype.saveCartToDisk = function (cart) {
  var obj = this;
  return new BPromise(function (resolve, reject) {
    obj.fs.outputJson(obj.failedDiskName(cart), cart, function (error) {
      if (error) {
        return reject(error);
      } else {
        return resolve();
      }
    });
  });
};

Db.prototype.transaction = function (actions) {
  var obj = this;
  return obj.bookshelf.transaction(function (transaction) {
    return actions(transaction);
  });
};

Db.prototype.insertCart = function (cart, retrying) {
  var obj = this;
  return new BPromise(function (resolve, reject) {
    var pagePromises = R.map(function(result) {
      return obj.insertCartItem(result);
    }, cart.results);
    BPromise.all(pagePromises)
      .catch(function (error) {
        if (obj.options.saveFailedToDisk && !retrying) {
          obj.saveCartToDisk(cart)
            .catch(function (saveError) {
              // the show must go on
              console.error(saveError);
            })
            .finally(function () {
              return reject(error);
            });
        } else {
          return reject(error);
        }
      })
      .then(function (results) {
        // TODO delete file if retrying and successful
        return resolve(results);
      });
  });
};

Db.prototype.insertCartItem = function (cartItem) {
  var obj = this;
  return obj.transaction(function (t) {
    return obj.insertPage(cartItem, t)
      .tap(function (page) {
        return BPromise.map(cartItem.gold, function (gold) {
          return obj.insertSentence(gold, page.id, t)
            .tap(function (sentence) {
              return BPromise.map(gold.keywords, function (keyword) {
                return obj.insertSentenceWord(keyword, sentence.id, t);
              });
            });
        });
      });
  });
};

Db.prototype.insertPage = function (page, transaction) {
  var obj = this;
  return new obj.models
    .Source({name: page.map.name, url: page.map.url})
    .ensure({url: page.map.url}, transaction)
    .then(function (source) {
      return new obj.models
        .Page({
          source_id: source.id,
          created_at: Date.now(),
          count: page.gold.length
        })
        .save(null, {transacting: transaction});
    });
};

Db.prototype.insertSentence = function (sentence, pageId, transaction) {
  var obj = this;
  return new obj.models
    .Sentence({
      page_id: pageId,
      sentence: sentence.text,
      href: sentence.href,
      tag: sentence.tag,
      position: sentence.position
    })
    .save(null, {transacting: transaction});
};

Db.prototype.insertSentenceWord = function (sentenceWord,
                                            sentenceId,
                                            transaction) {
  var obj = this;
  return new obj.models
    .Word({word: sentenceWord.word})
    .ensure({word: sentenceWord.word}, transaction)
    .then(function (word) {
      return new obj.models
        .SentenceWord({
          sentence_id: sentenceId,
          word_id: word.id,
          count: sentenceWord.count
        })
        .save(null, {transacting: transaction});
    });
};

//Db.prototype.retryFailed = function() {
//  var obj = this;
//  return new BPromise(function(resolve, reject) {
//    obj.loadJsonFiles(obj.options.saveFailedToDisk)
//      .then(function(carts) {
//        return R.map(function(cart) {
//          return obj.insertCart(cart, true);
//        }, carts);
//      })
//      .then(function(items) {
//
//      });
//    //obj.fs.readdirAsync(obj.options.saveFailedToDisk)
//    //  .then(function(fileNames) {
//    //    var promises = R.map(function(fileName) {
//    //      obj.fs.readJsonAsync(obj.options.saveFailedToDisk + '/' + fileName)
//    //        .then(function(cart) {
//    //          return obj.insertCart(cart, true);
//    //        });
//    //    }, fileNames);
//    //    return resolve();
//    //});
//  });
//};

Db.prototype.retryFailed = function() {
  var obj = this;
  return obj.loadJsonFiles(obj.options.saveFailedToDisk)
    .tap(function(files) {
      console.log(files);
    })
    .map(function(cart) {
      //console.log(cart);
      return obj.insertCart(cart, true);
    })
    .then(function(results) {
      console.log(results);
    });
};

Db.prototype.loadJsonFiles = function(folder) {
  var obj = this;
  return obj.fs.readdirAsync(folder)
    .map(function(fileName) {
      return obj.fs.readJsonAsync(path.join(folder, fileName));
    });
};

module.exports = Db;
