let Transaction = require('../../models/Transaction');

module.exports.GetLocalTransactionById = function (id) {
    return new Promise(resolve => {
        LocalTransaction.findById(id, function (error, tx) {
            resolve(tx);
        });
    });
};

module.exports.GetRemoteTransactionById = function (id) {
    return new Promise(resolve => {
        RemoteTransaction.findById(id, function (error, tx) {
            resolve(tx);
        });
    });
};


module.exports.CreateLocalTransaction = function (newLocalTx) {
    return new Promise(resolve => {
        LocalTransaction.save(function (err, tx) {
            resolve(tx);
        });
    });
};

module.exports.CreateRemoteTransaction = function (newRemoteTx) {
    return new Promise(resolve => {
        RemoteTransaction.save(function (err, tx) {
            resolve(tx);
        });
    });
};

module.exports.UpdateLocalTransaction = function (localTx) {
    return new Promise(resolve => {
        LocalTransaction.save(function (err, localTx) {
            resolve(localTx);
        });
    });
};

module.exports.UpdateRemoteTransaction = function (remoteTx) {
    return new Promise(resolve => {
        remoteTransaction.save(function (err, remoteTx) {
            resolve(remoteTx);
        });
    });
};