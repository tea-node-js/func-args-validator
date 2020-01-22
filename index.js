const each = require('lodash/each');
const isFunction = require('lodash/isFunction');
const validator = require('./lib/validator');

const validate = (schema, name, value, args) => {
  // simple usage schema is constructor
  if (schema instanceof Function) {
    schema = {
      allowNull: true,
      type: schema,
    };
  }

  // allowNull check
  if (schema.allowNull === true && value == null) return;

  // type check
  if (!validator.type(value, schema.type)) throw Error(schema.message || `Argument \`${name}\` type must be \`${schema.type.name}\``);

  // validate check
  if (schema.validate) {
    each(schema.validate, (val, key) => {
      let pass = false;
      if (isFunction(val)) {
        pass = val(value, schema, args);
      } else if (val === false) {
        pass = !validator[key](`${value}`);
      } else if (val === true) {
        pass = validator[key](`${value}`);
      } else {
        pass = validator[key](`${value}`, val);
      }
      if (!pass) {
        throw Error(schema.message || `\`${name}\` validate failure: ${key}`);
      }
    });
  }

  // iterator check
  if (schema.iterator) {
    each(value, (v) => {
      each(schema.iterator, (val, key) => {
        validate(val, key, v[key]);
      });
    });
  }
};

const delegate = function (fn, schemas) {
  let args = [];

  const func = function (..._args) {
    [].slice.call(_args, 0).forEach((x, i) => {
      if (x != null) args[i] = x;
    });
    return func.exec();
  };

  const getArgument = index => function (value) {
    if (value != null) args[index] = value;
    return func;
  };

  each(schemas, (schema, index) => {
    if (Object.hasOwnProperty.apply(func, [schema.name])) throw Error(`Function ${schema.name} already exists!`);
    func[schema.name] = getArgument(index);
  });

  func.exec = function () {
    let result;
    try {
      each(schemas, (schema, index) => {
        if (Object.hasOwnProperty.apply(schema, ['defaultValue'])) {
          if (args[index] == null) args[index] = schema.defaultValue;
        }
        validate(schema, schema.name, args[index], args);
      });
      result = fn.apply(...[null, args]);
    } catch (e) {
      throw e;
    } finally {
      args = [];
    }
    return result;
  };

  return func;
};

module.exports = delegate(delegate, [{
  name: 'func',
  allowNull: false,
  type: Function,
  message: 'The first argument `func` must be a function',
}, {
  name: 'schemas',
  type: Array,
  allowNull: false,
  validate: {
    iteratorCheck(schemas) {
      each(schemas, (schema, index) => {
        if (schema.type === Array || !schema.iterator) return;
        throw Error(`\`iterator\` enabled when \`Type\` must be \`Array\` schemas[${index}]`);
      });
      return true;
    },
  },
  iterator: {
    name: {
      type: String,
      allowNull: false,
      validate: {
        matches: /^[$_A-z][$_\w]+$/,
      },
      message: 'The `name` must be a string, A-z0-9$_, Can\'t start with numbers',
    },
    type: {
      type: Function,
      allowNull: false,
      message: 'The `type` must be a Type Function, eg. Array, Object, String...',
    },
    allowNull: Boolean,
    validate: {
      type: Object,
      allowNull: true,
      validate: {
        exists(obj) {
          each(obj, (v, k) => {
            if (!isFunction(v) && !isFunction(validator[k])) {
              throw Error(`Not found validate rule: ${k}`);
            }
          });
          return true;
        },
      },
    },
    iterator: Object,
    message: String,
  },
}]);
