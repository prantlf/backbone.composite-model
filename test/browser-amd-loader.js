(function () {
  'use strict;';

  // Set up paths to the internal module dependencies
  require.config({
    paths: {
      backbone: '../node_modules/backbone/backbone',
      jquery: '../node_modules/jquery/dist/jquery',
      qunit: '../node_modules/qunitjs/qunit/qunit',
      underscore: '../node_modules/underscore/underscore'
    },
    shim: {
      // Ensure that the QUnit test engine and the Backbone.CompositeModel
      // implementation is loaded before the tests
      tests: {
        deps: ['qunit', '../backbone.composite-model']
      }
    }
  });

  // Load and execute the tests
  require(['qunit', 'tests'], function () {
    // Process the test results
    QUnit.start();
  });

}());
