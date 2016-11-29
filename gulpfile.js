const gulp        = require('gulp'),
      loadPlugins = require('gulp-load-plugins'),
      $           = loadPlugins(),
      config      = {};

gulp.task('default', () => {
    console.log('run either "gulp watch-src" or "gulp watch-front"');
});

gulp.task('watch-src', () => {
    return gulp.src('styles.less', { cwd: 'src/app/assets/styles/' })
        .pipe($.lessWatcher(config))
        .pipe($.less(config))
        .pipe($.cleanCss())
        .pipe(gulp.dest('src/app/assets/styles/'));
});

gulp.task('watch-front', () => {
    return gulp.src('styles.less', { cwd: 'front/assets/' })
        .pipe($.lessWatcher(config))
        .pipe($.less(config))
        .pipe(gulp.dest('front/assets/'));
});

gulp.task('front', () => {
    return gulp.src('styles.less', { cwd: 'front/assets/' })
        .pipe($.less(config))
        .pipe(gulp.dest('front/assets/'));
});

gulp.task('src', () => {
    return gulp.src('styles.less', { cwd: 'src/app/assets/styles/' })
        .pipe($.less(config))
        .pipe($.cleanCss())
        .pipe(gulp.dest('src/app/assets/styles/'));
});

gulp.task('compile-both', [ 'front', 'src' ], () => {});