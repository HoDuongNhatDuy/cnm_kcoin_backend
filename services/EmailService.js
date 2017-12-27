let nodemailer   = require('nodemailer');
let CONFIGS      = require('../configs');

let configString = `smtps://${CONFIGS.EMAIL.AUTH.USER}:${CONFIGS.EMAIL.AUTH.PASS}@${CONFIGS.EMAIL.HOST}/?pool=true`;
let emailTransporter = nodemailer.createTransport(configString);

exports.SendEmail = function (emailOption) {
  return new Promise(resolve => {
      emailTransporter.sendMail(emailOption, function (error, info) {
          if (error){
              resolve(false);
          }
          else {
              resolve(true);
          }
      });
  })
};