let express = require('express');
let router = express.Router();
// let jwt = require('express-jwt');
// let jwks = require('jwks-rsa');
let CONFIGS = require('../configs');
let AuthController = require('../controllers/apis/AuthController');

// const jwtCheck = jwt({
//     secret: jwks.expressJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: configs.JWT.JWKS_URI
//     }),
//     audience: configs.JWT.AUDIENCE,
//     issuer: configs.JWT.ISSUER,
//     algorithms: ['RS256']
// });

router.get('/', function(req, res, next) {
  res.json({
      status: 1,
      message: 'Welcome to KCoin API'
  });
});

// router.get('/test-auth', jwtCheck, function (req, res, next) {
//     res.json({
//         status: 1,
//         message: 'Test auth'
//     });
// });

function authCheck(req, res, next) {

}

router.post('/register', AuthController.Register);
router.get('/activate/:userId', AuthController.Active);
router.post('/login', AuthController.Login);
router.post('/send-activate-email', AuthController.SendActiveEmail);

module.exports = router;
