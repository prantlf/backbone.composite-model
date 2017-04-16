(function () {
  'use strict;';

  var CompositeModel, TestModel, TestCollection;

  QUnit.module('Backbone.CompositeModel', {

    beforeEach: function () {
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

  QUnit.test('extends the prototype', function (assert) {
    assert.ok(CompositeModel.prototype.makeComposite,
      'makeComposite method is present');
  });

  QUnit.test('works without configuration', function (assert) {
    var model = new CompositeModel(),
      changed;
    model.on('change', function () {
      changed = true;
    });
    assert.ok(model.set({id: 1}), 'set() returns a truthy value');
    assert.equal(model.get('id'), 1, 'set() sets the value as expected');
    assert.ok(changed, 'set() triggers the expected event');
  });

  QUnit.test('takes configuration from the prototype', function (assert) {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        }
      }),
      model = new TestCompositeModel();
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
  });

  QUnit.test('takes configuration from the prototype as function', function (assert) {
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
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
    assert.strictEqual(context, model,
      'context of the composite function was the model');
  });

  QUnit.test('takes configuration from the options', function (assert) {
    var model = new CompositeModel(undefined, {
      composite: {
        submodel: TestModel
      }
    });
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
  });

  QUnit.test('takes configuration from the options as function', function (assert) {
    var model = new CompositeModel(undefined, {
        composite: function () {
          context = this;
          return {
            submodel: TestModel
          };
        }
      }),
      context;
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
    assert.strictEqual(context, model,
      'context of the composite function was the model');
  });

  QUnit.test('merges configuration from prototype and options', function (assert) {
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
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
    assert.ok(model.subcollection instanceof TestCollection,
      'subcollection property is available');
  });

  QUnit.test('overrides configuration from prototype with options', function (assert) {
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
    assert.ok(model.submodel instanceof TestModel,
      'submodel property of the right type is available');
  });

  QUnit.test('fails with invalid configuration from the prototype', function (assert) {
    assert.throws(function () {
      var TestCompositeModel = CompositeModel.extend({
          composite: 1
        }),
        model = new TestCompositeModel();
    }, 'constructor throws');
  });

  QUnit.test('fails with invalid configuration from the options', function (assert) {
    assert.throws(function () {
      var model = new CompositeModel(undefined, {
        composite: 1
      });
    }, 'constructor throws');
  });

  QUnit.test('accepts child model configuration directly', function (assert) {
    var model = new CompositeModel(undefined, {
      composite: {
        submodel: TestModel,
        subcollection: TestCollection
      }
    });
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
    assert.ok(model.subcollection instanceof TestCollection,
      'subcollection property is available');
  });

  QUnit.test('accepts child model configuration in object literal', function (assert) {
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
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
    assert.ok(model.subcollection instanceof TestCollection,
      'subcollection property is available');
  });

  QUnit.test('fails with invalid child model specified directly', function (assert) {
    assert.throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: 1
        }
      });
    }, 'constructor throws');
  });

  QUnit.test('fails with missing child model in object literal', function (assert) {
    assert.throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: {}
        }
      });
    }, 'constructor throws');
  });

  QUnit.test('fails with invalid child model in object literal', function (assert) {
    assert.throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          submodel: {
            type: 1
          }
        }
      });
    }, 'constructor throws');
  });

  QUnit.test('fails with an invalid parse function', function (assert) {
    assert.throws(function () {
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

  QUnit.test('fails with unknown data update method', function (assert) {
    assert.throws(function () {
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

  QUnit.test('fails with an attribute named like an existing method', function (assert) {
    assert.throws(function () {
      var model = new CompositeModel(undefined, {
        composite: {
          fetch: TestModel
        }
      });
    }, 'constructor throws');
  });

  QUnit.test('allows renaming the child object property', function (assert) {
    var model = new CompositeModel(undefined, {
      composite: {
        fetch: {
          type: TestModel,
          property: 'submodel'
        }
      }
    });
    assert.ok(model.submodel instanceof TestModel,
      'submodel property is available');
  });

  QUnit.test('propagates model attributes from the constructor', function (assert) {
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
    assert.equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
  });

  QUnit.test('propagates model attributes from the defaults', function (assert) {
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
    assert.equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
  });

  QUnit.test('ignores the set method called with nothing', function (assert) {
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
    assert.ok(model.set(null), 'main model behavior does not change');
    assert.notOk(changed, 'main model triggers no event');
    assert.notOk(childChanged, 'submodel triggers no event');
  });

  QUnit.test('propagates model attributes from the set method', function (assert) {
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
    assert.equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
    assert.ok(changed, 'submodel triggers the changed event');
  });

  QUnit.test('attributes can be passed in as a key-value pair', function (assert) {
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
    assert.equal(model.submodel.get('id'), 1,
      'submodel has the expected property');
    assert.ok(changed, 'submodel triggers the changed event');
  });

  QUnit.test('clears child model attributes by the clear method', function (assert) {
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
    assert.notOk(model.submodel.has('id'), 'submodel has been cleared');
    assert.ok(changed, 'submodel has triggered an event on clearing');
  });

  QUnit.test('propagates model attributes from the fetch method', function (assert) {
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
        assert.notOk(model.submodel.has('id'),
          'submodel has the expected property cleared');
        assert.equal(model.submodel.get('name'), 2,
          'submodel has the expected property set');
      }
    });
  });

  QUnit.test('propagates model attributes from the save method', function (assert) {
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
        assert.equal(model.submodel.get('id'), 1,
          'submodel has the expected property left intact');
        assert.equal(model.submodel.get('name'), 2,
          'submodel has the expected property added');
      }
    });
  });

  QUnit.test('propagates collection models from the constructor', function (assert) {
    var model = new CompositeModel({
      subcollection: [
        {id: 1}
      ]
    }, {
      composite: {
        subcollection: TestCollection
      }
    });
    assert.equal(model.subcollection.length, 1,
      'subcollection has the expected length');
    assert.equal(model.subcollection.first().get('id'), 1,
      'first model in subcollection has the expected property');
  });

  QUnit.test('propagates collection models from the set method', function (assert) {
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
    assert.equal(model.subcollection.length, 1,
      'subcollection has the expected length');
    assert.equal(model.subcollection.first().get('id'), 1,
      'first model in subcollection has the expected property');
    assert.ok(changed, 'subcollection triggers the add event');
  });

  QUnit.test('removes child collection models by the clear method', function (assert) {
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
    assert.notOk(model.subcollection.length, 'subcollection has been reset');
    assert.ok(changed, 'subcollection has triggered an event on resetting');
  });

  QUnit.test('propagates collection models from the fetch method', function (assert) {
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
        assert.equal(model.subcollection.length, 1,
          'subcollection has the expected length');
        assert.equal(model.subcollection.first().get('name'), 2,
          'first model in subcollection has the expected property');
      }
    });
  });

  QUnit.test('allows overriding the data update method', function (assert) {
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
    assert.equal(model.subcollection.length, 1,
      'subcollection has the expected length');
    assert.notOk(model.subcollection.first().has('id'),
      'first model in subcollection lacks the original property');
    assert.equal(model.subcollection.first().get('name'), 2,
      'first model in subcollection has the new property');
    assert.ok(changed, 'subcollection has triggered a reset event');
  });

  QUnit.test('passes the main model as context to the parse function', function (assert) {
    var model = new CompositeModel(undefined, {
        composite: {
          submodel: {
            type: TestModel,
            parse: function (attributes, options) {
              called = true;
              assert.strictEqual(this, model, 'context is the model');
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
    assert.ok(called, 'the parse method has been called');
  });

  QUnit.test('allows pre-processing the model attributes', function (assert) {
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
    assert.equal(model.submodel.get('id'), 2,
      'submodel has the expected property');
  });

  QUnit.test('allows pre-processing the collection models', function (assert) {
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
    assert.equal(model.subcollection.length, 2,
      'subcollection has the expected length');
    assert.equal(model.subcollection.first().get('id'), 2,
      'first model in subcollection has the expected property');
    assert.equal(model.subcollection.last().get('id'), 3,
      'last model in subcollection has the expected property');
  });

  QUnit.test('serializes changes done to the nested model', function (assert) {
    var TestCompositeModel = CompositeModel.extend({
        composite: {
          submodel: TestModel
        }
      }),
      model = new TestCompositeModel(),
      output;
    model.submodel.set('id', 1);
    output = model.toJSON();
    assert.ok(!!output.submodel, true,
      'submodel has been serialized');
    assert.ok(output.submodel.id, 1,
      'submodel changes have been serialized');
  });

  QUnit.test('serializes changes done to the nested collection', function (assert) {
    var model = new CompositeModel(undefined, {
          composite: {
            subcollection: TestCollection
          }
        }),
        output;
    model.subcollection.add({id: 1});
    output = model.toJSON();
    assert.equal(!!output.subcollection, true,
      'subcollection has been serialized');
    assert.equal(output.subcollection.length, 1,
      'subcollection items have have been serialized');
    assert.equal(output.subcollection[0].id, 1,
      'subcollection item changes have have been serialized');
  });

}());
