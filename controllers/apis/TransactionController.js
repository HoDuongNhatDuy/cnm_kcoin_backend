const TransactionService = require('../../services/apis/TransactionService');
const UserService = require('../../services/apis/UserService');
const CONFIGS      = require('../../configs');
const EmailService = require('../../services/EmailService');

exports.GetTransactions = async function (user, req, res, next) {
    try {
        let address = user.address;
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

exports.CreateTransaction = async function (user, req, res, next) {
    try {
        let srcAddress = user.address;
        let dstAddress = req.body.dst_arrd;
        let amount     = req.body.amount;

        if (!srcAddress || !dstAddress) {
            res.json({
                status: 0,
                message: 'Invalid data!'
            });
            return;
        }

        let balance = await TransactionService.GetBalance(srcAddress, CONFIGS.BALANCE_TYPE.AVAILABLE);

        if (balance < amount){
            res.json({
                status: 0,
                message: 'Balance is insufficient for a withdrawal!'
            });
            return;
        }

        let dstUser = await UserService.GetUserByAddress(dstAddress);
        if (!dstUser) { // is send money to external transaction
            let availableBalance = await TransactionService.GetActualBalanceOfServer();
            if (availableBalance < amount){
                res.json({
                    status: 0,
                    message: 'Server busy... please try after 10 minutes!'
                });
                return;
            }
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
                message: 'Failed to create new transaction!'
            });
            return;
        }

        res.json({
            status: 1,
            message: 'New transaction successfully created.',
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

exports.SendCreateTransactionConfirmationEmail = async function (user, req, res, next) {
    try {
        let transactionId = req.params.transactionId;
        let transaction = await TransactionService.GetLocalTransactionById(transactionId);
        if (!transaction) {
            res.json({
                status: 0,
                message: 'Transaction not found!'
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
            subject: 'KCoin - Confirm new transaction',
            html: `Your verification code is: <b>${twoFACode}</b>`
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

exports.ConfirmTransaction = async function (user, req, res, next) {
    try {
        let transactionId = req.body.transaction_id;
        let code          = req.body.code;

        let transaction = await TransactionService.GetLocalTransactionById(transactionId);
        if (!transaction) {
            res.json({
                status: 0,
                message: 'Transaction not found!'
            });
            return;
        }

        if (transaction.two_fa_code !== code) {
            res.json({
                status: 0,
                message: 'Invalid verification code!'
            });
            return;
        }

        let dstAddress = transaction.dst_addr;
        let srcAddress = transaction.src_addr;
        let amount     = transaction.amount;
        let user = await UserService.GetUserByAddress(dstAddress);

        if (!user) { // send money to external system
            transaction.remaining_amount = transaction.amount;
            transaction.status = CONFIGS.LOCAL_TRANSACTION_STATUS.PENDING;

            let sendRequestResult = TransactionService.SendTransactionRequest(srcAddress, dstAddress, amount);
            if (!sendRequestResult) {
                res.json({
                    status: 0,
                    message: 'Failed to send create transaction request'
                })
            }
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
            message: 'Your new transaction has been confirmed successfully.'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.DeleteTransaction = async function (user, req, res, next) {
    try {
        let transactionId = req.params.transactionId;
        let deleteResult = await TransactionService.DeleteLocalTransaction(transactionId);
        if (!deleteResult) {
            res.json({
                status: 0,
                message: 'Unknown error!'
            });
            return
        }

        res.json({
            status: 1,
            message: 'Transaction has been deleted.'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.SyncLatestBlocks = async function (req, res, next) {
    try {
        blocks = await TransactionService.GetLatestBlocks();
        for (let index in blocks) {
            let block = blocks[index];
            let transactions = block.transactions;
            TransactionService.SyncTransactions(transactions);
        }
        res.json({
            status: 1,
            message: 'Synced successfully',
            data: blocks
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.SyncBlock = async function (req, res, next) {
    try {
        let blockId = req.params.blockId;
        let isInitAction = req.query.init ? true : false;

        block = await TransactionService.GetBlock(blockId);
        let transactions = block.transactions;
        TransactionService.SyncTransactions(transactions, isInitAction);
        res.json({
            status: 1,
            message: 'Synced successfully',
            data: transactions
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.GetAllRemoteTransactions = async function (req, res, next) {
    try {
        let remoteTransactions = await TransactionService.GetRemoteTransactions();

        let userList = {};
        let data = [];
        for (let index in remoteTransactions) {
            let transaction = remoteTransactions[index];
            let dstAddr = transaction.dst_addr;

            if (!userList[dstAddr]){
                let user = await UserService.GetUserByAddress(dstAddr);
                userList[dstAddr] = user;
            }

            data.push({
                hash: transaction.src_hash,
                index: transaction.index,
                dst_addr: transaction.dst_addr,
                dst_email: userList[dstAddr] ? userList[dstAddr].email : null,
                amount: transaction.amount,
                status: transaction.status
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