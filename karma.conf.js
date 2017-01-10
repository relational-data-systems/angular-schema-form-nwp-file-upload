// Karma configuration
// Generated on Sat Jan 07 2017 13:59:27 GMT+1030 (ACDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      // inject-bower
      "bower_components/angular/angular.js",
      "bower_components/tv4/tv4.js",
      "bower_components/angular-sanitize/angular-sanitize.js",
      "bower_components/objectpath/lib/ObjectPath.js",
      "bower_components/ng-file-upload/ng-file-upload.js",
      "bower_components/angular-messages/angular-messages.js",
      "bower_components/moment/moment.js",
      "bower_components/moment-timezone/builds/moment-timezone-with-data-2010-2020.js",
      "bower_components/angular-schema-form/dist/schema-form.js",
      "bower_components/angular-datepicker/dist/angular-datepicker.js",
      "bower_components/angular-schema-form-bootstrap/bootstrap-decorator.js",
      // end-inject-bower
      "bower_components/angular-mocks/angular-mocks.js",
      // inject-app
      "src/schema-form-file.spec.js",
      "src/schema-form-file.js",
      // end-inject-app
    ],


    // list of files to exclude
    exclude: [
      '**/*.html'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
