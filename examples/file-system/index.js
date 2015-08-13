(function () {
  'use strict';

  // Configure the module dependencies

  require.config({
    // Set up paths to the page module dependencies
    paths: {
      backbone: '../../node_modules/backbone/backbone',
      jquery: '../../node_modules/jquery/dist/jquery',
      qunit: '../../node_modules/qunitjs/qunit/qunit',
      underscore: '../../node_modules/underscore/underscore'
    },
    // Leave no traces in the global namespace
    shim: {
      backbone: {
        init: function () {
          Backbone.noConflict();
        }
      },
      jquery: {
        init: function () {
          jQuery.noConflict(true);
        }
      },
      underscore: {
        init: function () {
          _.noConflict();
        }
      }
    }
  });

  // Require the needed modules and build the application page

  require(['underscore', 'jquery', 'backbone', '../../backbone.composite-model'
  ], function (_, $, Backbone, mixinCompositeModel) {

    // Simulate a file system with the following structure:
    //
    // Employee (folder)
    //   John     (file)
    //   Jane     (file)
    // Product  (folder)
    //   Trumpet  (file)
    //   Guitar   (file)
    //
    // If the folder ID is N, IDs of its children (files) are N * 10 + M,
    // where N and M are integers > 0 and < 10.  It allows computing the
    // parent folder ID from the file ID without creating the reference
    // between a folder and a file explicitly by storing their IDs.

    var fileSystem = {
      files: [
        {
          id: 11,
          name: 'John',
          versions: [
            {size: 3072}
          ]
        },
        {
          id: 12,
          name: 'Jane',
          versions: [
            {size: 1024},
            {size: 2048}
          ]
        },
        {
          id: 21,
          name: 'Trumpet',
          versions: [
            {size: 4096},
            {size: 5020},
            {size: 6044}
          ]
        },
        {
          id: 22,
          name: 'Guitar',
          versions: [
            {size: 7068}
          ]
        }
      ],

      folders: [
        {
          id: 1,
          name: 'Employee'
        },
        {
          id: 2,
          name: 'Product'
        }
      ]
    };

    // Declare function objects for models and collections to model
    // the file system
    //
    // See the diagram at 'docs/file-system.png' for more information

    var FolderModel = Backbone.Model.extend({
        defaults: {
          id: null,
          name: null
        }
      }),

      VersionModel = Backbone.Model.extend({
        defaults: {
          size: null
        }
      }),

      VersionCollection = Backbone.Collection.extend({
        model: VersionModel
      }),

      FileModel = Backbone.Model.extend({
        defaults: {
          id: null,
          name: null
        },

        // Declare what attributes map to what child models or collections
        composite: {
          parent: FolderModel,
          versions: {
            type: VersionCollection,
            // Always replace the entire version collection and trigger
            // just one event about it for better performance
            method: 'reset'
          }
        },

        // Use any non-empty string otherwise the `fetch` method fails
        urlRoot: '/files',

        initialize: function (attributes, options) {
          // Initialize the child models and collections
          this.makeComposite(options);
        },

        // Obtains attributes of the file with the specified ID from
        // the simulated file system declared above
        sync: function (method, model, options) {
          var fileId = model.get('id'),
            file = _.findWhere(fileSystem.files, {id: fileId}),
          // Parent folder has its ID equal to the highest decimal
          // digit of the file ID
            folderId = parseInt(fileId / 10),
            folder = _.findWhere(fileSystem.folders, {id: folderId});
          model.trigger('request', model, {}, options);
          file = _.defaults({parent: folder}, file);
          options.success(file, 'success', {status: 200});
          return $.Deferred().resolve(file).promise();
        }
      });

    // Extend the prototype with methods managing the child models and
    // collections
    mixinCompositeModel(FileModel.prototype);

    // Declare function objects for views to show parts of the selected
    // file information

    var FileView = Backbone.View.extend({
        initialize: function () {
          // Update the view whenever information about the newly selected
          // file has been received
          this.listenTo(this.model, 'sync', this.render);
        },

        render: function () {
          this.$el.text(this.model.get('name'));
          flash.call(this);
        }
      }),

      ParentView = Backbone.View.extend({
        initialize: function () {
          // Update the view whenever the parent of the selected file changes
          this.listenTo(this.model, 'change:id', this.render);
        },

        render: function () {
          this.$el.text(this.model.get('name'));
          flash.call(this);
        }
      }),

      VersionsView = Backbone.View.extend({
        initialize: function () {
          // Update the view whenever a new version collection has been
          // received for the selected file
          this.listenTo(this.collection, 'reset', this.render);
        },

        render: function () {
          // Render a comma-delimited list of file version sizes
          this.$el.text(this.collection.pluck('size').join(', '));
          flash.call(this);
        }
      });

    // Makes the user aware that a view has been rendered by flashing
    // its background colour three times
    function flash($el) {
      var $el = this.$el,
        // Three times flash; a single flash are two operations - change
        // and revert the background colour
        counter = 3 * 2,
        interval;

      // Toggles the flashing CSS class and stops the flashing interval
      // after enough flashes has been done
      function toggleClass() {
        $el.toggleClass('flashed');
        if (!--counter) {
          clearInterval(interval);
        }
      }

      // Do not flash the view if it is not visible
      if ($el.is(':visible')) {
        // Flash the view by constant toggling the flashing CSS class
        interval = setInterval(toggleClass, 100);
      }
    }

    // Create a model instance for the selected file, initialize it with the
    // first file in the file system and fetch it

    var firstFile = fileSystem.files[0],
      selectedFile = new FileModel({id: firstFile.id}),
      fetched = selectedFile.fetch();

    // Wait with the visual objects until the HTML DOM is accessible
    $(function () {

      // Render the file-system content on th left side of the page and make
      // file files clickable hyperlinks

      $('#file-system').append(
        // Create elements for all folders
        _.map(fileSystem.folders, function (folder) {
          return $('<div>')
            .addClass('folder')
            .text(folder.name + ' Files')
            .append(
            // Create elements for all files in the current folder
            _.chain(fileSystem.files)
              .filter(function (file) {
                // Parent folder has its ID equal to the highest decimal
                // digit of the file ID
                return folder.id === parseInt(file.id / 10);
              })
              .map(function (file) {
                return $('<a>', {href: 'javascript:;'})
                  .addClass('file')
                  // This first file in the file system is selected initially
                  .addClass(file.id === firstFile.id ? 'selected' : '')
                  .text(file.name)
                  .click(function () {
                    // Remove the previous selection and select the new file
                    $('a').removeClass('selected');
                    $(this).toggleClass('selected');
                    // Set ID of the selected file and fetch its information
                    // to update the views if their part of the selected file
                    // information changes
                    selectedFile
                      .set('id', file.id)
                      .fetch({});
                  });
              })
              .value()
          );
        })
      );

      // Create view instances to show parts of the selected file information

      var fileView = new FileView({
          el: '#file',
          model: selectedFile
        }),

        parentView = new ParentView({
          el: '#parent',
          model: selectedFile.parent
        }),

        versionsView = new VersionsView({
          el: '#versions',
          collection: selectedFile.versions
        });

      // When the initially selected file has been fetched render all views
      // showing parts of the selected file information and stop hiding the
      // page body content

      fetched.done(function () {
        fileView.render();
        parentView.render();
        versionsView.render();
        // Show the body first now to prevent flickering when various parts
        // of the page are rendered and styled initially
        $(document.body).css({display: 'block'});
      });

    });

  });

}());
