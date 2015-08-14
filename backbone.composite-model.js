// Backbone.CompositeModel 0.1.1
// https://github.com/prantlf/backbone.composite-model
//
// Copyright (c) 2015 Ferdinand Prantl
// Licensed under the MIT license.
//
// Supports composite Backbone.Model objects which consist of a main model
// and child models or collections maintained automatically according to a
// composite configuration

// Example
// -------

// Let's have a versioned file-system model: folders which contain
// sub-folders and files, files consisting of file versions.  The REST
// API resource `/files/:id` returns the following (simplified) response
// about a file:
//
//     {
//       id: ...,                // globally unique ID
//       name: '...',            // file display name
//       parent_expanded: {...}, // parent folder object
//       versions: [...]         // version object array
//     }
//
// Let's declare the following (simplified) models and collections for them:
//
//     var FolderModel = Backbone.Model.extend({...});
//
//     var VersionCollection = Backbone.Collection.extend({...});
//
//     var FileModel = Backbone.Model.extend({...})
//
//       // Declare what attributes from the response back
//       // up what child models and collection stored in
//       // properties on the object instance
//       composite: {
//         parent_expanded: {
//           model: FolderModel,
//           property: 'parent'
//         },
//         versions: VersionCollection,
//       },
//
//       // Override the constructor to see the name `FileModel`
//       // in the debugger and to be able to initialize the
//       // composite model
//       constructor: function FileModel(attributes, options) {
//         FileModel.__super__.constructor.apply(this, arguments);
//         this,makeComposite(options);
//       },
//
//       // Point to the resource representing the file
//       // on the server
//       urlRoot: '/files'
//
//     });
//
//     // Extend the function object prototype to become
//     // a composite of child models and collections
//     Backbone.mixinCompositeModel(FileModel.prototype);
//
// This lets the `parent` and `versions` properties maintained automatically
// without an additional code.
//
//     var file = new FileModel({id: ...});
//     file
//       .fetch()
//       .done(function () {
//         console.log('Name:', file.get('name'));
//         // This does not work.
//         console.log('Parent folder:', file.parent.get('name'));
//         console.log('Version count:', file.versions.length);
//       });
//
// The `parent` object and the `versions` array are be accessible as
// `Backbone.Model` and `Backbone.Collection` to be able to pass them to
// other models and views and listen to their events in the application
// using a common Backbone interface.

// Module Factory
// --------------

