const isString = require('lodash/isString');
const isNumber = require('lodash/isNumber');
const validator = require('validator');

validator.type = (value, Fn) => {
  if (Fn === String) return isString(value);
  if (Fn === Number) return isNumber(value);
  if (Fn === Boolean) return value === false || value === true;
  return value instanceof Fn || (value && Fn && Object.getPrototypeOf(value) === Fn);
};

validator.max = (value, compare) => value <= compare;

validator.min = (value, compare) => value >= compare;

validator.length = (value, range) => {
  const len = value.length;
  return len >= range[0] && len <= range[1];
};

module.exports = validator;
