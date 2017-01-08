var gulp = require('gulp'),
    KarmaServer = require('karma').Server,
    inject = require('gulp-inject'),
    bowerFiles = require('main-bower-files'),
    runSequence = require('run-sequence'),
    plumber = require('gulp-plumber'),
    debug = require('gulp-debug');


function filepathForKarma(filepath, file, i, length) {
  return '"' + filepath + '",';
}

gulp.task('inject-test:vendor', function () {
  var injectOptions = {
    name: 'bower',
    relative: true,
    starttag: "// inject-bower",
    endtag: "// end-inject-bower",
    transform: filepathForKarma,
  };

  var stream = gulp.src(settings.karmaConfig)
    .pipe(plumber({errorHandler: handleErrors}))
    .pipe(inject(
      gulp.src(
        bowerFiles("**/*.js", { checkExistence: true }),
        { read: false }
      ).pipe(debug()),
      injectOptions
    )).pipe(gulp.dest(settings.appRoot));

  return stream;
});

gulp.task('inject-test', function() {
  runSequence(['inject-test:vendor']);
});