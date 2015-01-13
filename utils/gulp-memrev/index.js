var through = require('through2');
var path = require('path');

function memRev() {

  return through.obj(function (file, enc, cb) {
    // ignore all non-rev'd files
    if (!file.path || !file.revOrigPath) {
      this.push(file);
      return cb();
    }

    memRev.files = memRev.files || [];

    memRev.files.push({
      revName: path.basename(file.path),
      origName: path.basename(file.revOrigPath)
    });

    this.push(file);

    cb();
  });
}

memRev.replace = function replace () {
  return through.obj(function (file, enc, cb) {
    if (!memRev.files.length) {
      this.push(file);
      return cb();
    }
    var contents = file.contents.toString();
    memRev.files.forEach(function (file) {
      contents = contents.replace(file.origName, file.revName);
    });
    file.contents = new Buffer(contents);
    this.push(file);
    cb();
  });
};

module.exports = memRev;