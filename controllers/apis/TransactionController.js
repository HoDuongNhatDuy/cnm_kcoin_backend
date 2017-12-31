const TransactionService = require('../../services/apis/TransactionService');
const UserService = require('../../services/apis/UserService');
const CONFIGS      = require('../../configs');

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

exports.CreateTransaction = async function (req, res, next) {
    try {
        let srcAddress = req.body.src_addr;
        let dstAddress = req.body.dst_arrd;
        let amount     = req.body.amount;

        if (!srcAddress || !dstAddress) {
            res.json({
                status: 0,
                message: 'Invalid data'
            });
            return;
        }

        let balance = await TransactionService.GetBalance(srcAddress, CONFIGS.BALANCE_TYPE.AVAILABLE);

        if (balance < amount){
            res.json({
                status: 0,
                message: 'Balance is insufficient for a withdrawal'
            });
            return;
        }

        let user = UserService.GetUserByAddress(dstAddress);

        let localTransactionData = {
            src_addr: srcAddress,
            dst_addr: dstAddress,
            amount,
            remaining_amount: 0,
            status: CONFIGS.LOCAL_TRANSACTION_STATUS.DONE
        };

        if (!user) { // send money to external system
            localTransactionData.remaining_amount = amount;
            localTransactionData.status = CONFIGS.LOCAL_TRANSACTION_STATUS.PENDING;

            TransactionService.SendTransactionRequest(srcAddress, dstAddress, amount);
        }

        let newTransaction = await TransactionService.CreateLocalTransaction(localTransactionData);
        if (!newTransaction) {
            res.json({
                status: 0,
                message: 'Failed to create new transaction'
            });
            return;
        }

        res.json({
            status: 1,
            message: 'New transaction has successfully created'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};
