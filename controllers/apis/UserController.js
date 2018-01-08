const TransactionService = require('../../services/apis/TransactionService');
const UserService = require('../../services/apis/UserService');
const CONFIGS      = require('../../configs');

exports.GetUsersInfo = async function (req, res, next) {
    try {
        let users = await UserService.GetUsers();
        let data = [];
        for (let index in users) {
            let user = users[index];
            let address = user.address;

            let available = TransactionService.GetBalance(address, CONFIGS.BALANCE_TYPE.AVAILABLE);
            let actual = TransactionService.GetBalance(address, CONFIGS.BALANCE_TYPE.ACTUAL);

            available = await available;
            actual = await actual;

            data.push({
                id: user._id,
                email: user.email,
                address,
                actual,
                available
            });
        }

        res.json({
            status: 1,
            message: 'Got data successfully',
            data
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.GetUserTransactions = async function (req, res, next) {
    try {
        let userId = req.params.id;
        let user = await UserService.GetUserById(userId);

        let transactions = await TransactionService.GetLocalTransactions(user.address, null, 0, null);

        res.json({
            status: 1,
            message: 'Got data successfully',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    address: user.address
                },
                transactions
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