'use strict';

var fs = require('fs');
var tasks = fs.readdirSync('./gulp/tasks');
var notify = require('gulp-notify');
var argv = require('yargs').argv;

global.handleErrors = function () {
  var args = Array.prototype.slice.call(arguments);
  var notification = argv.notification === undefined ? true : argv.notification;
  // Send error to notification center with gulp-notify
  if (notification) {
    notify.onError({
      title: 'Gulp Build',
      subtitle: 'Failure!',
      message: 'Error: <%= error.message %>',
      sound: 'Beep'
    }).apply(this, args);
  }
  // Keep gulp from hanging on this task
  this.emit('end');
};

global.filepathForKarma = function (filepath, file, i, length) {
  if (filepath.endsWith('.json')) {
    return '{pattern: \'' + filepath + '\', watched: true, served: true, included: false},';
  } else {
    return '\'' + filepath + '\',';
  }
};

tasks.forEach(function (task) {
  require('./tasks/' + task);
});
