const { userAuthMiddleware } = require('../../bin/middlewares/userAuth');

describe('userAuthMiddleware', () => {
  const req = { headers: { authorization: 'Bearer mocktoken' } };
  const res = {};
  const next = jest.fn();

  it('should call next if token is valid', () => {
    userAuthMiddleware(req, res, next);
    expect(next).toHaveBeenCalled(); // assuming middleware calls next
  });
});
