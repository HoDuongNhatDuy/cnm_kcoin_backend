let User         = require('../../models/User');
let UserService  = require('../../services/apis/UserService');
let EmailService = require('../../services/EmailService');
let CONFIGS      = require('../../configs');

exports.Register = async function (req, res, next) {
    try {
        let email    = req.body.email;
        let password = req.body.password;

        let existingUser = await UserService.GetUserByEmail(email);
        if (existingUser) {
            res.json({
                status: 0,
                message: 'This email address is already used!'
            });
            return;
        }

        let userData = new User({email, password, is_active: 0, is_admin: 0});

        let newUser = await UserService.CreateUser(userData);

        if (!newUser) {
            res.json({
                status: 0,
                message: 'Failed to register new user!'
            });
            return;
        }

        res.json({
            status: 1,
            message: 'User was successfully registered!'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e
        });
    }
};

exports.SendActiveEmail = async function (req, res, next) {
    try {
        let email       = req.body.email;
        let redirectURL = req.body.redirect_url;

        let user = await UserService.GetUserByEmail(email);
        if (!user) {
            res.json({
                status: 0,
                message: 'User not found!'
            });
            return;
        }

        userId          = user.id;
        let mailOptions = {
            from: `KCoin <${CONFIGS.EMAIL.SENDER}>`,
            to: email,
            subject: 'KCoin Account Activation',
            html: `Welcome to KCoin. <b><a href="${redirectURL}/${userId}">Click here to activate your account</a></b>`
        };
        console.log(mailOptions);
        let sendEmailResult = await EmailService.SendEmail(mailOptions);
        if (sendEmailResult) {
            res.json({
                status: 1,
                message: 'An activation email has been sent to the email address you provided.'
            });
        }
        else {
            res.json({
                status: 0,
                message: 'Unknown error!'
            });
        }
    }
    catch (e) {
        res.json({
            status: 0,
            message: e
        });
    }
};

exports.Active = async function (req, res, next) {
    try {
        let userId = req.params.userId;

        let user = await UserService.GetUserById(userId);
        if (!user) {
            res.json({
                status: 0,
                message: 'User not found!'
            });
            return;
        }

        user.is_active = 1;
        user.save();

        res.json({
            status: 1,
            message: 'Your account has been successfully activated.'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e
        });
    }

};

exports.Login = async function (req, res, next) {
    try {
        let email    = req.body.email;
        let password = req.body.password;

        let user = await UserService.GetUserByEmail(email);
        if (!user) {
            res.json({
                status: 0,
                message: 'User not found!'
            });
            return;
        }

        if (user.is_active == 0) {
            res.json({
                status: 0,
                message: 'This user account has not been activated yet!'
            });
            return;
        }

        let compareResult = await UserService.ComparePassword(password, user.password);
        if (!compareResult) {
            res.json({
                status: 0,
                message: 'Password does not match!'
            });
            return;
        }

        let token         = UserService.GenerateToken();
        let expiredAt     = Date.now() + 60 * 60 * 1000;
        user.access_token = token;
        user.expired_at   = expiredAt;
        user.save();
        res.json({
            status: 1,
            message: 'Logged in successfully.',
            data: {
                access_token: token,
                expired_at: expiredAt,
                email: email,
                address: user.address
            }
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e
        });
    }

};

exports.SendResetPasswordEmail = async function (req, res, next) {
    try {
        let email       = req.body.email;
        let redirectURL = req.body.redirect_url;

        let user = await UserService.GetUserByEmail(email);
        if (!user) {
            res.json({
                status: 0,
                message: 'User not found!'
            });
            return;
        }

        userId          = user.id;
        let mailOptions = {
            from: `KCoin <${CONFIGS.EMAIL.SENDER}>`,
            to: email,
            subject: 'KCoin - Reset Password',
            html: `Welcome to KCoin. <b><a href="${redirectURL}/${userId}">Click here to reset password</a></b>`
        };
        let sendEmailResult = await EmailService.SendEmail(mailOptions);
        if (sendEmailResult) {
            res.json({
                status: 1,
                message: 'An email has been sent to the email address you provided.'
            });
        }
        else {
            res.json({
                status: 0,
                message: 'Unknown error!'
            });
        }
    }
    catch (e) {
        res.json({
            status: 0,
            message: e
        });
    }
};

exports.ResetPassword = async function (req, res, next) {
    try {
        let userId       = req.body.user_id;
        let password     = req.body.password;
        let user = await UserService.GetUserById(userId);
        if (!user) {
            res.json({
                status: 0,
                message: 'User not found!'
            });
            return;
        }

        let updatedUser = UserService.UpdateUser(user, {password});
        if (!updatedUser) {
            res.json({
                status: 0,
                message: 'Fail to reset password!'
            });
            return;
        }
        res.json({
            status: 1,
            message: 'Your password has been changed.'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};

exports.GenerateAdminData = async function (req, res, next) {
    try {
        let email    = 'kcoin@mailinator.com';
        let password = '123456';

        let user = await UserService.GetUserByEmail(email);
        if (user) {
            await UserService.DeleteUserById(user._id);
        }

        let userData = new User({email, password, is_active: 1, is_admin: 1});
        let newUser = await UserService.CreateUser(userData);
        if (!newUser) {
            //noinspection ExceptionCaughtLocallyJS
            throw Error("Failed to create user")
        }

        res.json({
            status: 1,
            message: 'Admin data has been generated successfully'
        });
    }
    catch (e) {
        res.json({
            status: 0,
            message: e.message
        });
    }
};