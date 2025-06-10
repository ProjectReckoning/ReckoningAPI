const CommonError = require('./common_error');

class MethodNotAllowed extends CommonError {
    constructor(message) {
        super(message || 'Method Not Allowed');
    }
}

module.exports = MethodNotAllowed;
