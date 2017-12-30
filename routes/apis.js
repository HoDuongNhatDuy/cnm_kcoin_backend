let express = require('express');
let router = express.Router();
// let jwt = require('express-jwt');
// let jwks = require('jwks-rsa');
let CONFIGS = require('../configs');
let AuthController = require('../controllers/apis/AuthController');
let TransactionService = require('../services/apis/TransactionService');

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

router.get('/', async function (req, res, next) {

    // CREATE TRANSACTION REQUEST
    // let inputs = [
    //     {
    //         source: {
    //             referencedOutputHash: '2a68277346418c850a2fcbcfc059d486222689fab237f1b20fe20c8b41a84d9b',
    //             referencedOutputIndex: 0
    //         },
    //         key: {
    //             privateKey: '2d2d2d2d2d424547494e205253412050524956415445204b45592d2d2d2d2d0a4d4949435867494241414b426751445050496c394d386d7454572b32746e31594b3648726a4f304d4e704f534a36554b77333354394c48532b52426165575a310a6a36576452633961596e444f666f367578743764656779424467797062464e3859354f674f66454179695644316b47775970685a353548793078396b664c4f420a7a44644c437952636a4b35507651686b596e42487a2b73446e345151615a4252483251596757796a74574e4a3269564447546e726434433450514944415141420a416f47415231703771473039596e7449484b7747796d587a6b577672626f6f5945336d732f4f44456f5563654e78726b67354a4c4d65307377394c3269784e620a37653172615567324569486b7a6b617447325364396a552b3759777466306b3773634262674856657a3962694a3767427a686c4363515753755879323177734f0a6b74436950496b672f536e72715755686f4c686c39673871593056514b3553532b3938527551785369524b41435330435151443254544a4b534f6f36566a44360a645a3038526a67676c74732b3939772f5663366b4a46426657535a48794438347a35563668347a465130784e5a364e4e2f7961567938514c4b6a2f36634e596e0a6e69534855556254416b45413132574e4a4e6e78384258724d6e5763483638734f5a6e623151424b7831332f4a67594e52484a67644d7653717a2f786233766f0a7631532f444d474a547576302b634a676277472f307778687a5738626578533672774a4241496f4e7a776877516b6d636b6974777a5564426e4b6733706f42750a385a625767394c68502b4f523172455a66735a624a452f66746e6e444e5075574161547752544a6c576d646673536978496e686d5864637a4b5630435151444d0a47326a53494d7848367831435a58775a386736415472476e6432316b326b64724b7054723555354e6e733730673955764255575a2b4a354a59695051363372710a4b537a6b51383459475557634f387259714e3331416b45417a2f307841567a7a52564b3643587954345974564a614734383749623951527342772f5774594a5a0a553839484f412f492b5136342f496956624452357246743448782b4d387435384168436e5761575a4f736d4e79773d3d0a2d2d2d2d2d454e44205253412050524956415445204b45592d2d2d2d2d0a',
    //             publicKey: '2d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d4947664d413047435371475349623344514542415155414134474e4144434269514b426751445050496c394d386d7454572b32746e31594b3648726a4f304d0a4e704f534a36554b77333354394c48532b52426165575a316a36576452633961596e444f666f367578743764656779424467797062464e3859354f674f6645410a79695644316b47775970685a353548793078396b664c4f427a44644c437952636a4b35507651686b596e42487a2b73446e345151615a4252483251596757796a0a74574e4a3269564447546e726434433450514944415141420a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a'
    //         }
    //     },
    //     {
    //         source: {
    //             referencedOutputHash: '4225e689306c6f2f7681b71e33d9c3f27ef30d51ab87949fb91220783f97d4d4',
    //             referencedOutputIndex: 0
    //         },
    //         key: {
    //             privateKey: '2d2d2d2d2d424547494e205253412050524956415445204b45592d2d2d2d2d0a4d4949435867494241414b426751445050496c394d386d7454572b32746e31594b3648726a4f304d4e704f534a36554b77333354394c48532b52426165575a310a6a36576452633961596e444f666f367578743764656779424467797062464e3859354f674f66454179695644316b47775970685a353548793078396b664c4f420a7a44644c437952636a4b35507651686b596e42487a2b73446e345151615a4252483251596757796a74574e4a3269564447546e726434433450514944415141420a416f47415231703771473039596e7449484b7747796d587a6b577672626f6f5945336d732f4f44456f5563654e78726b67354a4c4d65307377394c3269784e620a37653172615567324569486b7a6b617447325364396a552b3759777466306b3773634262674856657a3962694a3767427a686c4363515753755879323177734f0a6b74436950496b672f536e72715755686f4c686c39673871593056514b3553532b3938527551785369524b41435330435151443254544a4b534f6f36566a44360a645a3038526a67676c74732b3939772f5663366b4a46426657535a48794438347a35563668347a465130784e5a364e4e2f7961567938514c4b6a2f36634e596e0a6e69534855556254416b45413132574e4a4e6e78384258724d6e5763483638734f5a6e623151424b7831332f4a67594e52484a67644d7653717a2f786233766f0a7631532f444d474a547576302b634a676277472f307778687a5738626578533672774a4241496f4e7a776877516b6d636b6974777a5564426e4b6733706f42750a385a625767394c68502b4f523172455a66735a624a452f66746e6e444e5075574161547752544a6c576d646673536978496e686d5864637a4b5630435151444d0a47326a53494d7848367831435a58775a386736415472476e6432316b326b64724b7054723555354e6e733730673955764255575a2b4a354a59695051363372710a4b537a6b51383459475557634f387259714e3331416b45417a2f307841567a7a52564b3643587954345974564a614734383749623951527342772f5774594a5a0a553839484f412f492b5136342f496956624452357246743448782b4d387435384168436e5761575a4f736d4e79773d3d0a2d2d2d2d2d454e44205253412050524956415445204b45592d2d2d2d2d0a',
    //             publicKey: '2d2d2d2d2d424547494e205055424c4943204b45592d2d2d2d2d0a4d4947664d413047435371475349623344514542415155414134474e4144434269514b426751445050496c394d386d7454572b32746e31594b3648726a4f304d0a4e704f534a36554b77333354394c48532b52426165575a316a36576452633961596e444f666f367578743764656779424467797062464e3859354f674f6645410a79695644316b47775970685a353548793078396b664c4f427a44644c437952636a4b35507651686b596e42487a2b73446e345151615a4252483251596757796a0a74574e4a3269564447546e726434433450514944415141420a2d2d2d2d2d454e44205055424c4943204b45592d2d2d2d2d0a'
    //         }
    //     },
    // ];
    //
    // let outputs = [
    //     {
    //         address: 'aa5f720c8080d81b9bd9781bf85c38c4d24cc010d0536e667f169ac8a5eb72d0',
    //         value: 152380
    //     },
    //     {
    //         address: '14c68e95b1238c97bdf3d777611e296c3246765ba95533fdde5a40e275f627f2',
    //         value: 10000
    //     }
    // ];
    //
    // let request = TransactionService.SignTransactionRequest(inputs, outputs);

    // $x = await TransactionService.CreateLocalTransaction({
    //     src_address: '888',
    //     dst_address: '456',
    //     amount: 12,
    //     remaining_amount: ,
    //     status: 'pending'
    // });

    // GET BALANCE
    // $x = await TransactionService.GetBalance('456', CONFIGS.BALANCE_TYPE.ACTUAL);

    res.json({
        status: 1,
        message: 'Welcome to KCoin API',
        // data: $x
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

router.get('/get-dashboard-info', async function (req, res, next) {
    let address = reg.params.address;
    $available = await TransactionService.GetBalance(address, 'available');
    $actual = await TransactionService.GetBalance(address, 'actual');
    $recent = await TransactionService.GetLocalTransactions(address, true, 0, 10);
    if (!$actual || !$available) res.status(500);
    res.json({
        available: $available,
        actual: $actual,
        transactions: $recent
    });
});

router.get('/get-transactions-bounded', async function (req, res, next) {
    $result = await TransactionService.GetLocalTransactions(req.params.address, null, 
        req.params.offset, req.params.limit);
    res.json({
        transactions: $result
    });
});

router.post('/register', AuthController.Register);
router.get('/activate/:userId', AuthController.Active);
router.post('/login', AuthController.Login);
router.post('/send-activate-email', AuthController.SendActiveEmail);

module.exports = router;