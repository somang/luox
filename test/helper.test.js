var { asExponential } = require('./../src/helpers.js')
var assert = require('assert');

describe('asExponential', function() {
  it('should return a number larger than 1 in scientific notation', function() {
    assert.equal('1.36e+02', asExponential(136))
  });

  it('should return a number smaller than 1 in scientific notation', function() {
    assert.equal('1.36e-02', asExponential(0.0136))
  });

  it('should not have a leading zero in the exponent for larger numbers', function() {
    assert.equal('1.36e+10', asExponential(13600000000))
  });
});
