var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	cleanCSS = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	del = require('del'),
	imagemin = require('gulp-imagemin'),
	cache = require('gulp-cache'),
	autoprefixer = require('gulp-autoprefixer'),
	ftp = require('vinyl-ftp'),
	rsync = require('gulp-rsync'),
	notify = require('gulp-notify'),
	smartgrid = require('smart-grid'),
	gcmq = require('gulp-group-css-media-queries');

var settings = {
	filename: '_smart-grid',
	outputStyle: 'sass',
	columns: 12,
	offset: '0px',
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
			/* -> @media (max-width: 1366px) */
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
	}
};

gulp.task('smartgrid', function () {
	smartgrid('app/sass', settings);
});

gulp.task('common-js', function () {
	return gulp.src([
			'app/js/common.js',
		])
		.pipe(concat('common.min.js'))
		//.pipe(uglify())
		.pipe(gulp.dest('app/js'));
});

gulp.task('js', ['common-js'], function () {
	return gulp.src([
			'app/libs/jquery/jquery.min.js',
			'app/js/common.min.js',
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
		notify: false,
		//tunnel: false,
		//tunnel: "akavato", //http://akavato.localtunnel.me
	});
});

gulp.task('sass', function () {
	return gulp.src('app/sass/**/*.sass')
		.pipe(sass().on('error', notify.onError()))
		.pipe(rename({
			suffix: '.min',
			prefix: ''
		}))
		.pipe(autoprefixer(['last 5 versions']))
		//.pipe(cleanCSS())
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('group-media-queries', ['sass'], function () {
	gulp.src('app/css/main.min.css')
		.pipe(gcmq())
		.pipe(cleanCSS())
		.pipe(gulp.dest('dist/css/gmq'));
});

gulp.task('watch', ['sass', 'js', 'browser-sync'], function () {
	gulp.watch('app/sass/**/*.sass', ['sass']);
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], ['js']);
	gulp.watch('app/**/*.html', browserSync.reload);
});

gulp.task('imagemin', function () {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin()))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('build', ['removedist', 'imagemin', 'group-media-queries', 'js'], function () {

	var buildFiles = gulp.src([
		'app/**/*.html',
		'app/.htaccess',
		'app/robots.txt',
		'app/send.php',
	]).pipe(gulp.dest('dist'));

	var buildCss = gulp.src([
		'app/css/gmq/main.min.css',
	]).pipe(gulp.dest('dist/css'));

	var buildJs = gulp.src([
		'app/js/scripts.min.js',
	]).pipe(gulp.dest('dist/js'));

	var buildFonts = gulp.src([
		'app/fonts/**/*',
	]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('deploy', function () {

	var conn = ftp.create({
		host: 'hostname.com',
		user: 'username',
		password: 'userpassword',
		parallel: 10,
		log: gutil.log
	});

	var globs = [
		'dist/**',
		'dist/.htaccess',
		'dist/robots.txt',
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

gulp.task('removedist', function () {
	return del.sync('dist');
});
gulp.task('clearcache', function () {
	return cache.clearAll();
});

gulp.task('default', ['watch']);