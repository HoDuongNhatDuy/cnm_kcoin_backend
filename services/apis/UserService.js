let bcrypt = require('bcryptjs');
let User   = require('../../models/User');

module.exports.CreateUser = function (newUser) {
    return new Promise(resolve => {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(newUser.password, salt, function (err, hash) {
                newUser.password = hash;
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

module.exports.GetUserById = function (id) {
    return new Promise(resolve => {
        User.findById(id, function (error, user) {
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