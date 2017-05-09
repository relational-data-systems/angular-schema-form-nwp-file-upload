var fs = require('fs'),
  tasks = fs.readdirSync('./gulp/tasks'),
  gulp = require('gulp'),
  notify = require('gulp-notify'),
  argv = require('yargs').argv;

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

tasks.forEach(function (task) {
  require('./tasks/' + task);
});
