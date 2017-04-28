let del = require('del');
let gulp = require('gulp');
let path = require('path');
let argv = require('yargs').argv;
let gutil = require('gulp-util');
let source = require('vinyl-source-stream');
let uglify = require('gulp-uglify');
let buffer = require('gulp-buffer');
let gulpCopy = require('gulp-copy');
let gulpif = require('gulp-if');
let exorcist = require('exorcist');
let babelify = require('babelify');
let insert = require('gulp-insert');
let browserify = require('browserify');
let browserSync = require('browser-sync');
let fs = require('fs');
let tinypng = require('gulp-tinypng-compress');
let jshint = require('gulp-jshint');
let cssmin = require('gulp-cssmin');
let rename = require('gulp-rename');
let htmlreplace = require('gulp-html-replace');
let merge = require('merge-stream');
let concat = require('gulp-concat');
let sourcemaps = require('gulp-sourcemaps');
let clean = require('gulp-clean');
let template = require('gulp-template');
let watchify = require('watchify');
let assign = require('lodash.assign');
let tap = require('gulp-tap');
let stripDebug = require('gulp-strip-debug');

let info = JSON.parse(fs.readFileSync('./package.json'));
let creativeInfo = JSON.parse(fs.readFileSync('./creative.json'));

let AD_EXTRA_FONTS = creativeInfo.extra_fonts;
let CSS_FONTS = creativeInfo.css_fonts;
let AD_GETAPP_INSTEAD_OF_TITLE = creativeInfo.getapp_instead_of_title;
let AD_ICON = creativeInfo.icon;

let GLOBAL_PATH = './../global_v2';
let GLOBAL_LIBS = creativeInfo.libs;
let PHASER_PATH = GLOBAL_PATH + '/js/phaser/' + creativeInfo.phaser;
let SERVE_PATH = './../../webroot/';
let BUILD_PATH = './../../webroot/' + info.name + '/';
let SCRIPTS_PATH = BUILD_PATH + '/js';
let SOURCE_PATH = './js';
let IMG_PATH = './img';
let ATLAS_PATH = './texture_sheets';
let ENTRY_FILE = SOURCE_PATH + '/main.js';
let OUTPUT_FILE = 'code.js';
let ICON_PATH = './' + creativeInfo.icon;
let CREATIVE_TMP_NAME = 'creative.js';
let TINY_PNG_API_KEY = 'uOcm62qGGuH93MynfXExwmC3-DvOYOFM';


let config = {
  paths: [path.join(__dirname, 'js')],
  entries: ENTRY_FILE,
  debug: true,
  transform: [
    [
      babelify, {
      presets: ["es2015"]
    }
    ]
  ]
};
let opts = assign({}, watchify.args, config);
//let bundler = watchify(browserify(opts));
let bundler = browserify(opts);
var keepFiles = false;

function isProduction() {
  return argv.production || argv.p;
}

function logBuildMode() {
  if (isProduction())
    gutil.log(gutil.colors.green('Running production build...'));
  else
    gutil.log(gutil.colors.yellow('Running development build...'));
}

function lint() {
  if (!isProduction())
    return null;

  return gulp.src(SOURCE_PATH + '/**/*.js')
      .pipe(jshint({
        esversion: 6,
        debug: true
      }))
      .pipe(jshint.reporter('jshint-stylish', {
        beep: true
      }));
}

function cleanBuild() {
  let erase = false;
  if (keepFiles === false) {
    erase = true;
  } else {
    keepFiles = false;
  }

  return gulp.src(BUILD_PATH + '**/*.*', {
    read: false,
  })
      .pipe(gulpif(erase, clean({
        force: true
      })));
}

function copyStatic() {
  var s0 = gulp.src(IMG_PATH)
      .pipe(gulp.dest(BUILD_PATH));

  // Backgrounds and icon
  var s1 = gulp.src(IMG_PATH + '/backgrounds/*.jpg')
      .pipe(gulpif(isProduction(),
          tinypng({
            key: TINY_PNG_API_KEY,
            log: true,
            summarise: true,
          })
      ))
      .pipe(gulp.dest(BUILD_PATH + '/img/backgrounds'));

  var s2 = gulp.src(ICON_PATH)
      .pipe(gulpif(isProduction(), tinypng({
        key: TINY_PNG_API_KEY,
        log: true,
        summarise: true,
      })))
      .pipe(gulp.dest(BUILD_PATH + '/img'));

  // Atlases
  var s3 = gulp.src(ATLAS_PATH + '/*.png')
      .pipe(gulpif(isProduction(), tinypng({
        key: TINY_PNG_API_KEY,
        log: true,
        summarise: true,
      })))
      .pipe(gulp.dest(BUILD_PATH + '/texture_sheets'));

  var s4 = gulp.src(ATLAS_PATH + '/*.json')
      .pipe(gulpCopy(BUILD_PATH + '/texture_sheets/', {
        prefix: 1
      }));

  // CSS
  let fonts = '';
  for (let font of CSS_FONTS) {
    fonts += `@font-face {font-family: '${font}'; src: url('${font}.ttf');  format('truetype')}`;
  }
  var s5 = gulp.src(GLOBAL_PATH + '/css/mraid_wrapper.css')
      .pipe(insert.append(fonts))
      .pipe(cssmin())
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(gulp.dest(BUILD_PATH + '/css'));

  let tmpl = {
    ad_title: creativeInfo.name,
    ad_name: info.name,
    ad_app_store_url: creativeInfo['appstore-url'],
    ad_font_extra: AD_EXTRA_FONTS,
    ad_icon_file: AD_ICON,
    ad_getapp_instead_of_title: AD_GETAPP_INSTEAD_OF_TITLE
  };

  var s7 = gulp.src(GLOBAL_PATH + '/tags/*.html')
      .pipe(template(tmpl))
      .pipe(gulp.dest(BUILD_PATH));
  // ttf
  var s8 = gulp.src(ATLAS_PATH + '/*.ttf')
      .pipe(gulp.dest(BUILD_PATH + '/css'));

  return merge(s0, s1, s2, s3, s4, s5, s7, s8);
}


