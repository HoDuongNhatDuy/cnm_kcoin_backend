let bcrypt = require('bcryptjs');
let User   = require('../../models/User');
let TransactionService   = require('../../services/apis/TransactionService');

module.exports.CreateUser = function (newUser) {
    return new Promise(resolve => {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(newUser.password, salt, function (err, hash) {

                let addressData = TransactionService.GenerateAddress();

                newUser.password = hash;
                newUser.address  = addressData.address;
                newUser.private_key  = addressData.privateKey;
                newUser.public_key  = addressData.publicKey;
                newUser.save(function (err, user) {
                    resolve(user);
                });
            });
        });
    });
};

module.exports.UpdateUser = function (user, newUser) {
    return new Promise(resolve => {
        bcrypt.genSalt(10, function (err, salt) {
            if (newUser.password.length == 0) {
                delete newUser.password;
                user.update(newUser, function (error, user) {
                    resolve(user);
                });
            }
            else {
                bcrypt.hash(newUser.password, salt, function (err, hash) {
                    newUser.password = hash;
                    user.update(newUser, function (error, user) {
                        resolve(user);
                    });
                });
            }
        });
    });
};


module.exports.GetUserByEmail = function (email) {
    return new Promise(resolve => {
        let query = {email: email};
        User.findOne(query, function (error, user) {
            resolve(user)
        });
    });
};

module.exports.GetUserByAccessToken = function (accessToken) {
    return new Promise(resolve => {
        let query = {access_token: accessToken};
        User.findOne(query, function (error, user) {
            resolve(user)
        });
    });
};

module.exports.GetUserById = function (id) {
    return new Promise(resolve => {
        User.findById(id, function (error, user) {
            resolve(user);
        });
    });
};

module.exports.GetUserByAddress = function (address) {
    return new Promise(resolve => {
        User.findOne({address}, function (error, user) {
            resolve(user);
        });
    });
};

module.exports.ComparePassword = function (candidatePassword, hash) {
    return new Promise(resolve => {
        bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
            resolve(isMatch);
        });
    });
};

/**
 * @return {string}
 */
module.exports.GenerateToken = function () {
    let text     = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 64; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};