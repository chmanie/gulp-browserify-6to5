var through = require('through2');
var path = require('path');
var gutil = require('gulp-util');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var merge = require('deepmerge');

// TODO: handle browserify options

var defaults = {
  fileName: 'bundle.js',
  debug: true,
  transform: []
};

function gulpBrowserify(options) {

  options = options || {};

  var config = merge(defaults, options);

  return through.obj(function (file, enc, cb) {

    if (file.isStream()) {
      cb(new gutil.PluginError('gulp-browserify', 'Streaming not supported'));
      return;
    }

    var thr = this;

    var bundler = browserify({
      entries: [file.path],
      debug: config.debug
    });

    var stream = bundler;

    if(!Array.isArray(config.transform)) config.transform = [config.transform];
    if (config.transform.length) {
      config.transform.forEach(function (tr) {
        stream.transform(tr).on('error', cb);
      });
    }

    stream.bundle()
      .on('error', cb)
      .pipe(source(config.fileName))
      .pipe(buffer())
      .on('data', function (chunk) {
        thr.push(chunk);
      })
      .on('end', cb);
  });
}

module.exports = gulpBrowserify;