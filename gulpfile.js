var gulp = require('gulp');
var babel = require('gulp-babel');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var uglify = require('gulp-uglifyes');
var cleanCSS = require('gulp-clean-css');
var rename = require('gulp-rename');
var del = require('del');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var autoprefixer = require('gulp-autoprefixer');
var ftp = require('vinyl-ftp');
var rsync = require('gulp-rsync');
var notify = require('gulp-notify');
var smartgrid = require('smart-grid');
var gcmq = require('gulp-group-css-media-queries');

var settings = {
    filename: '_smart-grid',
    outputStyle: 'sass',
    columns: 12,
    offset: '0px',
    mobileFirst: true,
    container: {
        maxWidth: '1920px',
        fields: '30px'
    },
    breakPoints: {
        xl: {
            'width': '1920px',
            'fields': '30px'
        },
        lg: {
            'width': '1366px',
            /* -> @media (min-width: 1366px) */
            'fields': '30px'
        },
        md: {
            'width': '1024px',
            'fields': '15px'
        },
        sm: {
            'width': '768px',
            'fields': '15px'
        },
        xs: {
            'width': '444px',
            'fields': '0px'
        }
    },
    mixinNames: {
        container: 'wrapper',
        row: 'row-flex',
        rowFloat: 'row-float',
        rowInlineBlock: 'row-ib',
        rowOffsets: 'row-offsets',
        column: 'col',
        size: 'size',
        columnFloat: 'col-float',
        columnInlineBlock: 'col-ib',
        columnPadding: 'col-padding',
        columnOffsets: 'col-offsets',
        shift: 'shift',
        from: 'from',
        to: 'to',
        fromTo: 'from-to',
        reset: 'reset',
        clearfix: 'clearfix',
        debug: 'debug'
    }
};

var paths = {
    base: 'app',
    images: 'app/img/**/*',
    sass: 'app/sass/**/*.sass',
    scss: 'app/sass/**/*.scss',
    vendorJS: 'app/libs/**/*.js',
    myJS: 'app/js/src/*.js',
    html: 'app/**/*.html',
    fonts: 'app/fonts/**/*'
};

gulp.task('smartgrid', function (done) {
    smartgrid('app/sass', settings);
    done();
});

gulp.task('removedist', function (done) {
    del.sync('dist');
    done();
});

gulp.task('clearcache', function (done) {
    cache.clearAll();
    done();
});

gulp.task('imagemin', function (done) {
    gulp.src(paths.images)
        .pipe(cache(imagemin()))
        .pipe(gulp.dest('dist/img'));
    done();
});

gulp.task('common-js', function concatJS(done) {
    gulp.src([
        'app/js/src/common.js'
    ])
        .pipe(concat('common.min.js'))
        // .pipe(babel({
        //     presets: ['@babel/env']
        // }))
        .pipe(uglify({
            mangle: true,
            ecma: 6
        }))
        .pipe(gulp.dest('app/js'));
    done();
});

gulp.task('js', gulp.series('common-js', function concatVendorJS() {
    return gulp.src([
        'app/js/common.min.js'
    ])
        .pipe(concat('scripts.min.js'))
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({
            stream: true
        }));
}));

gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: paths.base
        },
        port: 3000,
        notify: false
        // tunnel: false,
        // tunnel: "akavato", //http://akavato.localtunnel.me
    });
});

gulp.task('sass', function () {
    return gulp.src(paths.sass)
        .pipe(sass().on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min',
            prefix: ''
        }))
        .pipe(autoprefixer(['last 5 versions']))
    // .pipe(cleanCSS())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('group-media-queries', gulp.series('sass', function groupMediaQueries(done) {
    gulp.src('app/css/main.min.css')
        .pipe(gcmq())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css/'));
    done();
}));

gulp.task('watch', gulp.parallel('sass', 'js', 'browser-sync', function watch(done) {
    gulp.watch([paths.sass, paths.scss], gulp.series('sass'));
    gulp.watch([paths.vendorJS, paths.myJS], gulp.series('js'));
    gulp.watch(paths.html, function reload(done) {
        browserSync.reload();
        done();
    });
    done();
}));

gulp.task('build', gulp.series('removedist', gulp.parallel('imagemin', 'group-media-queries', 'js'), function moveFiles(done) {

    gulp.src([
        'app/**/*.html',
        'app/.htaccess',
        'app/robots.txt',
        'app/send.php'
    ]).pipe(gulp.dest('dist'));

    gulp.src([
        paths.fonts
    ]).pipe(gulp.dest('dist/fonts'));

    gulp.src([
        'app/css/*.min.css'
    ]).pipe(gulp.dest('dist/css'));

    gulp.src([
        'app/js/scripts.min.js'
    ]).pipe(gulp.dest('dist/js'));

    done();
}));

gulp.task('deploy', function () {

    let connection = ftp.create({
        host: 'hostname.com',
        user: 'username',
        password: 'userpassword',
        parallel: 10,
        log: gutil.log
    });

    let globs = [
        'dist/**',
        'dist/.htaccess',
        'dist/robots.txt',
        'dist/send.php'
    ];
    return gulp.src(globs, {
        buffer: false
    })
        .pipe(connection.dest('/path/to/folder/on/server'));
});

gulp.task('sync', function () {
    gulp.src('build/**')
        .pipe(rsync({
            root: 'build/',
            hostname: 'example.com',
            destination: 'path/to/site/',
            recursive: true,
            archive: true,
            silent: false,
            compress: true
        }));
});

gulp.task('default', gulp.series('watch'));
