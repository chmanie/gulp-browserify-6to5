'use strict';

var SRC_PATH = './src';
var DIST_PATH = './dist';
var TMP_PATH = './.tmp';

// TODO:
// js vendor

var gulp = require('gulp');
var g = require('gulp-load-plugins')();

var runSequence = require('run-sequence');
var memRev = require('./utils/gulp-memrev');
var del = require('del');
var to5ify = require('6to5ify');
var karma = require('karma');

var DIST = false;
var CURRENT_PATH = TMP_PATH;

gulp.task('clean', function (done) {
  del([TMP_PATH, DIST_PATH], done);
});

gulp.task('html', function () {
  var stream = gulp.src(SRC_PATH + '/**/*.html');
  if (DIST) {
    stream.pipe(memRev.replace())
      .pipe(gulp.dest(CURRENT_PATH));
  } else {
    stream.pipe(g.connect.reload());
  }
  return stream;
});

gulp.task('images', function () {
  return gulp.src([SRC_PATH + '/images/**/*'])
    .pipe(g.imagemin())
    .pipe(gulp.dest(CURRENT_PATH + '/images'));
});

gulp.task('connect', function () {
  g.connect.server({
    root: [SRC_PATH, TMP_PATH],
    livereload: true
  });
});

gulp.task('watch', ['connect'], function () {
  gulp.watch(SRC_PATH + '/**/*.html', ['html']);
  gulp.watch(SRC_PATH + '/**/*.scss', ['sass']);
  gulp.watch(SRC_PATH + '/**/*.js',   ['browserify']);
});

gulp.task('serve', function (done) {
  runSequence('clean', 'lint', ['browserify', 'sass'], 'watch', done);
});

gulp.task('sass', function () {
  var stream = gulp.src(SRC_PATH + '/sass/main.scss')
    .pipe(g.plumber({errorHandler: g.notify.onError('Sass: <%= error.message %>')}))
    .pipe(g.sourcemaps.init())
    .pipe(g.sass({
      includePaths: './bower_components'
    }))
     // will probably break sourcemaps?
    .pipe(g.autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false,
        remove: true
      }))
    .pipe(g.sourcemaps.write());

  if (DIST) {
    stream
      .pipe(g.rev())
      .pipe(memRev());
  }

  return stream.pipe(gulp.dest(CURRENT_PATH + '/css/'));
});

gulp.task('browserify', ['lint'], function() {
  var stream = gulp.src(SRC_PATH + '/js/index.js')
    .pipe(g.plumber({errorHandler: g.notify.onError('Browserify: <%= error.message %>')}))
    .pipe(g.browserify2({
      fileName: 'bundle.js',
      transform: to5ify,
      options: {
        debug: !DIST
      }
    }));

  if (DIST) {
    stream
      .pipe(g.uglify())
      .pipe(g.rev())
      .pipe(memRev());
  }

  stream.pipe(gulp.dest(CURRENT_PATH + '/js/'));

  if (!DIST) stream.pipe(g.connect.reload());
  return stream;
});

gulp.task('lint', function () {
  var stream = gulp.src(SRC_PATH + '/js/**/*.js')
    .pipe(g.plumber({errorHandler: g.notify.onError('<%= error.message %>')}))
    .pipe(g.cached('linting'))
    .pipe(g.jshint())
    .pipe(g.jshint.reporter('jshint-stylish'))
    .pipe(g.jshint.reporter('fail'));
  return stream;
});

gulp.task('test', function (done) {
  karma.runner.run({port: 9876}, function(exitCode) {
    if (exitCode) return done('Karma tests failed');
    return done();
  });
});

gulp.task('dist', function (done) {
  DIST = true;
  CURRENT_PATH = DIST_PATH;
  runSequence('clean', 'lint', ['browserify', 'sass', 'images'], 'html', done);
});

gulp.task('default', ['serve']);
