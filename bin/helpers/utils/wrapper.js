const {
    NotFoundError, InternalServerError, BadRequestError, ConflictError, ConditionNotMetError, PreconditionFailedError,
    ForbiddenError, MethodNotAllowedError, UnauthorizedError
} = require('../error');
const data = d => ({err: null, data: d});

const paginationData = (d, meta) => ({err: null, data: d, meta});

const error = err => ({err, data: null});

const checkErrorCode = (errorObj) => {
    switch (errorObj.constructor) {
    case BadRequestError:
        return 400;
    case ConflictError:
        return 409;
    case ConditionNotMetError:
        return 304;
    case ForbiddenError:
        return 403;
    case InternalServerError:
        return 500;
    case NotFoundError:
        return 404;
    case MethodNotAllowedError:
        return 405;
    case UnauthorizedError:
        return 401;
    default:
        return 409;
    }
};

const response = (res, type, result, message = '', statusCode = 200) => {
    let ok = true;
    let {data: d} = result;
    if (type === 'fail') {
        ok = false;
        d = null;
        message = result.err.message || message;
        statusCode = checkErrorCode(result.err);
    }
    const json = {
        ok,
        data: d,
        message,
        code: statusCode,
    };
    res.outputResponse = json;
    res.status(statusCode).send(json);
};

module.exports = {
    data,
    paginationData,
    error,
    response
}