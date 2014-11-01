'use strict';

var gulp = require('gulp');
var lab = require('gulp-lab');
var jshint = require('gulp-jshint');
var coveralls = require('gulp-coveralls');
var batch = require('gulp-batch');
var betterConsole = require('better-console');
var jsdoc = require('gulp-jsdoc');
var jsPaths = ['*.js', 'lib/**/*.js', 'test/**/*.js', 'migrations/**/*.js'];

var test = function () {
  return gulp.src(['test/*.js'])
        .pipe(lab('-v -c'));
};

var lint = function () {
  return gulp.src(jsPaths)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
};

var clear = function () {
  betterConsole.clear();
};

gulp.task('default', ['lint', 'test']);

gulp.task('ci', ['lint', 'test', 'coveralls']);

gulp.task('watch', function () {
  gulp.watch(jsPaths, batch(function () {
    clear();
    lint();
    test();
  }));
});

gulp.task('lint', function () {
  lint();
});

gulp.task('test', function () {
  test();
});

gulp.task('coveralls', ['test'], function () {
  return gulp.src('coverage/lcov.info').pipe(coveralls());
});

gulp.task('jsdoc', function () {
  return gulp.src(['index.js', 'README.md'])
    .pipe(jsdoc('./docs'));
});