var gulp   = require('gulp'),
    tinylr = require('tiny-lr'),
    usemin = require('gulp-usemin'),
    del    = require('del'),
    zip    = require('gulp-zip'),
    mfst   = require('./manifest.json'),
    stylus = require('gulp-stylus'),
    debug  = require('gulp-debug');


var FILES = {
  copy: [
    '*.*',
    'node_modules',
    '{art,art/**}',
    '!{panel,panel/**}',
    '!package.json',
    '!gulpfile.js'
  ].concat('{' + mfst.web_accessible_resources.join(',') + ',!node_modules/**}'),
  watch: ['panel/**/*.{js,css,html}'],
  stylusRoot: 'panel/styles/',
  stylusGlob: 'panel/styles/**/*.styl',
  stylus: 'panel/styles/repl.styl',
  panel: 'panel/repl.html',
  dist: 'dist/',
  distPanel: 'dist/panel/',
  distAll: 'dist/**',
  zip: 'Scratch JS.zip',
  root: './'
}

gulp.task('stylus', function() {
  return gulp.src(FILES.stylus)
    .pipe(stylus())
    .pipe(gulp.dest(FILES.stylusRoot));
});

gulp.task('dev', gulp.series('stylus', function () {
  var lr = tinylr();
  lr.listen(35729);
  gulp.watch(FILES.stylusGlob, gulp.series('stylus'));
  gulp.watch(FILES.watch, function (evt) {
    lr.changed({
      body: {
        files: [evt.path]
      }
    });
  });
}));

gulp.task('clean', function() {
  return del([FILES.distAll, FILES.zip], {force: true});
});

gulp.task('copy', function() {
  return gulp.src(FILES.copy)
    .pipe(gulp.dest(FILES.dist));
});

gulp.task('usemin', function() {
  return gulp.src(FILES.panel)
    .pipe(debug({title: 'usemin:'}))
    .pipe(usemin())
    .pipe(debug({title: 'dest:'}))
    .pipe(gulp.dest(FILES.distPanel));
});

gulp.task('zip', gulp.series('stylus', 'clean', 'usemin', 'copy', function() {
  return gulp.src(FILES.distAll)
    .pipe(zip(FILES.zip))
    .pipe(gulp.dest(FILES.root));
}));

gulp.task('default', gulp.series('dev'));
gulp.task('build', gulp.series('zip'));
