'use strict';

// jscs:disable requireCamelCaseOrUpperCaseIdentifiers
/* jshint camelcase: false */

var BPromise = require('bluebird');
var R = require('ramda');
var path = require('path');

var Db = function(bookshelf, options) {
  var _this = this;

  // we keep the fs to be able to stub it in tests
  _this.fs = require('fs-extra');
  BPromise.promisifyAll(_this.fs);
  _this.bookshelf = bookshelf;

  // load and attach all models to bookshelf and obj.models automatically
  _this.models = {};
  _this.fs.readdir('./lib/models', function(error, fileNames) {
    R.forEach(function(fileName) {
      require('./models/' + fileName)(_this);
    }, fileNames);
  });

  _this.options = R.merge({

    // false or folder to save failed to
    saveToDisk: false,

    // retry insertion of failed carts when next schedule is run
    retryFailedOnNextRun: false
  }, options);

  if (_this.options.saveToDisk) {
    _this.fs.ensureDirSync(_this.options.saveToDisk);
    _this.fs.ensureDirSync(path.join(_this.options.saveToDisk, 'failed'));
    _this.fs.ensureDirSync(path.join(_this.options.saveToDisk, 'completed'));
  }
};

Db.prototype._ensure = function(Model, instance, criteria, transaction) {
  return Model
    .forge(criteria)
    .fetch({transacting: transaction})
    .then(function(result) {
      if (result) {
        return result;
      } else {
        return Model.forge(instance)
          .save(null, {transacting: transaction});
      }
    });
};

Db.prototype.cartDiskName = function(cart, subfolder) {
  var _this = this;
  var name = _this.options.saveToDisk + '/' +
    (subfolder ? subfolder + '/' : '') +
    cart.started + '-' +
    cart.finished + '-' +
    cart.results.length +
    '.json';
  return name;
};

Db.prototype.saveCartToDisk = function(cart) {
  var _this = this;
  return _this.fs.outputJsonAsync(_this.cartDiskName(cart), cart);
};

Db.prototype.loadJsonFiles = function(folder) {
  var _this = this;
  return _this.fs.readdirAsync(folder)
    .map(function(fileName) {
      if (R.test(/.json/, fileName)) {
        return _this.fs.readJsonAsync(path.join(folder, fileName));
      }
    });
};

Db.prototype.ensureSources = function(cart) {
  var _this = this;
  return _this.bookshelf.transaction(function(t) {
    var promises = R.map(function(result) {
      return _this.models.Source
        .forge({name: result.map.name, url: result.map.url})
        .ensure({url: result.map.url}, t)
        .then(function(source) {
          return source;
        });
    }, cart.results);

    return BPromise.all(promises);
  });
};

Db.prototype.ensureWords = function(cart) {
  var _this = this;
  return _this.bookshelf.transaction(function(t) {

    // TODO extract these to cartUtils.js?
    var cartGold = R.pipe(
      R.pluck('gold'),
      R.flatten);
    var cartWords = R.pipe(
      cartGold,
      R.pluck('keywords'),
      R.flatten
    );
    var cartUniqueWords = R.pipe(
      cartWords,
      R.pluck('word'),
      R.uniq
    );
    var words = cartUniqueWords(cart.results);
    var promises = R.map(function(word) {
      return _this.models.Word
        .forge({word: word})
        .ensure({word: word}, t);
    }, words);

    return BPromise.all(promises);
  });
};

//Db.prototype.retryFailed = function() {
//  var _this = this;
//  return _this.loadJsonFiles(_this.options.saveToDisk)
//    .tap(function(files) {
//      //console.log(files);
//    })
//    .map(function(cart) {
//      //console.log(cart);
//      return _this.insertCart(cart, true);
//    })
//    .then(function(results) {
//      //console.log(results);
//    });
//};

Db.prototype.initializeInsert = function(cart, retrying) {
  var _this = this;
  return new BPromise(function(resolve, reject) {
    if (_this.options.saveToDisk && !retrying) {
      _this.saveCartToDisk(cart)
        .then(function() {
          return resolve();
        })
        .catch(function(error) {
          return reject(error);
        });
    } else {
      return resolve();
    }
  });
};

Db.prototype.moveProcessedCart = function(cart, failed) {
  var _this = this;
  var folder = failed ? 'failed' : 'completed';
  return _this.fs.moveAsync(
      _this.cartDiskName(cart),
      _this.cartDiskName(cart, folder)
    );
};

Db.prototype.finalizeInsert = function(cart, retrying, error, result) {
  var _this = this;

  // TODO turn this into an array of promises that must be run in the end
  return new BPromise(function(resolve, reject) {
    var finish = function() {
      if (error) {
        return reject(error);
      } else {
        return resolve(result);
      }
    };

    if (_this.options.saveToDisk) {
      _this.moveProcessedCart(cart, error).catch(function() {

        // TODO handle this somehow that also does not show up in tests
        //console.error('Failed to save ' + _this.cartDiskName(cart), error);
      }).finally(function() {
        return finish();
      });
    } else {
      return finish();
    }
  });
};

Db.prototype.insertCart = function(cart, retrying) {
  var _this = this;
  return _this.initializeInsert(cart, retrying).then(function() {
    return _this.ensureSources(cart);
  }).then(function() {
    return _this.ensureWords(cart);
  }).then(function() {
    return _this.insertCartItems(cart);
  }).catch(function(error) {
    return _this.finalizeInsert(cart, retrying, error);
  }).then(function(result) {
    return _this.finalizeInsert(cart, retrying, null, result);
  });
};

Db.prototype.insertCartItems = function(cart) {
  var _this = this;
  return _this.bookshelf.transaction(function(t) {
    var promises = R.map(function(result) {
      return _this.insertCartItem(result, t);
    }, cart.results);
    return BPromise.all(promises);
  });
};

Db.prototype.insertCartItem = function(cartItem, transaction) {
  var _this = this;
  return _this.insertPage(cartItem, transaction)
    .tap(function(page) {
      return BPromise.map(cartItem.gold, function(gold) {
        return _this.insertSentence(gold, page.id, transaction)
          .tap(function(sentence) {
            return BPromise.map(gold.keywords, function(keyword) {
              return _this.insertSentenceWord(
                keyword,
                sentence.id,
                transaction
              );
            });
          });
      });
    });
};

Db.prototype.insertPage = function(page, transaction) {
  var _this = this;
  return _this.models.Source
    .forge({name: page.map.name, url: page.map.url})
    .fetch({transacting: transaction})
    .then(function(source) {
      return _this.models.Page
        .forge({
          source_id: source.id,
          created_at: Date.now(),
          count: page.gold.length
        })
        .save(null, {transacting: transaction});
    });
};

Db.prototype.insertSentence = function(sentence, pageId, transaction) {
  var _this = this;
  return _this.models.Sentence
    .forge({
      page_id: pageId,
      sentence: sentence.text,
      href: sentence.href,
      tag: sentence.tag,
      position: sentence.position
    })
    .save(null, {transacting: transaction});
};

Db.prototype.insertSentenceWord = function(sentenceWord,
                                            sentenceId,
                                            transaction) {
  var _this = this;
  return _this.models.Word
    .forge({word: sentenceWord.word})
    .fetch({transacting: transaction})
    .then(function(word) {
      return _this.models.SentenceWord
        .forge({
          sentence_id: sentenceId,
          word_id: word.id,
          count: sentenceWord.count
        })
        .save(null, {transacting: transaction});
    });
};

module.exports = Db;
