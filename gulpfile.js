var gulp = require('gulp');
var gutil = require('gulp-util');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
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

gulp.task('smartgrid', function () {
    smartgrid('app/sass', settings);
});

gulp.task('common-js', function () {
    return gulp.src([
        'app/js/common.js'
    ])
        .pipe(concat('common.min.js'))
        //.pipe(uglify())
        .pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js'], function () {
    return gulp.src([
        'app/libs/jquery/jquery.min.js',
        'app/js/common.min.js'
    ])
        .pipe(concat('scripts.min.js'))
        //.pipe(uglify())
        .pipe(gulp.dest('app/js'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('browser-sync', function () {
    browserSync({
        server: {
            baseDir: 'app'
        },
        notify: false
        // tunnel: false,
        // tunnel: "akavato", //http://akavato.localtunnel.me
    });
});

gulp.task('sass', function () {
    return gulp.src('app/sass/**/*.sass')
        .pipe(sass().on('error', notify.onError()))
        .pipe(rename({
            suffix: '.min',
            prefix: ''
        }))
        .pipe(autoprefixer(['last 10 versions']))
        // .pipe(cleanCSS())
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('group-media-queries', ['sass'], function () {
    gulp.src('app/css/main.min.css')
        .pipe(gcmq())
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('watch', ['sass', 'js', 'browser-sync'], function () {
    gulp.watch(['app/sass/**/*.sass', 'app/sass/**/*.scss'], ['sass']);
    gulp.watch(['libs/**/*.js', 'app/js/*.js'], ['js']);
    gulp.watch('app/**/*.html', browserSync.reload);
});

gulp.task('imagemin', function () {
    return gulp.src('app/img/**/*')
        .pipe(cache(imagemin()))
        .pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['removedist', 'imagemin', 'group-media-queries', 'js'], function () {

    let buildFiles = gulp.src([
        'app/**/*.html',
        'app/.htaccess',
        'app/robots.txt',
        'app/send.php'
    ]).pipe(gulp.dest('dist'));

    let buildCss = gulp.src([
        'app/css/*.min.css'
    ]).pipe(gulp.dest('dist/css'));

    let buildJs = gulp.src([
        'app/js/scripts.min.js'
    ]).pipe(gulp.dest('dist/js'));

    let buildFonts = gulp.src([
        'app/fonts/**/*'
    ]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('removedist', function () {
    return del.sync('dist');
});
gulp.task('clearcache', function () {
    return cache.clearAll();
});

gulp.task('deploy', function () {

    let conn = ftp.create({
        host: 'hostname.com',
        user: 'username',
        password: 'userpassword',
        parallel: 10,
        log: gutil.log
    });

    let globs = [
        'dist/**',
        'dist/.htaccess',
        'dist/robots.txt'
    ];
    return gulp.src(globs, {
        buffer: false
    })
        .pipe(conn.dest('/path/to/folder/on/server'));

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

gulp.task('default', ['watch']);
