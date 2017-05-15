var path = require('path');

var appRoot = path.resolve(__dirname) + '/';
var settings = {
  appRoot: appRoot,
  src: appRoot + 'src/',
  test: appRoot + 'test/',
  bowerComponents: 'bower_components/',
  dist: appRoot + 'dist/',
  karmaConfigFile: appRoot + 'karma.conf.js'
};
global.settings = settings;

require('./gulp');
