(function () {
  'use strict;';

  require.config({
    paths: {
      backbone: '/base/node_modules/backbone/backbone',
      jquery: '/base/node_modules/jquery/dist/jquery',
      qunit: '/base/test/qunit-define',
      underscore: '/base/node_modules/underscore/underscore',
      tests: '/base/test/tests'
    },

    shim: {
      // Ensure that the QUnit test engine and the Backbone.CompositeModel
      // implementation is loaded before the tests
      tests: {
        deps: ['qunit', 'backbone.composite-model']
      }
    },

    // karma serves files under /base, which is the basePath from your
    // config file
    baseUrl: '/base',

    // dynamically load all test files
    deps: ['tests'],

    // we have to kickoff QUnit, as it is asynchronous
    callback: window.__karma__.start
  });

}());
