const LocalTransaction = require('../../models/LocalTransaction');
const RemoteTransaction = require('../../models/RemoteTransaction');
const UserService = require('../../services/apis/UserService');
const UtilService = require('../../services/UtilService');
const ursa = require('ursa');
const crypto = require('crypto');
const HASH_ALGORITHM = 'sha256';
const CONFIGS      = require('../../configs');

module.exports.GetLocalTransactionById = function (id) {
    return new Promise(resolve => {
        LocalTransaction.findById(id, function (error, tx) {
            resolve(tx);
        });
    });
};

function GetPendingTransactionByDstAddress(dstAddress) {
    return new Promise(resolve => {
        LocalTransaction.findOne({dst_addr: dstAddress, status: CONFIGS.LOCAL_TRANSACTION_STATUS.PENDING}, function (error, tx) {
            resolve(tx);
        });
    });
}

module.exports.GetPendingTransactionByDstAddress = function (dstAddress) {
   return GetPendingTransactionByDstAddress(dstAddress);
};

module.exports.GetRemoteTransactionById = function (id) {
    return new Promise(resolve => {
        RemoteTransaction.findById(id, function (error, tx) {
            resolve(tx);
        });
    });
};

function CreateLocalTransaction(newLocalTx) {
    return new Promise(resolve => {
        newLocalTx.created_at = Date.now();
        let newObj = new LocalTransaction(newLocalTx);
        newObj.save(function (err, tx) {
            resolve(tx);
        });
    });
}

module.exports.CreateLocalTransaction = function (newLocalTx) {
   return CreateLocalTransaction(newLocalTx)
};

function CreateRemoteTransaction(newRemoteTx) {
    return new Promise(resolve => {
        newRemoteTx.created_at = Date.now();
        let newObj = new RemoteTransaction(newRemoteTx);
        newObj.save(function (err, tx) {
            resolve(tx);
        });
    });
}

function GetRemoteTransactionByHashIndex(hash, index) {
    return new Promise(resolve => {
        RemoteTransaction.findOne({src_hash: hash, index}, function (error, transaction) {
            resolve(transaction);
        })
    });
}

module.exports.CreateRemoteTransaction = function (newRemoteTx) {
   return CreateLocalTransaction(newRemoteTx);
};

function UpdateLocalTransaction(localTx) {
    return new Promise(resolve => {
        localTx.save(function (err, tx) {
            resolve(tx);
        });
    });
}

module.exports.UpdateLocalTransaction = function (localTx) {
   return UpdateLocalTransaction(localTx);
};

