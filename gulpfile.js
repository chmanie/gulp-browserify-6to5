'use strict';

// TODO:
// sass
// js vendor
// test (karma?)
// rev
// gulp notify

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var to5ify = require('6to5ify');
var sourcemaps = require('gulp-sourcemaps');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var connect = require('gulp-connect');

var DIST = false;
var DEST_PATH = './.tmp';

gulp.task('html', function () {
  return gulp.src('./src/**/*.html')
    .pipe(connect.reload());
});

gulp.task('connect', function () {
  connect.server({
    root: ['./src', './.tmp'],
    livereload: true
  });
});

gulp.task('watch', ['connect'], function () {
  gulp.watch('./src/**/*.html', ['html']);
  gulp.watch('./src/**/*.js', ['browserify']);
});

gulp.task('serve', function (done) {
  runSequence('lint', ['browserify'], 'watch', done);
});

gulp.task('browserify', ['lint'], function() {

  var bundler = browserify({
    entries: ['./src/js/index.js'],
    debug: !DIST
  });

  var bundle = function() {
    var stream = bundler
    	.transform(to5ify)
      .bundle()
      .pipe(source('bundle.js'))
      .pipe(buffer());
    if (DIST) {
      stream.pipe(sourcemaps.init({loadMaps: true}))
      .pipe(uglify())
      .pipe(sourcemaps.write('./'));
    }
    stream.pipe(gulp.dest(DEST_PATH + '/js/'));
    if (!DIST) stream.pipe(connect.reload());
    return stream;
  };

  return bundle();
});

gulp.task('lint', function () {
  var stream = gulp.src('src/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
  if (DIST) {
    stream.pipe(jshint.reporter('fail'));
  }
  return stream;
});

gulp.task('copy:dist', function () {
  return gulp.src('src/*.html')
		.pipe(gulp.dest(DEST_PATH));
});

gulp.task('dist', function (done) {
  DIST = true;
  DEST_PATH = './dist';
  runSequence('lint', ['browserify', 'copy:dist'], done);
});