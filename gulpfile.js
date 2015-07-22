var gulp   = require('gulp'),
    tinylr = require('tiny-lr'),
    usemin = require('gulp-usemin'),
    del    = require('del'),
    zip    = require('gulp-zip'),
    mfst   = require('./manifest.json')
    stylus = require('gulp-stylus');

var FILES = {
  copy: [
    '*.*',
    'node_modules',
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

gulp.task('dev', ['stylus'], function () {
  var lr = tinylr();
  lr.listen(35729);
  gulp.watch(FILES.stylusGlob, ['stylus']);
  gulp.watch(FILES.watch, function (evt) {
    lr.changed({
      body: {
        files: [evt.path]
      }
    });
  });
});

gulp.task('stylus', function() {
  return gulp.src(FILES.stylus)
    .pipe(stylus())
    .pipe(gulp.dest(FILES.stylusRoot));
});

gulp.task('copy', ['clean'], function() {
  return gulp.src(FILES.copy)
    .pipe(gulp.dest(FILES.dist));
});

gulp.task('usemin', ['clean'], function() {
  return gulp.src(FILES.panel)
    .pipe(usemin())
    .pipe(gulp.dest(FILES.distPanel));
});

gulp.task('clean', function(cb) {
  del([FILES.distAll, FILES.zip], {force: true}, cb);
});

gulp.task('zip', ['stylus', 'clean', 'usemin', 'copy'], function() {
  return gulp.src(FILES.distAll)
    .pipe(zip(FILES.zip))
    .pipe(gulp.dest(FILES.root));
});

gulp.task('default', ['dev']);
gulp.task('build', ['zip']);
