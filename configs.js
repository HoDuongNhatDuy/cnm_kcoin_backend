module.exports = {
    MONGO_DB: {
        // CONNECTION_STRING: 'mongodb://localhost:27017/kcoin_db_test',
        // USERNAME: '',
        // PASSWORD: '',
        CONNECTION_STRING: 'mongodb://ds135537.mlab.com:35537/kcoin',
        USERNAME: 'duyho',
        PASSWORD: 'duyho',
    },
    BLOCKCHAIN_API_URL: 'https://api.kcoin.club',
    EMAIL: {
        HOST: 'mail.smtp2go.com',
        PORT: 2525,
        SENDER: 'smtpusername3@mail.smtp2go.com',
        AUTH: {
            USER: 'smtpusername3',
            PASS: 'aXNwOGgzemRuaHMw'
        }
    },
    LOCAL_TRANSACTION_STATUS: {
        PENDING: 'pending',
        DONE: 'done',
        INVALID: 'invalid',
        INIT: 'init'
    },
    REMOTE_TRANSACTION_STATUS: {
        USED: 'used',
        FREE: 'free',
    },
    BALANCE_TYPE: {
        AVAILABLE: 'available',
        ACTUAL: 'actual'
    }
};