// UMD wrapper to support multiple module dependency loaders
(function (root, factory) {
  'use strict';

  // Handle AMD modules (RequireJS)
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'backbone'], factory);
    // Handle CommonJS modules (NodeJS)
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('underscore'), require('backbone'));
    // Handle global variables setting modules (web browser alone)
  } else {
    root.returnExports = factory(root._, root.Backbone);
  }
}(this, function (_, Backbone) {
  'use strict';

  // Mixin Function
  // --------------

  //
  // Applied on a `Backbone.Model` prototype, extends it to support model
  // composites made of child models and collections, which can be
  // configured by the `composite` property from the object prototype,
  // instance or constructor `options`.
  //
  // Members of the `composite` object (map):
  //
  //     // Maintains a property on the model instance with
  //     // the attribute name pointing to an object instance
  //     // of the specified type
  //     <attribute name>: <Backbone model or collection>,
  //
  //     // Maintains a property on the model instance backed
  //     // up by the specified attribute overriding the
  //     // default handling
  //     <attribute name>: {
  //       // Model or collection to create for the attribute
  //       // value (required)
  //       type: <Backbone model or collection>,
  //       // Property name to store the sub-object on the
  //       // model with (optional; the attribute name is
  //       //  the default)
  //       property: <property name>,
  //       // Additional options to pass to the constructor of
  //       // the sub-object (optional; undefined by default)
  //       options: <object literal>,
  //       // Method to call on the child model or collection
  //       // if updated data are being set (optional; `set` is
  //       // the default for models, `add` for collections)
  //       method: <method name>,
  //       // Function to call before the value is passed to
  //       // child model or collection constructor or `set` /
  //       // `add` method to "massage" the input data
  //       // (optional; `undefined` is the default)
  //       parse: <function (value, options)>,
  //     }
  //
  Backbone.mixinCompositeModel = function (prototype) {
    var originalSet = prototype.set;

    return _.extend(prototype, {

      // Initialization Function
      // -----------------------

      // Initializes the composite model support; to be called from the
      // `initialize` method or from the overridden constructor, after
      // the parent constructor has been called
      makeComposite: function (options) {
        // Mark the object creation scenario for the _updateComposite below
        options = _.extend({create: true}, options);
        this._compositeMap = this._createCompositeMap(options);
        // Update properties explicitly, because the `set` method with
        // the initial attributes of the model is called in the parent
        // constructor already, before the `_compositeMap` has been
        // called here, thus the composite extension could not apply yet
        this._updateComposite(this.attributes, options);
        return this;
      },

      // Overridden Functions
      // -------------------

      // Overrides the `Backbone.Model:set()` method to ensure that the
      // nested attribute values will be propagated to the child models
      // and collections of this composite
      set: function (key, value, options) {
        var attributes;
        // Do nothing if nought has been asked for
        if (key == null) {
          return this;
        }
        // Normalize the input parameters to become two object literals:
        // handle both `'key', value` and `{key: value}` -style arguments
        if (typeof key === 'object') {
          attributes = key;
          options = value;
        } else {
          (attributes = {})[key] = value;
        }
        options || (options = {});
        // Set the common attributes and check the result first
        var result = originalSet.call(this, attributes, options);
        // Update the child models and collections if the input data were
        // valid and the composite descriptor has been initialized (after
        // the constructor has finished)
        if (result && key != null && this._compositeMap) {
          this._updateComposite(attributes, options);
        }
        // Return the same result as the original `set` method
        return result;
      },

      // Private Functions
      // -----------------

      // Merges prototype.composite and options.composite and normalizes
      // the child model or collection configuration
      _createCompositeMap: function (options) {
        // Allow specifying the composite property as a function returning
        // the actual configuration object
        var thisComposite = this.composite,
            optionsComposite = options.composite;
        if (typeof thisComposite === 'function') {
          thisComposite = thisComposite.call(this, options);
        }
        if (typeof optionsComposite === 'function') {
          optionsComposite = optionsComposite.call(this, options);
        }
        if (thisComposite && typeof thisComposite !== 'object' ||
            optionsComposite && typeof optionsComposite !== 'object') {
          throw new Error('Invalid composite configuration');
        }
        // Allow the caller to specify additional or override existing
        // attribute rules defined in the prototype or in the instance
        var composite = _.extend({}, thisComposite, optionsComposite);
        return _.reduce(composite, function (result, model, attribute) {
          var property, parse, method;
          // Just model or collection function object can be used for
          // convenience
          if (model.prototype instanceof Backbone.Model ||
              model.prototype instanceof Backbone.Collection) {
            property = attribute;
            // Otherwise the child model or collection object descriptor
            // should be an object literal with configuration properties
          } else {
            if (typeof model !== 'object') {
              throw new Error('Invalid composite child descriptor');
            }
            // Attribute name is the default for the property name
            property = model.property || attribute;
            // Make sure that the extra data parsing function is not set
            // or is a valid function
            parse = model.parse;
            if (parse != null && typeof parse !== 'function') {
              throw new Error('Invalid child model data parse function');
            }
            method = model.method;
            // Make sure that the child model or collection type is valid
            model = model.type;
            if (!(model.prototype instanceof Backbone.Model ||
                  model.prototype instanceof Backbone.Collection)) {
              throw new Error('Invalid composite child model');
            }
          }
          // Avoid replacing an existing prototype member with the child
          // model or collection instance
          if (prototype[property]) {
            throw new Error('Property conflict in the composite prototype');
          }
          // Use the default data updating method if not specified
          if (!method) {
            method = model.prototype instanceof Backbone.Model ? 'set' : 'add';
          }
          // Make sure that the data updating method exists in the child
          // model or collection prototype
          if (!model.prototype[method]) {
            throw new Error('Invalid chidl model data updating method');
          }
          // Make every map entry look consistent
          result[attribute] = {
            model: model,
            property: property,
            parse: parse,
            method: method
          };
          return result;
        }, {});
      },

      // Checks if the changed attributes contained a key, which backs up
      // a child model or collection and updates the child object
      // accordingly
      _updateComposite: function (attributes, options) {
        // Creates a new instance of the child model or collection
        function create(composite, parameters) {
          var createOptions = _.extend({}, composite.options, options);
          this[composite.property] = new composite.model(parameters,
            createOptions);
        }

        // Ensures that the property with the child model or collection
        // exists and clears it if
        function createOrClear(composite) {
          var child = this[composite.property];
          if (child) {
            // Clearing an attribute on the main model should clear the
            // child model or collection; requesting the `parse` option
            // gives a hint about re-fetching the entire model, which
            // should do the same, but not when saving; the server may
            // respond with incomplete model attributes
            //
            // TODO: How to handle `fetch` with suppressed `parse`?
            // TODO: How to handle `save` with suppressed validation?
            if (options.unset || options.parse && !options.validate) {
              if (child instanceof Backbone.Model) {
                child.clear(options);
              } else {
                child.reset(undefined, options);
              }
            }
          } else if (options.create) {
            // If called from the constructor or with an undefined or with
            // an explicit null, force  creation of empty child models and
            // collections, at least
            create.call(this, composite);
          }
        }

        // Propagates the attribute change to the child model ort collection
        function populate(composite, value) {
          // Pre-process the attributes or models before they are
          // propagated to the child object
          if (composite.parse) {
            value = composite.parse.call(this, value, options);
          }
          // If called from the constructor, the property will not exist
          var child = this[composite.property];
          if (child) {
            // When the main model is re-fetched, the child models or
            // collections should be reset; requesting the `parse` option
            // gives a hint about it and the `validate` option discloses
            // the saving; the server may respond with an incomplete data
            //
            // TODO: How to handle `fetch` with suppressed `parse`?
            // TODO: How to handle `save` with suppressed validation?
            if (options.parse && !options.validate) {
              if (child instanceof Backbone.Model) {
                var missing = _.omit(child.attributes, _.keys(value));
                child.set(missing, {
                  unset: true,
                  silent: true
                });
              } else {
                child.reset(undefined, {silent: true});
              }
            }
            child[composite.method](value, options);
          } else {
            create.call(this, composite, value);
          }
        }

        // Process only attributes listed in the composite map
        _.each(this._compositeMap, function (composite, key) {
          // Leave the child model or collection intact if the attributes
          // do not contain its key
          if (_.has(attributes, key)) {
            var value = attributes[key];
            if (value != null) {
              populate.call(this, composite, value);
            } else {
              createOrClear.call(this, composite);
            }
          } else {
            // If called from the constructor without attributes, force
            // creation of empty child models and collections, at least
            createOrClear.call(this, composite);
          }
        }, this);
      }

    });

  };

  // Export the function to apply the mixin to a prototype either as a result
  // of this module callback or as a property on the `Backbone` object
  return Backbone.mixinCompositeModel;

}));
