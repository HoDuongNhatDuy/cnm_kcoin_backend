let mongoose = require('mongoose');

let RemoteTransactionSchema = new mongoose.Schema(
    {
        src_hash: {type: String},
        index: {type: Number},
        dst_addr: {type: String},
        amount: {type: Number},
        status: {type: String},
        created_at: {type: String}
    }
);

module.exports = mongoose.model('RemoteTransaction', RemoteTransactionSchema, 'remote_transactions');