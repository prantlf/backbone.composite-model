(function () {
  'use strict;';

  var CompositeModel, TestModel, TestCollection;

  QUnit.module('Backbone.CompositeModel', {

    setup: function () {
      CompositeModel = Backbone.Model.extend({
        constructor: function CompositeModel(attributes, options) {
          CompositeModel.__super__.constructor.apply(this, arguments);
          this.makeComposite(options);
        }
      });
      Backbone.mixinCompositeModel(CompositeModel.prototype);
      TestModel = Backbone.Model.extend();
      TestCollection = Backbone.Collection.extend();
    }

  });

  test('extends the prototype', function () {
    ok(CompositeModel.prototype.makeComposite,
      'makeComposite method is present');
  });

  test('works without configuration', function () {
    var model = new CompositeModel(),
      changed;
    model.on('change', function () {
      changed = true;
    });
    ok(model.set({id: 1}), 'set() returns a truthy value');
    equal(model.get('id'), 1, 'set() sets the value as expected');
    ok(changed, 'set() triggers the expected event');
  });

  test('takes configuration from the prototype', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        }
      }),
      model = new TestCompositeModel();
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
  });

  test('takes configuration from the prototype as function', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: function () {
          context = this;
          return {
            submodel: TestModel
          };
        }
      }),
      model = new TestCompositeModel(),
      context;
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
    strictEqual(context, model,
      'context of the composite function was the model');
  });

  test('takes configuration from the options', function () {
    var model = new CompositeModel(undefined, {
      composite: {
        submodel: TestModel
      }
    });
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
  });

  test('takes configuration from the options as function', function () {
    var model = new CompositeModel(undefined, {
        composite: function () {
          context = this;
          return {
            submodel: TestModel
          };
        }
      }),
      context;
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
    strictEqual(context, model,
      'context of the composite function was the model');
  });

  test('merges configuration from prototype and options', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        }
      }),
      model = new TestCompositeModel(undefined, {
        composite: {
          subcollection: TestCollection
        }
      });
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
    ok(model.subcollection instanceof TestCollection,
      'subcollection property is available');
  });

  test('overrides configuration from prototype with options', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: Backbone.Model
        }
      }),
      model = new TestCompositeModel(undefined, {
        composite: {
          submodel: TestModel
        }
      });
    ok(model.submodel instanceof TestModel,
      'submodel property of the right type is available');
  });

  test('fails with invalid configuration from the prototype', function () {
    throws(function () {
      var TestCompositeModel = CompositeModel.extend({
          composite: 1
        }),
        model = new TestCompositeModel();
    }, 'constructor throws');
  });

  test('fails with invalid configuration from the options', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: 1
      });
    }, 'constructor throws');
  });

  test('accepts child model configuration directly', function () {
    var model = new CompositeModel(undefined, {
      composite: {
        submodel: TestModel,
        subcollection: TestCollection
      }
    });
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
    ok(model.subcollection instanceof TestCollection,
      'subcollection property is available');
  });

  test('accepts child model configuration in object literal', function () {
    var model = new CompositeModel(undefined, {
      composite: {
        submodel: {
          type: TestModel
        },
        subcollection: {
          type: TestCollection
        }
      }
    });
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
    ok(model.subcollection instanceof TestCollection,
      'subcollection property is available');
  });

  test('fails with invalid child model specified directly', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: 1
        }
      });
    }, 'constructor throws');
  });

  test('fails with missing child model in object literal', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: {}
        }
      });
    }, 'constructor throws');
  });

  test('fails with invalid child model in object literal', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: {
            type: 1
          }
        }
      });
    }, 'constructor throws');
  });

  test('fails with an invalid parse function', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: {
            type: TestModel,
            parse: 1
          }
        }
      });
    }, 'constructor throws');
  });

  test('fails with unknown data update method', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: {
            type: TestModel,
            method: 'dummy'
          }
        }
      });
    }, 'constructor throws');
  });

  test('fails with an attribute named like an existing method', function () {
    throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          fetch: TestModel
        }
      });
    }, 'constructor throws');
  });

  test('allows renaming the child object property', function () {
    var model = new CompositeModel(undefined, {
      composite: {
        fetch: {
          type: TestModel,
          property: 'submodel'
        }
      }
    });
    ok(model.submodel instanceof TestModel,
      'submodel property is available');
  });

  test('propagates model attributes from the constructor', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        }
      }),
      model = new TestCompositeModel({
        submodel: {
          id: 1
        }
      });
    equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
  });

  test('propagates model attributes from the defaults', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        },
        defaults: {
          submodel: {
            id: 1
          }
        }
      }),
      model = new TestCompositeModel();
    equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
  });

  test('ignores the set method called with nothing', function () {
    var model = new CompositeModel(undefined, {
        composite: {
          submodel: TestModel
        }
      }),
      changed, childChanged;
    model.on('change', function () {
      changed = true;
    });
    model.submodel.on('change', function () {
      childChanged = true;
    });
    ok(model.set(null), 'main model behavior does not change');
    notOk(changed, 'main model triggers no event');
    notOk(childChanged, 'submodel triggers no event');
  });

  test('propagates model attributes from the set method', function () {
    var model = new CompositeModel(undefined, {
        composite: {
          submodel: TestModel
        }
      }),
      changed;
    model.submodel.on('change', function () {
      changed = true;
    });
    model.set({
      submodel: {
        id: 1
      }
    });
    equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
    ok(changed, 'submodel triggers the changed event');
  });

  test('attributes can be passed in as a key-value pair', function () {
    var model = new CompositeModel(undefined, {
        composite: {
          submodel: TestModel
        }
      }),
      changed;
    model.submodel.on('change', function () {
      changed = true;
    });
    model.set('submodel', {id: 1});
    equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
    ok(changed, 'submodel triggers the changed event');
  });

  test('clears child model attributes by the clear method', function () {
    var model = new CompositeModel({
        submodel: {
          id: 1
        }
      }, {
        composite: {
          submodel: TestModel
        }
      }),
      changed;
    model.submodel.on('change', function () {
      changed = true;
    });
    model.clear();
    notOk(model.submodel.has('id'), 'submodel has been cleared');
    ok(changed, 'submodel has triggered an event on clearing');
  });

  test('propagates model attributes from the fetch method', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        },
        sync: function (method, model, options) {
          options.success({
            submodel: {
              name: 2
            }
          });
        },
        url: '/test'
      }),
      model = new TestCompositeModel({
        submodel: {
          id: 1
        }
      });
    model.fetch({
      success: function () {
        notOk(model.submodel.has('id'),
          'submodel has the expected property cleared');
        equal(model.submodel.get('name'), 2,
          'submodel has the expected property set');
      }
    });
  });

  test('propagates model attributes from the save method', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        },
        sync: function (method, model, options) {
          options.success({
            submodel: {
              name: 2
            }
          });
        },
        url: '/test'
      }),
      model = new TestCompositeModel({
        submodel: {
          id: 1
        }
      });
    model.save({}, {
      success: function () {
        equal(model.submodel.get('id'), 1,
          'submodel has the expected property left intact');
        equal(model.submodel.get('name'), 2,
          'submodel has the expected property added');
      }
    });
  });

  test('propagates collection models from the constructor', function () {
    var model = new CompositeModel({
      subcollection: [
        {id: 1}
      ]
    }, {
      composite: {
        subcollection: TestCollection
      }
    });
    equal(model.subcollection.length, 1,
      'subcollection has the expected length');
    equal(model.subcollection.first().get('id'), 1,
      'first model in subcollection has the expected property');
  });

  test('propagates collection models from the set method', function () {
    var model = new CompositeModel(undefined, {
        composite: {
          subcollection: TestCollection
        }
      }),
      changed;
    model.subcollection.on('add', function () {
      changed = true;
    });
    model.set({
      subcollection: [
        {id: 1}
      ]
    });
    equal(model.subcollection.length, 1,
      'subcollection has the expected length');
    equal(model.subcollection.first().get('id'), 1,
      'first model in subcollection has the expected property');
    ok(changed, 'subcollection triggers the add event');
  });

  test('removes child collection models by the clear method', function () {
    var model = new CompositeModel({
        subcollection: [
          {id: 1}
        ]
      }, {
        composite: {
          subcollection: TestCollection
        }
      }),
      changed;
    model.subcollection.on('reset', function () {
      changed = true;
    });
    model.clear();
    notOk(model.subcollection.length, 'subcollection has been reset');
    ok(changed, 'subcollection has triggered an event on resetting');
  });

  test('propagates collection models from the fetch method', function () {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          subcollection: TestCollection
        },
        sync: function (method, model, options) {
          options.success({
            subcollection: [
              {name: 2}
            ]
          });
        },
        url: '/test'
      }),
      model = new TestCompositeModel([
        {id: 1}
      ]);
    model.fetch({
      success: function () {
        equal(model.subcollection.length, 1,
          'subcollection has the expected length');
        equal(model.subcollection.first().get('name'), 2,
          'first model in subcollection has the expected property');
      }
    });
  });

  test('allows overriding the data update method', function () {
    var model = new CompositeModel([
        {id: 1}
      ], {
        composite: {
          subcollection: {
            type: TestCollection,
            method: 'reset'
          }
        }
      }),
      changed;
    model.subcollection.on('reset', function () {
      changed = true;
    });
    model.set({
      subcollection: [
        {name: 2}
      ]
    });
    equal(model.subcollection.length, 1,
      'subcollection has the expected length');
    notOk(model.subcollection.first().has('id'),
      'first model in subcollection lacks the original property');
    equal(model.subcollection.first().get('name'), 2,
      'first model in subcollection has the new property');
    ok(changed, 'subcollection has triggered a reset event');
  });

  test('passes the main model as context to the parse function', function () {
    var model = new CompositeModel(undefined, {
        composite: {
          submodel: {
            type: TestModel,
            parse: function (attributes, options) {
              called = true;
              strictEqual(this, model, 'context is the model');
              return attributes;
            }
          }
        }
      }),
      called;
    model.set({
      submodel: {
        id: 1
      }
    });
    ok(called, 'the parse method has been called');
  });

  test('allows pre-processing the model attributes', function () {
    var model = new CompositeModel({
      submodel: {
        id: 1
      }
    }, {
      composite: {
        submodel: {
          type: TestModel,
          parse: function (attributes, options) {
            attributes.id = 2;
            return attributes;
          }
        }
      }
    });
    equal(model.submodel.get('id'), 2,
      'submodel has the expected property');
  });

  test('allows pre-processing the collection models', function () {
    var model = new CompositeModel({
      subcollection: [
        {id: 1}
      ]
    }, {
      composite: {
        subcollection: {
          type: TestCollection,
          parse: function (models, options) {
            models[0].id = 2;
            models.push({id: 3});
            return models;
          }
        }
      }
    });
    equal(model.subcollection.length, 2,
      'subcollection has the expected length');
    equal(model.subcollection.first().get('id'), 2,
      'first model in subcollection has the expected property');
    equal(model.subcollection.last().get('id'), 3,
      'last model in subcollection has the expected property');
  });

}());
