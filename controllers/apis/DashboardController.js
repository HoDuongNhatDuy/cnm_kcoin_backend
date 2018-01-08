let TransactionService = require('../../services/apis/TransactionService');
const CONFIGS      = require('../../configs');

exports.GetDashboardInfo = async function (user, req, res, next) {
    try {
        let address = user.address;
        let available = await TransactionService.GetBalance(address, CONFIGS.BALANCE_TYPE.AVAILABLE);
        let actual = await TransactionService.GetBalance(address, CONFIGS.BALANCE_TYPE.ACTUAL);
        let recent = await TransactionService.GetLocalTransactions(address, true, 0, 100);

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

exports.GetAdminBalance = async function (req, res, next) {
    try {
        let availableBalance = await TransactionService.GetActualBalanceOfServer();
        let actualBalance = availableBalance;

        res.json({
            status: 1,
            message: "Got balance successfully",
            data: {available: availableBalance, actual: actualBalance}
        })
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};