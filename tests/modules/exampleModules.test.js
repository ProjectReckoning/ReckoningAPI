const { exampleLogic } = require('../../bin/modules/exampleModules');

describe('exampleLogic', () => {
  it('should return true when valid', () => {
    const input = { name: 'test' };
    const result = exampleLogic(input);
    expect(result).toBe(true); // update based on real logic
  });
});
