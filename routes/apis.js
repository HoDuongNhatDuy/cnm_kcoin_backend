let express = require('express');
let router = express.Router();
let AuthController = require('../controllers/apis/AuthController');
let DashboardController = require('../controllers/apis/DashboardController');
let TransactionController = require('../controllers/apis/TransactionController');
let UserController = require('../controllers/apis/UserController');
let TransactionService = require('../services/apis/TransactionService');
let UtilService = require('../services/UtilService');
let UserService = require('../services/apis/UserService');

router.get('/', async function (req, res, next) {
    res.json({
        status: 1,
        message: 'Welcome to KCoin API',
    });
});

async function authCheck(req, res, next) {
    let token = req.headers.authorization;
    let user = await UserService.GetUserByAccessToken(token);
    if (!user || user.expired_at < Date.now()) {
        res.json({
            status: -1,
            message: 'Your session has expired!'
        });
        return;
    }
    next(user);
}

async function adminAuthCheck(req, res, next) {
    let token = req.headers.authorization;
    if (!token) {
        res.json({
            status: -1,
            message: 'Access is denied'
        });
        return;
    }
    let user = await UserService.GetUserByAccessToken(token);
    if (!user || user.expired_at < Date.now()) {
        res.json({
            status: -1,
            message: 'Your session has expired!'
        });
        return;
    }
    if (!user.is_admin){
        res.json({
            status: -1,
            message: 'Access is denied'
        });
        return;
    }

    next();
}

router.post('/register', AuthController.Register);
router.get('/activate/:userId', AuthController.Active);
router.post('/login', AuthController.Login);
router.post('/send-activate-email', AuthController.SendActiveEmail);
router.post('/send-reset-password-email', AuthController.SendResetPasswordEmail);
router.post('/reset-password', AuthController.ResetPassword);

router.get('/get-dashboard-info', authCheck, DashboardController.GetDashboardInfo);
router.get('/get-transactions/', authCheck, TransactionController.GetTransactions);
router.post('/create-transaction', authCheck, TransactionController.CreateTransaction);
router.get('/send-create-transaction-confirmation-email/:transactionId', authCheck, TransactionController.SendCreateTransactionConfirmationEmail);
router.post('/confirm-transaction', authCheck, TransactionController.ConfirmTransaction);
router.get('/delete-transaction/:transactionId', authCheck, TransactionController.DeleteTransaction);

router.get('/sync-latest-blocks', TransactionController.SyncLatestBlocks);
router.get('/sync-block/:blockId', TransactionController.SyncBlock);

router.get('/generate-admin-data', AuthController.GenerateAdminData);
router.get('/admin/balances', adminAuthCheck, DashboardController.GetAdminBalance);
router.get('/admin/users', adminAuthCheck, UserController.GetUsersInfo);
router.get('/admin/users/:id', adminAuthCheck, UserController.GetUserTransactions);
router.get('/admin/transactions', adminAuthCheck, TransactionController.GetAllRemoteTransactions);

module.exports = router;