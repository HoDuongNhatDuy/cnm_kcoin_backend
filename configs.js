module.exports = {
    MONGO_DB_CONNECTION_STRING: 'mongodb://localhost:27017/kcoin_db_test',
    BLOCKCHAIN_API_URL: 'https://api.kcoin.club',
    EMAIL: {
        HOST: 'mail.smtp2go.com',
        PORT: 2525,
        SENDER: 'smtpusername1@mail.smtp2go.com',
        AUTH: {
            USER: 'smtpusername1',
            PASS: 'd201c3h3c3VtdDAw'
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