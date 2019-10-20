const {src, dest, watch, series} = require('gulp');
const sass = require('gulp-sass');
const server = require('browser-sync').create();
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

const paths = {
    styles: {
        src: 'src/scss/*.scss',
        dest: 'dist/css/'
    },
    scripts: {
        src: 'src/js/*.js',
        dest: 'dist/js/'
    }
};

function styles() {
    return src(paths.styles.src) // Gets all files ending with .scss in app/scss and children dirs
        .pipe(sass())
        .pipe(dest(paths.styles.dest))
}

function scripts() {
    return src(paths.scripts.src, {sourcemaps: true})
        .pipe(babel({presets: ['@babel/preset-env'], plugins: ["@babel/plugin-proposal-class-properties"]}))
        .pipe(uglify())
        .pipe(dest(paths.scripts.dest));
}

function reload(done) {
    server.reload();
    done();
}

function serve(done) {
    server.init('*.html', {
        server: './',
        open: false
    });
    done();
}

const watchFiles = () => watch([paths.styles.src, paths.scripts.src], series(styles, scripts, reload));

exports.default = series(styles, scripts, serve, watchFiles);