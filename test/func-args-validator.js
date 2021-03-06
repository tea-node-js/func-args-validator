const assert = require('assert');
const delegate = require('../');

/* global describe it */
describe('func-delegate', () => {
  describe('#normal-only-type', () => {
    let add = (a, b) => a + b;
    add = delegate(add, [{
      name: 'num1',
      type: Number,
    }, {
      name: 'num2',
      type: Number,
    }]);

    /* eslint class-methods-use-this: 0 */
    class User {
      static count() {
        return 1;
      }
    }

    let count = (Model) => {
      const result = Model.count();
      return result;
    };

    count = delegate(count, [{
      name: 'Model',
      type: User,
    }]);

    it('Type assert', (done) => {
      assert.ok(add instanceof Function, '处理后的仍然是一个函数');
      assert.ok(add.num1 instanceof Function, '接收参数的函数 num1');
      assert.ok(add.num2 instanceof Function, '接收参数的函数 num2');

      done();
    });

    it('exec assert', (done) => {
      assert.equal(3, add(1, 2), '正常执行');
      assert.equal(3, add.num1(1).num2(2).exec(), '链式调用');
      done();
    });

    it('es class assert', (done) => {
      const user = class extends User {};

      assert.equal(1, count(user), 'es class');

      done();
    });

    it('Exception assert', (done) => {
      assert.throws(() => {
        add(1, '2');
      }, err => (err instanceof Error) && err.message === 'Argument `num2` type must be `Number`', 'Num2 is string');

      assert.throws(() => {
        add.num2('2').num1(1).exec();
      }, err => (err instanceof Error) && err.message === 'Argument `num2` type must be `Number`', '链式调用 num2 is string');

      assert.throws(() => {
        add.num1(1).num2('2').exec();
      }, err => (err instanceof Error) && err.message === 'Argument `num2` type must be `Number`', '链式调用 num2 是 string, 顺序无关');

      assert.throws(() => {
        count({});
      }, err => (err instanceof Error));

      done();
    });
  });

  describe('#validate allowNull', () => {
    let add = (a, b, sqrt) => {
      const sum = a + b;
      if (sqrt === true) {
        return Math.sqrt(sum);
      }
      return sum;
    };
    add = delegate(add, [{
      name: 'num1',
      type: Number,
    }, {
      name: 'num2',
      type: Number,
    }, {
      name: 'sqrt',
      type: Boolean,
      allowNull: true,
    }]);
    it('type assert', (done) => {
      assert.ok(add instanceof Function, '处理后的仍然是一个函数');
      assert.ok(add.num1 instanceof Function, 'num1 是接收参数的函数');
      assert.ok(add.num2 instanceof Function, 'num2 是接收参数的函数');
      assert.ok(add.sqrt instanceof Function, 'sqrt 是接收参数的函数');
      done();
    });

    it('exec assert', (done) => {
      assert.equal(3, add(1, 2), '普通调用，缺失 sqrt 参数');
      assert.equal(16, add.num1(7).num2(9).exec(), '链式执行缺失 sqrt 参数');
      assert.equal(4, add.num1(7).num2(9).sqrt(true).exec(), '链式执行 sqrt true');
      assert.equal(16, add.num1(7).num2(9).sqrt(false).exec(), 'sqrt false');
      assert.equal(16, add.sqrt(false).num1(7).num2(9).exec(), '顺序无关');
      done();
    });

    it('Exception assert', (done) => {
      assert.throws(() => {
        add(1, '2');
      }, err => (err instanceof Error) && err.message === 'Argument `num2` type must be `Number`');

      assert.throws(() => {
        add.num2('2').num1(1).exec();
      }, err => (err instanceof Error) && err.message === 'Argument `num2` type must be `Number`');

      assert.throws(() => {
        add.num1(1).num2('2').exec();
      }, err => (err instanceof Error) && err.message === 'Argument `num2` type must be `Number`');

      assert.throws(() => {
        add.num1(1).num2(2).sqrt('hello').exec();
      }, err => (err instanceof Error) && err.message === 'Argument `sqrt` type must be `Boolean`');
      done();
    });
  });

  describe('#validate rule and defaultValue', () => {
    let person = (name, email, age) => ({
      name,
      email,
      age,
    });

    person = delegate(person, [{
      name: 'Name',
      type: String,
      validate: {
        matches: /^赵/,
        length(v) {
          return v.length > 1 && v.length < 4;
        },
      },
      message: 'Name must be a string, start with `赵`, lenght gt 1 and lt 4',
    }, {
      name: 'email',
      type: String,
      validate: {
        isEmail: true,
      },
    }, {
      name: 'age',
      type: Number,
      defaultValue: 18,
      allowNull: true,
      validate: {
        max: 200,
      },
      message: 'Age must be a number, max value is 200, default is 18',
    }]);
    it('Type assert', (done) => {
      assert.ok(person instanceof Function, '处理后的仍然是一个函数');
      assert.ok(person.Name instanceof Function, 'Name');
      assert.ok(person.email instanceof Function, 'email');
      assert.ok(person.age instanceof Function, 'age');
      done();
    });

    it('exec assert', (done) => {
      assert.deepEqual({
        email: '13740080@qq.com',
        name: '赵雄飞',
        age: 18,
      }, person('赵雄飞', '13740080@qq.com'));
      assert.deepEqual({
        email: '13740080@qq.com',
        name: '赵雄飞',
        age: 18,
      }, person.Name('赵雄飞').email('13740080@qq.com').exec());
      assert.deepEqual({
        email: '13740080@qq.com',
        name: '赵雄飞',
        age: 36,
      }, person.Name('赵雄飞').email('13740080@qq.com').age(36).exec());
      done();
    });

    it('Exception assert', (done) => {
      assert.throws(() => {
        person('王方', '223251686@qq.com');
      }, err => (err instanceof Error) && err.message === 'Name must be a string, start with `赵`, lenght gt 1 and lt 4');

      assert.throws(() => {
        person('赵导耳机', '223251686@qq.com');
      }, err => (err instanceof Error) && err.message === 'Name must be a string, start with `赵`, lenght gt 1 and lt 4');

      assert.throws(() => {
        person.Name('王方').email('223251686@qq.com').exec();
      }, err => (err instanceof Error) && err.message === 'Name must be a string, start with `赵`, lenght gt 1 and lt 4');

      assert.throws(() => {
        person.Name('赵星梦').email('223251686').exec();
      }, err => (err instanceof Error) && err.message === '`email` validate failure: isEmail');

      done();
    });
  });

  describe('#iterator validate', () => {
    let lib = books => ({
      books,
      size: books.length,
    });
    lib = delegate(lib, [{
      name: 'books',
      type: Array,
      iterator: {
        name: {
          type: String,
          allowNull: false,
          validate: {
            length: [1, 20],
          },
          message: '书名必填是字符串，长度为 1 - 20',
        },
        price: {
          type: Number,
          allowNull: true,
          validate: {
            max: 300,
            min: 10,
          },
          message: '价格选填，数字类型，最大 300， 最小 10',
        },
      },
    }]);
    it('Type assert', (done) => {
      assert.ok(lib instanceof Function, '处理后的仍然是一个函数');
      assert.ok(lib.books instanceof Function, 'books 是接收参数的函数');
      assert.ok(lib.exec instanceof Function, 'exec 是执行函数');
      done();
    });

    it('exec assert', (done) => {
      assert.deepEqual({
        books: [{
          name: 'JavaScript 权威指南',
          price: 35.26,
        }, {
          name: 'MySQL 性能优化',
        }],
        size: 2,
      }, lib([{ name: 'JavaScript 权威指南', price: 35.26 }, { name: 'MySQL 性能优化' }]));
      assert.deepEqual({
        books: [{
          name: 'JavaScript 权威指南',
          price: 35.26,
        }, {
          name: 'MySQL 性能优化',
        }],
        size: 2,
      }, lib.books([{ name: 'JavaScript 权威指南', price: 35.26 }, { name: 'MySQL 性能优化' }]).exec());
      done();
    });

    it('Exception assert', (done) => {
      assert.throws(() => {
        lib('hello world');
      }, err => (err instanceof Error) && err.message === 'Argument `books` type must be `Array`', '参数类型错误');

      assert.throws(() => {
        lib([{ name: [] }]);
      }, err => (err instanceof Error) && err.message === '书名必填是字符串，长度为 1 - 20', 'iterator 里类型错误');

      assert.throws(() => {
        lib.books([{ name: 'Hello world', price: 'Redstone' }]).exec();
      }, err => (err instanceof Error) && err.message === '价格选填，数字类型，最大 300， 最小 10', 'iterator 价格类型不对');

      assert.throws(() => {
        lib.books([{ name: 'Hello world', price: 500 }]).exec();
      }, err => (err instanceof Error) && err.message === '价格选填，数字类型，最大 300， 最小 10', 'iterator 价格类型不对');

      assert.throws(() => {
        lib.books([{ name: 'Hello world', price: 5 }]).exec();
      }, err => (err instanceof Error) && err.message === '价格选填，数字类型，最大 300， 最小 10', 'iterator 价格类型不对');

      assert.throws(() => {
        lib.books([{ name: 'Hello world' }, { name: [] }]).exec();
      }, err => (err instanceof Error) && err.message === '书名必填是字符串，长度为 1 - 20', 'iterator 时某些数据的类型不正确');

      assert.throws(() => {
        lib.books([{ name: 'Hello world Hello world Hello world Hello world' }]).exec();
      }, err => (err instanceof Error) && err.message === '书名必填是字符串，长度为 1 - 20', 'iterator 内书名超出长度');

      done();
    });
  });

  describe('improve coverage', () => {
    let fn = (a, b) => a + b;
    const schemas = [{
      name: 'num',
      type: Number,
      validate: {
        hello: true,
      },
    }, {
      name: 'add',
      type: Number,
    }];
    it('validate[key] non-exists', (done) => {
      assert.throws(() => {
        fn = delegate(fn, schemas);
      }, err => (err instanceof Error) && err.message === 'Not found validate rule: hello', 'validator[key] non-exists');
      done();
    });

    it('validate rule value false', (done) => {
      let f2 = (a, b) => ({ name: a, age: b });
      f2 = delegate(f2, [{
        name: 'Name',
        type: String,
        validate: {
          isEmail: false,
        },
        message: '名字不能是Email',
      }, {
        name: 'Age',
        type: Number,
        validate: {
          isFloat: false,
          min: 0,
          max: 200,
        },
        message: '年龄是自然数不能是浮点数',
      }]);

      assert.throws(() => {
        f2.Name('13740080@qq.com').Age(30).exec();
      }, err => (err instanceof Error) && err.message === '名字不能是Email', '名字不能是Email');

      assert.throws(() => {
        f2.Name('赵雄飞').Age(30.5).exec();
      }, err => (err instanceof Error) && err.message === '年龄是自然数不能是浮点数', '年龄设置为浮点数');

      assert.throws(() => {
        f2.Name('赵雄飞').Age(-20).exec();
      }, err => (err instanceof Error) && err.message === '年龄是自然数不能是浮点数', '年龄为负数');

      done();
    });

    it('iterator when type not Array', (done) => {
      let fn = (a, b) => a + b;
      const schemas = [{
        name: 'basic',
        type: Number,
        iterator: {
          name: String,
        },
      }, {
        name: 'add',
        type: Number,
      }];
      assert.throws(() => {
        fn = delegate(fn, schemas);
      }, err => (err instanceof Error) && err.message === '`iterator` enabled when `Type` must be `Array` schemas[0]', '非数组类型有 iterator');

      done();
    });

    it('function arguments defaultValue', (done) => {
      let fn = (a, b) => a + b;
      fn = delegate(fn, [{
        name: 'basic',
        type: Number,
      }, {
        name: 'add',
        type: Number,
        allowNull: true,
        defaultValue: 20,
      }]);

      assert.equal(30, fn(10), '默认加20');
      assert.equal(30, fn(10, null), '默认加20, 两个参数');
      assert.equal(30, fn.basic(10).exec(), '默认加20, 链式调用');
      assert.equal(30, fn.basic(10).add(null).exec(), '默认加20, 缺省null链式调用');
      assert.equal(30, fn.basic(10).add(undefined).exec(), '默认加20, 缺省undefined链式调用');
      assert.equal(30, fn.basic(10).add().exec(), '默认加20, 缺省未调用链式调用');

      done();
    });

    it('argument name already exists function', (done) => {
      let fn = (name, age) => ({
        name,
        age,
      });
      const schemas = [{
        name: 'name',
        type: String,
      }, {
        name: 'age',
        type: Number,
      }];

      assert.throws(() => {
        fn = delegate(fn, schemas);
      }, err => (err instanceof Error) && err.message === 'Function name already exists!', 'name exists on function property');

      done();
    });
  });

  describe('special defaultValue', () => {
    let fn = (a, b) => a + b;
    const schemas = [{
      name: 'basic',
      type: Number,
    }, {
      name: 'add',
      type: Number,
      defaultValue: 50,
      message: 'Argument `add` must be a `Number`',
    }];
    fn = delegate(fn, schemas);
    it('no use defaultValue', (done) => {
      assert.equal(50, fn.add(30).basic(20).exec());
      done();
    });
    it('last args will be clear, defaultValue active', (done) => {
      assert.equal(70, fn.basic(20).exec());
      done();
    });
    it('set defaultValue validate', (done) => {
      assert.throws(() => {
        fn.basic(20).add('30').exec();
      }, err => (err instanceof Error) && err.message === 'Argument `add` must be a `Number`');

      done();
    });
  });
});
