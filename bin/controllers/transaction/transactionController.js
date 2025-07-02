const logger = require('../../helpers/utils/logger');
const wrapper = require('../../helpers/utils/wrapper');
const topupModules = require('../../modules/transaction/topupModules');
const withdrawModules = require('../../modules/transaction/withdrawModules');
const autoBudgetModules = require('../../modules/transaction/autoBudgetModules');
const transferModules = require('../../modules/transaction/transferModules');

module.exports.initTopUp = async (req, res) => {
  const userData = req.userData;
  const topupData = {
    balance: parseFloat(req.body.balance),
    pocket_id: req.body.pocket_id,
  }

  topupModules.initTopUp(userData.id, topupData)
    .then(resp => {
      logger.info('Topup to pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Topup to pocket success', 200);
    })
    .catch(err => {
      logger.error('Error while topup to pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while topup to pocket. Error: ${err}`, 400);
    });
}

module.exports.initWithdraw = async (req, res) => {
  const userData = req.userData;
  const withdrawData = {
    balance: parseFloat(req.body.balance),
    pocket_id: req.body.pocket_id,
  }

  withdrawModules.initWithdraw(userData.id, withdrawData)
    .then(resp => {
      logger.info('Withdraw from pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Withdraw from pocket success', 200);
    })
    .catch(err => {
      logger.error('Error while withdraw from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while withdraw from pocket. Error: ${err}`, 400);
    });
}

module.exports.setAutoBudget = async (req, res) => {
  const autoBudgetData = {
    user_id: req.userData.id,
    pocket_id: req.params.pocketId,
    recurring_amount: parseFloat(req.body.recurring_amount),
    treshold_amount: 0,
    status: req.body.status || 'active',
    category: req.body.category,
    is_active: true,
    schedule_type: req.body.schedule_type,
    schedule_value: req.body.schedule_value,
  }

  autoBudgetModules.setAutoBudget(autoBudgetData)
    .then(resp => {
      logger.info('Success set auto budget');
      wrapper.response(res, 'success', wrapper.data(resp), 'Success set auto budget', 200);
    })
    .catch(err => {
      logger.error('Error while set the auto budget', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while set the auto budget. Error: ${err}`, 400);
    });
}

module.exports.getAutoBudget = async (req, res) => {
  const autoBudgetData = {
    user_id: req.userData.id,
    pocket_id: req.params.pocketId,
  }

  autoBudgetModules.getAutoBudget(autoBudgetData)
    .then(resp => {
      logger.info('Success fetch auto budget');
      wrapper.response(res, 'success', wrapper.data(resp), 'Success fetch auto budget', 200);
    })
    .catch(err => {
      logger.error('Error while fetch the auto budget', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetch the auto budget. Error: ${err}`, 400);
    });
}

module.exports.deleteAutoBudget = async (req, res) => {
  const autoBudgetData = {
    user_id: req.userData.id,
    pocket_id: req.params.pocketId,
  }

  autoBudgetModules.deleteAutoBudget(autoBudgetData)
    .then(resp => {
      logger.info('Success delete auto budget');
      wrapper.response(res, 'success', wrapper.data(resp), 'Success delete auto budget', 200);
    })
    .catch(err => {
      logger.error('Error while delete the auto budget', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while delete the auto budget. Error: ${err}`, 400);
    });
}

module.exports.initTransfer = async (req, res) => {
  const userData = req.userData;
  const transferData = {
    balance: parseFloat(req.body.balance),
    pocket_id: req.body.pocket_id,
    destination: req.body.destination,
    description: req.body.description,
    category: req.body.category
  }

  transferModules.initTransfer(userData, transferData)
    .then(resp => {
      logger.info('Initiate transfer from pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Initiate transfer from pocket success', 200);
    })
    .catch(err => {
      logger.error('Error while transfer from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while transfer from pocket. Error: ${err}`, 400);
    });
}

module.exports.respondTransfer = async (req, res) => {
  const userData = req.userData;
  const approvalData = {
    status: req.body.status,
    transactionId: req.params.transactionId,
  }

  transferModules.respondTransfer(userData, approvalData)
    .then(({ result, message }) => {
      logger.info('User has been respond the approval for transation');
      wrapper.response(res, 'success', wrapper.data(result), `User has been respond the approval for transation. ${message}`, 200);
    })
    .catch(err => {
      logger.error('Error while respond the transaction', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while respond the transaction. Error: ${err}`, 400);
    });
}

module.exports.setTransferSchedule = async (req, res) => {
  const userData = req.userData;
  const scheduleData = {
    pocket_id: req.body.pocket_id,
    balance: req.body.balance,
    destination: req.body.destination,
    category: req.body.category,
    date: new Date(req.body.date).getDate(),
    month_start: new Date(req.body.start).getMonth(),
    year_start: new Date(req.body.start).getFullYear(),
    month_end: new Date(req.body.end).getMonth(),
    year_end: new Date(req.body.end).getFullYear(),
  };

  transferModules.setTransferSchedule(userData, scheduleData)
    .then(resp => {
      logger.info('Set transfer schedule from pocket success');
      wrapper.response(res, 'success', wrapper.data(resp), 'Set transfer schedule from pocket success', 200);
    })
    .catch(err => {
      logger.error('Error while set transfer schedule from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while set transfer schedule from pocket. Error: ${err}`, 400);
    });
}

module.exports.getTransferSchedule = async (req, res) => {
  const userData = req.userData;
  const pocket_id = req.params.pocketId;

  transferModules.getTransferSchedule(userData, pocket_id)
    .then(resp => {
      logger.info('Transfer schedule has been fetched from pocket');
      wrapper.response(res, 'success', wrapper.data(resp), 'Transfer schedule has been fetched from pocket', 200);
    })
    .catch(err => {
      logger.error('Error while fetching transfer schedule from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching transfer schedule from pocket. Error: ${err}`, 400);
    });
}

module.exports.getDetailTransferSchedule = async (req, res) => {
  const userData = req.userData;
  const pocket_id = req.params.pocketId;
  const schedule_id = req.params.scheduleId;

  transferModules.getDetailTransferSchedule(userData, pocket_id, schedule_id)
    .then(resp => {
      logger.info('Transfer schedule has been fetched from pocket');
      wrapper.response(res, 'success', wrapper.data(resp), 'Transfer schedule has been fetched from pocket', 200);
    })
    .catch(err => {
      logger.error('Error while fetching transfer schedule from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching transfer schedule from pocket. Error: ${err}`, 400);
    });
}

module.exports.deleteTransferSchedule = async (req, res) => {
  const userData = req.userData;
  const pocket_id = req.params.pocketId;
  const schedule_id = req.params.schedule_id;

  transferModules.deleteTransferSchedule(userData, pocket_id, schedule_id)
    .then(resp => {
      logger.info('Transfer schedule has been fetched from pocket');
      wrapper.response(res, 'success', wrapper.data(resp), 'Transfer schedule has been fetched from pocket', 200);
    })
    .catch(err => {
      logger.error('Error while fetching transfer schedule from pocket', err);
      wrapper.response(res, 'fail', wrapper.error(err), `Error while fetching transfer schedule from pocket. Error: ${err}`, 400);
    });
}