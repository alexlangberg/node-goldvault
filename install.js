'use strict';

var Knex = require('knex');
var Config = require('./config.js');
var knex = Knex.initialize(Config.database);