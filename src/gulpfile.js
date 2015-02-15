var gulp = require('gulp');
var tinylr = require('tiny-lr');

gulp.task('dev', function () {
  var lr = tinylr();
  lr.listen(35729);
  gulp.watch(['**/*.{js,css,html}'], function (evt) {
    lr.changed({
      body: {
        files: [evt.path]
      }
    });
  });
});
