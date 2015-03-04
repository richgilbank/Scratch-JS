var gulp = require('gulp');
var tinylr = require('tiny-lr');
var usemin = require('gulp-usemin');
var del = require('del');
var zip = require('gulp-zip');

var FILES = {
  copy: [
    '**/*',
    '!{panel,panel/**}',
    '!package.json',
    '!gulpfile.js',
    '!{node_modules,node_modules/**}'
  ],
  watch: ['panel/**/*.{js,css,html}'],
  panel: 'panel/repl.html',
  dist: 'dist/',
  distPanel: 'dist/panel/',
  distAll: 'dist/**',
  zip: 'Scratch JS.zip',
  root: './'
}

gulp.task('dev', function () {
  var lr = tinylr();
  lr.listen(35729);
  gulp.watch(FILES.watch, function (evt) {
    lr.changed({
      body: {
        files: [evt.path]
      }
    });
  });
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

gulp.task('zip', ['clean', 'usemin', 'copy'], function() {
  return gulp.src(FILES.distAll)
    .pipe(zip(FILES.zip))
    .pipe(gulp.dest(FILES.root));
});

gulp.task('default', ['dev']);
gulp.task('build', ['zip']);
