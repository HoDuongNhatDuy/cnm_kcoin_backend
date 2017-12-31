const TransactionService = require('../../services/apis/TransactionService');
const UserService = require('../../services/apis/UserService');
const CONFIGS      = require('../../configs');
const EmailService = require('../../services/EmailService');

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


        let localTransactionData = {
            src_addr: srcAddress,
            dst_addr: dstAddress,
            amount,
            remaining_amount: amount,
            status: CONFIGS.LOCAL_TRANSACTION_STATUS.INIT
        };

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
            message: 'New transaction has successfully created',
            data: {
                transaction_id: newTransaction.id
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

exports.SendCreateTransactionConfirmationEmail = async function (req, res, next) {
    try {
        let transactionId = req.params.transactionId;
        let transaction = await TransactionService.GetLocalTransactionById(transactionId);
        if (!transaction) {
            res.json({
                status: 0,
                message: 'Transaction not found'
            });
            return;
        }

        let twoFACode = TransactionService.Generate2FACode();
        transaction.two_fa_code = twoFACode;
        transaction = await TransactionService.UpdateLocalTransaction(transaction);

        let srcAddress= transaction.src_addr;
        let user = await UserService.GetUserByAddress(srcAddress);
        let email = user.email;

        let mailOptions = {
            from: `KCoin <${CONFIGS.EMAIL.SENDER}>`,
            to: email,
            subject: 'KCoin - Create new transaction confirmation',
            html: `Your 2-FA code is:<b>${twoFACode}</b>`
        };
        let sendEmailResult = await EmailService.SendEmail(mailOptions);
        if (sendEmailResult) {
            res.json({
                status: 1,
                message: 'A confirmation email has been sent.'
            });
        }
        else {
            res.json({
                status: 0,
                message: 'Unknown error!'
            });
        }
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.ConfirmTransaction = async function (req, res, next) {
    try {
        let transactionId = req.body.transaction_id;
        let code          = req.body.code;

        let transaction = await TransactionService.GetLocalTransactionById(transactionId);
        if (!transaction) {
            res.json({
                status: 0,
                message: 'Transaction not found'
            });
            return;
        }

        if (transaction.two_fa_code !== code) {
            res.json({
                status: 0,
                message: 'Invalid 2-FA code'
            });
            return;
        }

        let dstAddress = transaction.dst_addr;
        let user = UserService.GetUserByAddress(dstAddress);

        if (!user) { // send money to external system
            transaction.remaining_amount = transaction.amount;
            transaction.status = CONFIGS.LOCAL_TRANSACTION_STATUS.PENDING;

            TransactionService.SendTransactionRequest(srcAddress, dstAddress, amount);
        }
        else {
            transaction.remaining_amount = 0;
            transaction.status = CONFIGS.LOCAL_TRANSACTION_STATUS.DONE
        }

        transaction = await TransactionService.UpdateLocalTransaction(transaction);
        if (!transaction){
            res.json({
                status: 0,
                message: 'Unknown error'
            });
            return;
        }

        res.json({
            status: 1,
            message: 'Your new transaction has been confirmed successfully'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.DeleteTransaction = async function (req, res, next) {
    try {
        let transactionId = req.params.transactionId;
        let deleteResult = await TransactionService.DeleteLocalTransaction(transactionId);
        if (!deleteResult) {
            res.json({
                status: 0,
                message: 'Unknown error'
            });
            return
        }

        res.json({
            status: 1,
            message: 'Transaction has been deleted'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};