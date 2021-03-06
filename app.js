let express      = require('express');
let path         = require('path');
let favicon      = require('serve-favicon');
let logger       = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser   = require('body-parser');
let cors         = require('cors');
let mongoose     = require('mongoose');
let index        = require('./routes/index');
let apis         = require('./routes/apis');
let CONFIGS      = require('./configs');

let app = express();

mongoose.connect(CONFIGS.MONGO_DB.CONNECTION_STRING, {
    useMongoClient: true,
    user: CONFIGS.MONGO_DB.USERNAME,
    pass: CONFIGS.MONGO_DB.PASSWORD,
});
mongoose.set("debug", true);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/api', apis);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    let err    = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error   = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
