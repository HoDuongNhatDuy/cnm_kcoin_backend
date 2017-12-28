let mongoose = require('mongoose');

let LocalTransactionSchema = new mongoose.Schema(
    {
        src_address: {type: String, required: true},
        dest_address: {type: String, required: true},
        amount: {type: Number},
        remaining_amount: {type: String},
        status: {type: Number}
    }
);

let LocalTransaction = module.exports = mongoose.model('LocalTransaction', LocalTransactionSchema, 'local_transactions');