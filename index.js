"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
var TempMail = require('tempmail.js');

var tmpEmail = 'juyahevah@p33.org';
var account = new TempMail(tmpEmail);

const restService = express();
restService.use(bodyParser.json());

var gRes = null;

var options = {
  headers: {
    "X-Cisco-Meraki-API-Key": "27fece4cac8304e262ee1ee81d27844096e7b2e4"
  }
};

restService.post("/", function (req, res) {
  console.log("hook request");
  try {
      if (req.body) {
          gRes = res;
          var requestBody = req.body;
          if (requestBody.result) {
            actOnAction(requestBody.result.action, requestBody);
          }
      }
  }
  catch (err) {
    console.error("Cannot process request", err);
    return res.status(400).json({
        status: {
            code: 400,
            errorType: err.message
        }
    });
  }
});

function actOnAction(action, body) {
  switch (action) {
    case 'orgsList':
      orgsList()
      break;
    case 'alertsList':
      break;
    default:
      break;
  }
}

function orgsList(){
  options.url = "https://dashboard.meraki.com/api/v0/organizations"
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var orgs = JSON.parse(body);
      var msg = "You are in the following organizations:\n"
      for (var x in orgs) {
        msg += x.name + "\n"
      }
      console.log("orgsList msg",msg);
      return gRes.json({
        speech: msg
        displayText: msg,
        source: 'dhanush-quakey'
      });
    }
  }
  request(options, callback);
}

function alertsList() {
  account
    .getMail()
    .then(raw_messages => {
      return raw_messages.map(msg => {
        return {
          id: msg.mail_id,
          user_id: msg.mail_address_id,
          from: msg.mail_from,
          subject: msg.mail_subject,
          content: msg.mail_text
        }
      })
    })
    .then(msgs => {
      gRes.json(msgs.map(msg => msg.subject));
    })
    .catch(error => {
      gRes.json('Getting alerts failed: ' + error)
    })
}

restService.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});