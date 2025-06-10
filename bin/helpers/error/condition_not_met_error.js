const CommonError = require('./common_error');

class ConditionNotMetError extends CommonError {
    constructor(message) {
        super(message || 'Condition Not Met Failed');
    }
}

module.exports = ConditionNotMetError;