module.exports.DeleteLocalTransaction = function (transactionId) {
    return new Promise(resolve => {
        LocalTransaction.find({_id: transactionId}).remove(function (err) {
            resolve(!err);
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
function SignTransactionRequest (inputs, outputs) {
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
}

function GetLocalTransactions (address, sort = null, offset = 0, limit = 10) {
    return new Promise(resolve => {
        let query = LocalTransaction.find({
            $or: [
                {src_addr: address},
                {
                    $and: [
                        {dst_addr: address},
                        {status: {'$ne': CONFIGS.LOCAL_TRANSACTION_STATUS.INIT}}
                    ]
                }
            ],
            status: {$ne: CONFIGS.LOCAL_TRANSACTION_STATUS.INVALID }
        }).skip(offset).limit(limit);

        if (sort) {
            query = query.sort({created_at: 'descending'});
        }

        query.exec(function (error, transactions) {
            if (!transactions) {
                resolve([]);
                return;
            }
            resolve(transactions);
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

        if (transaction.status === CONFIGS.LOCAL_TRANSACTION_STATUS.INVALID || transaction.status === CONFIGS.LOCAL_TRANSACTION_STATUS.INIT)
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
        RemoteTransaction.find({status: CONFIGS.REMOTE_TRANSACTION_STATUS.FREE}, function (error, transactions) {
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

        freeTransaction.status = CONFIGS.REMOTE_TRANSACTION_STATUS.USED;
        let updatedTransaction = await UpdateRemoteTransaction(freeTransaction);

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

    let inputs = [];
    for (let index in useResources) {
        let resource = useResources[index];
        let address = resource.dst_addr;

        let user = await UserService.GetUserByAddress(address);
        let key = {
            privateKey: user.private_key,
            publicKey: user.public_key,
        };

        let source = {
            referencedOutputHash: resource.src_hash,
            referencedOutputIndex: resource.index
        };

        inputs.push({source, key});
    }

    return {inputs, outputs}
}

/**
 * @return {boolean}
 */
module.exports.SendTransactionRequest = async function (srcAddress, dstAddress, amount) {
    let requestData = await BuildTransactionRequest(srcAddress, dstAddress, amount);
    let signedRequest = SignTransactionRequest(requestData.inputs, requestData.outputs);

    console.log(signedRequest);

    let url = CONFIGS.BLOCKCHAIN_API_URL + '/transactions';
    let requestResult = await UtilService.SendPostRequest(url, signedRequest);
    console.log(requestResult);
    if (requestResult.code === 'InvalidContent') {
        return false;
    }
    return true;
};

function GenerateKey() {
    return ursa.generatePrivateKey(1024, 65537);
}

function Hash(data) {
    let hash = crypto.createHash(HASH_ALGORITHM);
    hash.update(data);
    return hash.digest();
}

module.exports.GenerateAddress = function () {
    let privateKey = GenerateKey();
    let publicKey = privateKey.toPublicPem();
    return {
        privateKey: privateKey.toPrivatePem('hex'),
        publicKey: publicKey.toString('hex'),
        // Address is hash of public key
        address: Hash(publicKey).toString('hex')
    };
};

/**
 * @return {string}
 */
module.exports.Generate2FACode = function () {
    let length = 6;
    let str = "";
    for ( ; str.length < length; str += Math.random().toString( 36 ).substr( 2 ) );
    return str.substr( 0, length ).toUpperCase();
};

module.exports.GetLatestBlocks = async function (limit = 100) {
    let url = CONFIGS.BLOCKCHAIN_API_URL + `/blocks/?order=-1&limit=${limit}`;
    let blocks = await UtilService.SendGetRequest(url);
    return blocks;
};

module.exports.GetBlock = async function (blockId) {
    let url = CONFIGS.BLOCKCHAIN_API_URL + `/blocks/${blockId}`;
    let block = await UtilService.SendGetRequest(url);
    return block;
};

module.exports.SyncTransactions = async function (transactions, isInitAction = false) {
    for (let index in transactions) {
        let transaction = transactions[index];
        let outputs = transaction.outputs;
        let hash = transaction.hash;
        for (let outputIndex in outputs) {
            let output = outputs[outputIndex];
            let value = output.value;
            let lockScript = output.lockScript;
            let dstAddress = lockScript.split(" ")[1];

            // confirm pending transaction
            let pendingTransaction = await GetPendingTransactionByDstAddress(dstAddress);
            if (pendingTransaction) {
                pendingTransaction.remaining_amount = pendingTransaction.amount - value;
                pendingTransaction.status           = CONFIGS.LOCAL_TRANSACTION_STATUS.DONE;

                let updatedTransaction = await UpdateLocalTransaction(pendingTransaction);
                continue;
            }

            // sync new transaction
            let user = await UserService.GetUserByAddress(dstAddress);
            let existingRemoteTransaction = await GetRemoteTransactionByHashIndex(hash, outputIndex);
            if (!existingRemoteTransaction && user) {
                let remoteRemoteTransactionData = {
                    src_hash: hash,
                    index: outputIndex,
                    dst_addr: dstAddress,
                    amount: value,
                    status: CONFIGS.REMOTE_TRANSACTION_STATUS.FREE,
                };
                let newRemoteTransaction        = await CreateRemoteTransaction(remoteRemoteTransactionData);

                let localTransactionData = {
                    src_addr: '',
                    dst_addr: dstAddress,
                    amount: value,
                    remaining_amount: 0,
                    status: CONFIGS.LOCAL_TRANSACTION_STATUS.DONE,
                };
                let newLocalTransaction  = await CreateLocalTransaction(localTransactionData);
            }
        }
    }
};

/**
 * @return {number}
 */
module.exports.GetAvailableBalanceOfServer = async function () {
    let freeRemoteTransactions = await GetFreeRemoteTransactions();
    let balance = 0;
    for (let index in freeRemoteTransactions){
        let freeRemoteTransaction = freeRemoteTransactions[index];
        balance += freeRemoteTransaction.amount;
    }

    return balance;
};