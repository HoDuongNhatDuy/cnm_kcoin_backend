let mongoose = require('mongoose');

let UserSchema = new mongoose.Schema(
    {
        email: {type: String},
        password: {type: String},
        is_active: {type: Number},
        access_token: {type: String},
        expired_at: {type: Number}
    }
);

let User = module.exports = mongoose.model('User', UserSchema, 'users');