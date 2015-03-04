var gulp   = require('gulp'),
    tinylr = require('tiny-lr'),
    usemin = require('gulp-usemin'),
    del    = require('del'),
    zip    = require('gulp-zip'),
    mfst   = require('./manifest.json');


var runtimes  = mfst.web_accessible_resources.reduce(function(glob, runtime) {
  return glob.concat([runtime.split('/').splice(1).join('/')]);
}, []).join(',');

var FILES = {
  copy: [
    '*.*',
    'node_modules',
    '!{panel,panel/**}',
    '!package.json',
    '!gulpfile.js'
  ].concat('{' + mfst.web_accessible_resources.join(',') + ',!node_modules/**}'),
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
