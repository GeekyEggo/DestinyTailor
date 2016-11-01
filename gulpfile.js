var del = require('del');
var gulp = require('gulp');
var merge = require('merge-stream');
var wiredep = require('wiredep').stream;
var $ = require('gulp-load-plugins')({ lazy: true });

var client = 'client/';
var temp = './.tmp/';

var config = { 
    // local files
    css: client + 'css/',
    html: client + 'index.html',
    fonts: [
        client + 'fonts/*.*',
        './bower_components/bootstrap/dist/fonts/*.*',
        './bower_components/roboto-fontface/fonts/Roboto-Bold.*',
        './bower_components/roboto-fontface/fonts/Roboto-Light.*',
        './bower_components/roboto-fontface/fonts/Roboto-Medium.*',
        './bower_components/roboto-fontface/fonts/Roboto-Regular.*'
    ],
    js: client + 'js/',
    templates: client + 'js/**/*.html',

    // local folders
    client: client,
    dist: './dist/',
    temp: temp,

    // htmlmin
    htmlmin: {
        collapseWhitespace: true
    },

    // ng-annotate
    ngAnnotate: {
        add: true,
        single_quotes: true
    },

    // angular template cache
    templateCache: {
        file: 'templates.js',
        options: {
            module: 'main',
            root: '/js/',
            standAlone: false
        }
    },

    // useref
    useref: {
        searchPath: './'
    },

    // wiredep
    wiredep: {
        ignorePath: '..',
        overrides: {
            bootstrap: {
                main: [
                    'dist/css/bootstrap.css',
                    'dist/js/bootstrap.js'
                ]
            },
            'ng-focus-if': {
                main: 'focusIf.min.js'
            },
            octicons: {
                main: [
                    'octicons/octicons.css',
                    'octicons/octicons.eot',
                    'octicons/octicons.svg',
                    'octicons/octicons.ttf',
                    'octicons/octicons.woff'
                ]
            }
        }
    }
};

var googleAnalytics = 'google-analytics.js';

// linting
config.jscs = {
    src: [
        config.js + '**/*.js',
        '!' + config.js + '**/definitions.js',
        '!' + config.js + '**/' + googleAnalytics
    ]
}

// inject
config.inject = {
    css: {
        src: config.css + '**/*.css',
        order: [
            '**/*(!main*).css',
            '**/main-xs.css'
        ]
    },
    js: {
        src: [
            config.js + '**/*.js',
            '!' + config.js + '**/' + googleAnalytics
        ],
        order: [
            '**/app.module.js',
            '**/app.config.js',
            '**/app.constants.js',
            '**/app.routes.js',
            '**/shared/*.js',
            '**/models/*.js',
            '**/services/*.js',
            '**/**/*.js'
        ],
    },
    googleAnalytics: {
        src: config.js + googleAnalytics,
        name: 'inject:analytics'
    },
    templates: {
        src: temp + config.templateCache.file,
        name: 'inject:templates'
    }
};

/**
 * Validates the styling of the client-side JavaScript.
 * @returns {Object} The stream.
 */
gulp.task('check', function() {
    return gulp
        .src(config.jscs.src)
        .pipe($.jscs())
        .pipe($.jscs.reporter());
});

/**
 * Cleans the distribution folder.
 */
gulp.task('clean', function() {
    var delConfig = [config.dist, config.temp];
    return del(delConfig);
});

/**
 * Moves all required fonts to the build folder.
 * @returns {Object} The stream.
 */
gulp.task('fonts', ['clean'], function() {
    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.dist + 'fonts'));
});

/**
 * Injects the dependencies into the html.
 * @returns {Object} The stream.
 */
gulp.task('inject', function() {
    return gulp
        .src(config.html)
        // bower
        .pipe(wiredep(config.wiredep))
        // css and js
        .pipe($.inject(orderSrc(config.inject.css.src, config.inject.css.order)))
        .pipe($.inject(orderSrc(config.inject.js.src, config.inject.js.order)))
        .pipe(gulp.dest(config.client));
});

/**
 * Optimizes the client files for distribution.
 * @returns {Object} The stream.
 */
gulp.task('optimize', ['inject', 'template-cache'], function() {
    var assets = $.useref.assets({searchPath: ['.tmp', 'client', '.']});

    return gulp.src(config.html)
        // inject the anyltics and templates
        .pipe($.inject(gulp.src(config.inject.googleAnalytics.src), config.inject.googleAnalytics))
        .pipe($.inject(gulp.src(config.inject.templates.src), config.inject.templates))
        .pipe(assets)
        // minify js and css
        .pipe($.if('*.js', $.uglify()))
        .pipe($.if('*.css', $.cssnano()))
        // cache-bust
        .pipe($.rev())
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        // minify html
        .pipe($.if('*.html', $.htmlmin(config.htmlmin)))
        .pipe(gulp.dest(config.dist));
});

/**
 * Create $templateCache from the html templates
 * @returns {Object} The stream.
 */
gulp.task('template-cache', ['clean'], function() {
    return gulp
        .src(config.templates)
        .pipe($.htmlmin(config.htmlmin))
        .pipe($.angularTemplatecache(config.templateCache.file, config.templateCache.options))
        .pipe(gulp.dest(config.temp));
});

/**
 * Injects the CSS and JS into the HTML, and runs the server; everything is monitored.
 * @returns {Object} The stream.
 */
gulp.task('serve', ['inject'], function() {
    return $.nodemon({
        script: './bin/www',
        ignore: [
            'bower_components/**/*',
            'client/**/*',
            'gulpfile.js'
        ]
    }).on('start', function(ev) {
        gulp.watch(config.inject.js.src, function(ev) {
            if (ev.type === 'added' || ev.type === 'deleted') {
                gulp.start('inject');
            };
        });
    });
});

/**
 * Order a stream.
 * @param {Stream} src The gulp.src stream.
 * @param {Array} order Glob array pattern.
 * @returns {Stream} The ordered stream.
 */
function orderSrc(src, order) {
    return gulp
        .src(src)
        .pipe($.if(order, $.order(order)));
}

gulp.task('default', ['inject', 'serve']);
gulp.task('dist', ['clean', 'fonts', 'optimize']);