// some browser launchers should be installed before using karma start
// for example:
//   npm install karma-firefox-launcher
//   karma start --browsers=Firefox
module.exports = function (config) {

  config.set({

    // karma web server should  serve static fioles from the project root
    basePath: '',

    // recognize qunit tests among the loaded files
    frameworks: ['qunit'],

    // list of files / patterns to load in the browser
    files: [
      'node_modules/qunit/qunit/qunit.css',
      'node_modules/jquery/dist/jquery.js',
      'node_modules/underscore/underscore.js',
      'node_modules/backbone/backbone.js',
      'backbone.composite-model.js',
      'test/tests.js'
    ],

    // test results reporter to use; possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    // let non-testing sources be pre-processed for the code coverage check
    preprocessors: {
      // source files, that you wanna generate coverage for
      // do not include tests or libraries
      // (these files will be instrumented by Istanbul)
      'backbone.composite-model.js': ['coverage']
    },

    // configure the reporters
    coverageReporter: {
      type: 'lcovonly',
      // Coverage reporter output is relative to the parent directory
      dir: 'test/coverage',
      subdir: '.'
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR ||
    // config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching files and executing tests whenever
    // any file changes
    autoWatch: false,

    // start these browsers; for available browser launchers see:
    // https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],

    // continuous integration mode: if true, karma captures browsers,
    // runs the tests and exits
    singleRun: true

  });

};
