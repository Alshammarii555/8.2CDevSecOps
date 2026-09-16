const test = require('node:test');
const assert = require('node:assert/strict');
const utils = require('../utils');

test('ran_no returns a number inside the selected range', () => {
  for (let i = 0; i < 100; i++) {
    const result = utils.ran_no(1, 10);
    assert.ok(result >= 1 && result <= 10);
  }
});

test('uid returns an ID with the requested length', () => {
  const result = utils.uid(12);
  assert.equal(result.length, 12);
  assert.match(result, /^[A-Za-z0-9]+$/);
});

test('forbidden creates a 403 response', () => {
  const response = {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value) {
      this.body = value;
    }
  };

  utils.forbidden(response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.headers['Content-Type'], 'text/plain');
  assert.equal(response.body, 'Forbidden');
});
