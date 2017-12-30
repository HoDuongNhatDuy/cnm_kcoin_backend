const LocalTransaction = require('../../models/LocalTransaction');
const RemoteTransaction = require('../../models/RemoteTransaction');
const ursa = require('ursa');
const HASH_ALGORITHM = 'sha256';
const CONFIGS      = require('../../configs');

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

module.exports


module.exports.CreateLocalTransaction = function (newLocalTx) {
    return new Promise(resolve => {
        newLocalTx.created_at = Date.now();
        let newObj = new LocalTransaction(newLocalTx);
        newObj.save(function (err, tx) {
            resolve(tx);
        });
    });
};

module.exports.CreateRemoteTransaction = function (newRemoteTx) {
    return new Promise(resolve => {
        newRemoteTx.created_at = Date.now();
        let newObj = new RemoteTransaction(newRemoteTx);
        newObj.save(function (err, tx) {
            resolve(tx);
        });
    });
};

module.exports.UpdateLocalTransaction = function (localTx) {
    return new Promise(resolve => {
        localTx.save(function (err, tx) {
            resolve(tx);
        });
    });
};

module.exports.UpdateRemoteTransaction = function (remoteTx) {
    return new Promise(resolve => {
        remoteTx.save(function (err, tx) {
            resolve(tx);
        });
    });
};

function SignMessage(message, privateKeyHex) {
    // Create private key form hex
    let privateKey = ursa.createPrivateKey(Buffer.from(privateKeyHex, 'hex'));
    // Create signer
    let signer = ursa.createSigner(HASH_ALGORITHM);
    // Push message to verifier
    signer.update(message);
    // Sign
    return signer.sign(privateKey, 'hex');
}

function SignTransaction(transaction, keys) {
    let message = ToBinary(transaction, true);
    transaction.inputs.forEach((input, index) => {
        let key = keys[index];
        let signature = SignMessage(message, key.privateKey);
        // Genereate unlock script
        input.unlockScript = 'PUB ' + key.publicKey + ' SIG ' + signature;
    });
}

function ToBinary(transaction, withoutUnlockScript) {
    let version = Buffer.alloc(4);
    version.writeUInt32BE(transaction.version);
    let inputCount = Buffer.alloc(4);
    inputCount.writeUInt32BE(transaction.inputs.length);
    let inputs = Buffer.concat(transaction.inputs.map(input => {
        // Output transaction hash
        let outputHash = Buffer.from(input.referencedOutputHash, 'hex');
        // Output transaction index
        let outputIndex = Buffer.alloc(4);
        // Signed may be -1
        outputIndex.writeInt32BE(input.referencedOutputIndex);
        let unlockScriptLength = Buffer.alloc(4);
        // For signing
        if (!withoutUnlockScript) {
            // Script length
            unlockScriptLength.writeUInt32BE(input.unlockScript.length);
            // Script
            let unlockScript = Buffer.from(input.unlockScript, 'binary');
            return Buffer.concat([ outputHash, outputIndex, unlockScriptLength, unlockScript ]);
        }
        // 0 input
        unlockScriptLength.writeUInt32BE(0);
        return Buffer.concat([ outputHash, outputIndex, unlockScriptLength]);
    }));
    let outputCount = Buffer.alloc(4);
    outputCount.writeUInt32BE(transaction.outputs.length);
    let outputs = Buffer.concat(transaction.outputs.map(output => {
        // Output value
        let value = Buffer.alloc(4);
        value.writeUInt32BE(output.value);
        // Script length
        let lockScriptLength = Buffer.alloc(4);
        lockScriptLength.writeUInt32BE(output.lockScript.length);
        // Script
        let lockScript = Buffer.from(output.lockScript);
        return Buffer.concat([value, lockScriptLength, lockScript ]);
    }));
    return Buffer.concat([ version, inputCount, inputs, outputCount, outputs ]);
}

/*
    inputs: [
        {
            source: {referencedOutputHash, referencedOutputIndex},
            key: {privateKey, publicKey},
            address: address
        },
        ...
    ],
    outputs: [
        {address, value},
        ....
    ]
 */
module.exports.SignTransactionRequest = function (inputs, outputs) {
    // Generate transactions
    let bountyTransaction = {
        version: 1,
        inputs: [],
        outputs: []
    };

    let keys = [];

    inputs.forEach(input => {
        bountyTransaction.inputs.push({
            referencedOutputHash: input.source.referencedOutputHash,
            referencedOutputIndex: input.source.referencedOutputIndex,
            unlockScript: ''
        });
        keys.push(input.key);
    });

    // Output to all destination 10000 each
    outputs.forEach(output => {
        bountyTransaction.outputs.push({
            value: output.value,
            lockScript: 'ADD ' + output.address
        });
    });

    // Sign
    SignTransaction(bountyTransaction, keys);

    return bountyTransaction;
};

function GetLocalTransactions (address, sort, offset, limit) {
    return new Promise(resolve => {
        LocalTransaction.find({
            $or: [
                {src_addr: address},
                {dst_addr: address},
            ],
            status: {'$ne': 'invalid' }
        }, function (error, transactions) {
            if (!transactions) {
                resolve([]);
                return;
            }
            if(!sort) transactions.sort({created_at: 'descending'});
            resolve(transactions.offset(offset).limit(limit));
        })
    });
}

module.exports.GetLocalTransactions = async function (address, sort = null, offset = 0, limit = 10) {
    return await GetLocalTransactions(address, sort, offset, limit);
};

/**
 * @return {number}
 */
module.exports.GetBalance = async function(address, type = CONFIGS.BALANCE_TYPE.AVAILABLE) {
    let transactions  = await GetLocalTransactions(address);
    let receivedAmount = 0;
    let sentAmount    = 0;
    for (let index in transactions) {
        let transaction = transactions[index];

        if (transaction.status === CONFIGS.LOCAL_TRANSACTION_STATUS.INVALID)
            continue;

        if (type === CONFIGS.BALANCE_TYPE.ACTUAL && transaction.status !== CONFIGS.LOCAL_TRANSACTION_STATUS.DONE)
            continue;

        if (transaction.src_addr === address) {
            sentAmount += transaction.amount;
        }
        else if (transaction.dst_addr === address) {
            receivedAmount += transaction.amount;
        }
    }

    return receivedAmount - sentAmount;
};

function GetFreeRemoteTransactions() {
    return new Promise(resolve => {
        RemoteTransaction.find({'$ne': {status: CONFIGS.REMOTE_TRANSACTION_STATUS.PENDING}}, function (error, transactions) {
            if (!transactions){
                resolve([]);
                return;
            }
            resolve(transactions);
        })
    });
}

async function BuildTransactionRequest(srcAddress, dstAddress, amount) {
    let freeTransactions = await GetFreeRemoteTransactions();
    let useResources = [];
    let remainingAmount = amount;
    for (let index in freeTransactions) {
        let freeTransaction = freeTransactions[index];
        useResources.push(freeTransaction);
        remainingAmount -= freeTransaction.amount;
        if (remainingAmount <= 0)
            break;
    }

    let outputs = [
        {
            address: dstAddress,
            value: amount
        }
    ];

    if (remainingAmount < 0) {
        outputs.push({
            address: srcAddress,
            value: -remainingAmount
        });
    }

    for (let index in useResources) {
        let resource = useResources[index];
        let address = resource.dst_addr;

        // TODO get key by this address
        // TODO adjust hash and index
        // TODO return a array like demo in routes/apis.js ('CREATE TRANSACTION REQUEST')
    }
}