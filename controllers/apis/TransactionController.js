let TransactionService = require('../../services/apis/TransactionService');

exports.GetTransactions = async function (req, res, next) {
    try {
        let address = req.params.address;
        let offset  = typeof req.query.offset !== 'undefined' ? req.query.offset : 0;
        let limit   = typeof req.query.limit !== 'undefined' ? req.query.limit : 10;
        let result  = await TransactionService.GetLocalTransactions(address, true, offset, limit);
        res.json({
            status: 1,
            message: 'Got data successfully',
            data: {
                transactions: result
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