var path = require('path');

var appRoot = path.resolve(__dirname) + '/';
var settings = {
  appRoot: appRoot,
  src: appRoot + 'src/',
  dist: appRoot + 'dist/',
  karmaConfig: appRoot + 'karma.conf.js'
};
global.settings = settings;

require('./gulp');
