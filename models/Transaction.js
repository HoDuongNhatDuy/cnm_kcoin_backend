let mongoose = require('mongoose');

let LocalTransactionSchema = new mongoose.Schema(
    {
        src_address: {type: String, required: true},
        dest_address: {type: String, required: true},
        amount: {type: Number},
        remaining_amount: {type: Number},
        status: {type: Number}
    }
);

let LocalTransaction = module.exports = mongoose.model('LocalTransaction', LocalTransactionSchema, 'local-transactions');

let RemoteTransactionSchema = new mongoose.Schema(
    {
        src_hash: {type: String},
        index: {type: Number},
        dst_addr: {type: String},
        amount: {type: Number},
        status: {type: String}
    }
);

let RemoteTransaction = module.exports = mongoose.model('RemoteTransaction', RemoteTransactionSchema, 'remote-transactions');