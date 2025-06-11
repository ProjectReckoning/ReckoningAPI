const { exampleFunction } = require('../../bin/controllers/exampleControllers');

describe('exampleFunction', () => {
  it('should return expected value', () => {
    const result = exampleFunction();
    expect(result).toBe('expectedValue'); // replace with real expectation
  });
});