function preBuild() {
  var sourcemapPath = SCRIPTS_PATH + '/' + OUTPUT_FILE + '.map';

  return bundler.bundle().on('error', function(error) {
    gutil.log(gutil.colors.red('[Build Error]', error.message));
    this.emit('end');
  })
      .pipe(gulpif(!isProduction(), exorcist(sourcemapPath)))
      .pipe(source(CREATIVE_TMP_NAME))
      .pipe(buffer())
      .pipe(gulpif(isProduction(), stripDebug()))
      .pipe(gulpif(isProduction(), uglify()))
      .pipe(gulp.dest(SCRIPTS_PATH));
}

function build() {
  var globalLibs = fixGlobalLibsPaths(GLOBAL_LIBS);
  var sourcemapPath = SCRIPTS_PATH + '/' + OUTPUT_FILE + '.map';
  var embedded = getFilesFromFolder('./embed');

  var libs = [PHASER_PATH];
  if (embedded.length !== 0) {
    libs = libs.concat(globalLibs, embedded);
  } else {
    libs = libs.concat(globalLibs);
  }
  libs.push(SCRIPTS_PATH + '/' + CREATIVE_TMP_NAME);
  libs.push(GLOBAL_PATH + '/js/' + 'mraid_wrapper.js');

  var stream = null;
  if (isProduction()) {
    stream = gulp.src(libs)
        .pipe(tap(function(file) {
          if (path.dirname(file.path).match('embed')) {
            file.contents = Buffer.concat([
              new Buffer('embedded[\'' + path.basename(file.path).replace('.json', '') + '\'] = '),
              file.contents,
              new Buffer(';')
            ]);
          }
        }))
        .pipe(concat('code.js'))
        .pipe(buffer())
        .pipe(uglify())
        .pipe(gulp.dest(BUILD_PATH + '/js/'));
  } else {
    stream = gulp.src(libs)
        .pipe(sourcemaps.init({
          loadMaps: true
        }))
        .pipe(tap(function(file) {
          if (path.dirname(file.path).match('embed')) {
            file.contents = Buffer.concat([
              new Buffer('embedded[\'' + path.basename(file.path).replace('.json', '') + '\'] = '),
              file.contents,
              new Buffer(';')
            ]);
          }
        }))
        .pipe(concat('code.js'))
        .pipe(sourcemaps.write('.', {
          addComment: true,
          sourceRoot: SCRIPTS_PATH + '/'
        }))
        .pipe(gulp.dest(BUILD_PATH + 'js/'));
  }

  return stream;
}

function removeTmp() {
  if (isProduction()) {
    return gulp.src(SCRIPTS_PATH + '/' + CREATIVE_TMP_NAME)
        .pipe(clean({ force: true }));
  }
}

function getFilesFromFolder(folder) {
  let filesPaths = [];
  try {
    let files = fs.readdirSync(folder);
    files.forEach((file) => {
      if (file.match('.json')) {
        filesPaths.push(folder + '/' + file);
      }
    });
  } catch (e) {}
  return filesPaths;
}

function fixGlobalLibsPaths(arr) {
  var newArr = [];
  for (var i = 0; i < arr.length; i++)
    newArr.push(GLOBAL_PATH + '/js/' + arr[i]);

  return newArr;
}

function serve() {
  var baseDir = SERVE_PATH;

  var options = {
    server: {
      baseDir: baseDir,
      directory: true,
      index: info.name + '/dev_portrait.html'
    },
    open: false
  };

  browserSync(options);

  gulp.watch(SOURCE_PATH + '/**/*.js', ['watch-js']).on('change', function() {
    console.log('changed');
  });

  gulp.watch(IMG_PATH + '/**/*', ['watch-static']).on('change', function() {
    keepFiles = true;
    console.log('changed');
  });
}

logBuildMode();

// Clean up
gulp.task('clean-build', cleanBuild);

// Copy everything to webroot
gulp.task('copy-static', ['clean-build'], copyStatic);

// QA creative code
gulp.task('lint', lint);

// Build task sequence
gulp.task('pre-build', ['copy-static'], preBuild);
gulp.task('build', ['lint', 'pre-build'], build);

// remove temp file
gulp.task('remove-temp', ['build'], removeTmp);

// Just watch fs for changes
gulp.task('serve', ['remove-temp'], serve);
gulp.task('watch-js', ['remove-temp'], browserSync.reload);
gulp.task('watch-static', ['copy-static'], browserSync.reload);

// Thats what you need in most cases
gulp.task('default', ['serve']);
