'use strict';

var SRC_PATH = './src';
var DIST_PATH = './dist';
var TMP_PATH = './.tmp';

// TODO:
// js vendor
// gulp load-plugins?

var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var connect = require('gulp-connect');
var sass = require('gulp-sass');
var rev = require('gulp-rev');
var memRev = require('./utils/gulp-memrev');
var del = require('del');
var cache = require('gulp-cached');
var imagemin = require('gulp-imagemin');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var browserify = require('./utils/gulp-browserify');
var to5ify = require('6to5ify');

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
    stream.pipe(connect.reload());
  }
  return stream;
});

gulp.task('images', function () {
  return gulp.src([SRC_PATH + '/images/**/*'])
    .pipe(imagemin())
    .pipe(gulp.dest(CURRENT_PATH + '/images'));
});

gulp.task('connect', function () {
  connect.server({
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
    .pipe(plumber({errorHandler: notify.onError('Sass: <%= error.message %>')}))
    .pipe(sourcemaps.init())
    .pipe(sass({
      includePaths: './bower_components'
    }))
     // will probably break sourcemaps?
    .pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false,
        remove: true
      }))
    .pipe(sourcemaps.write());

  if (DIST) {
    stream
      .pipe(rev())
      .pipe(memRev());
  }

  return stream.pipe(gulp.dest(CURRENT_PATH + '/css/'));
});

gulp.task('browserify', ['lint'], function() {
  var stream = gulp.src([SRC_PATH + '/js/index.js', SRC_PATH + '/js/index2.js'])
    .pipe(plumber({errorHandler: notify.onError('Browserify: <%= error.message %>')}))
    .pipe(browserify({
      fileName: 'bundle.js',
      transform: to5ify,
      options: {
        debug: false
      }
    }));

  if (DIST) {
    stream
      .pipe(uglify())
      .pipe(rev())
      .pipe(memRev());
  }

  stream.pipe(gulp.dest(CURRENT_PATH + '/js/'));

  if (!DIST) stream.pipe(connect.reload());
  return stream;
});

gulp.task('lint', function () {
  var stream = gulp.src(SRC_PATH + '/js/**/*.js')
    .pipe(plumber({errorHandler: notify.onError('<%= error.message %>')}))
    .pipe(cache('linting'))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
  return stream;
});

gulp.task('dist', function (done) {
  DIST = true;
  CURRENT_PATH = DIST_PATH;
  runSequence('clean', 'lint', ['browserify', 'sass', 'images'], 'html', done);
});

gulp.task('default', ['serve']);
