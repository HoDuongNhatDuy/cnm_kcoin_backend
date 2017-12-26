let express = require('express');
let router = express.Router();
// let jwt = require('express-jwt');
// let jwks = require('jwks-rsa');
let configs = require('../configs');

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

module.exports = router;
