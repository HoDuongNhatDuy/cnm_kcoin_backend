let TransactionService = require('../../services/apis/TransactionService');
const CONFIGS      = require('../../configs');

exports.GetDashboardInfo = async function (req, res, next) {
    try {
        let address = reg.params.address;
        let available = await TransactionService.GetBalance(address, CONFIGS.BALANCE_TYPE.AVAILABLE);
        let actual = await TransactionService.GetBalance(address, CONFIGS.BALANCE_TYPE.ACTUAL);
        let recent = await TransactionService.GetLocalTransactions(address, true, 0, 10);

        res.json({
            status: 1,
            message: 'Got data successfully',
            data: {
                available: available,
                actual: actual,
                transactions: recent
            }
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};