const request = require('request');

module.exports.SendPostRequest = function (url, data) {
    return new Promise(resolve => {
        let options = {
            uri: url,
            method: 'POST',
            json: data
        };
        request(options, function (error, response, body) {
            resolve(body);
        });
    });
};

module.exports.SendGetRequest = function (url) {
    return new Promise(resolve => {
        let options = {
            uri: url,
            method: 'GET',
            json: true
        };
        request(options, function (error, response, body) {
            resolve(body);
        });
    });
};