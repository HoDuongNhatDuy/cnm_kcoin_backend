let mongoose = require('mongoose');

let LocalTransactionSchema = new mongoose.Schema(
    {
        src_addr: {type: String, required: true},
        dst_addr: {type: String, required: true},
        amount: {type: Number},
        remaining_amount: {type: Number},
        status: {type: String}
    }
);

module.exports = mongoose.model('LocalTransaction', LocalTransactionSchema, 'local_transactions');
