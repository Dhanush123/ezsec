"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
var TempMail = require("tempmail.js");

var tmpEmail = "juyahevah@p33.org";
var account = new TempMail(tmpEmail);

const restService = express();
restService.use(bodyParser.json());

var options = {
  headers: {
    "X-Cisco-Meraki-API-Key": "27fece4cac8304e262ee1ee81d27844096e7b2e4"
  }
};

restService.post("/", function (req, res) {
  console.log("hook request");
  try {
    if (req.body) {
      var requestBody = req.body;
      if (requestBody.result) {
        actions[requestBody.result.action](res);
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

var actions = {
  orgsList, alertsList
}

function orgsList(res) {
  options.url = "https://dashboard.meraki.com/api/v0/organizations"
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var orgs = JSON.parse(body);
      var msg = "You are in the following organizations:\n";
      console.log("orgsList orgs",orgs);
      for (var x of orgs) {
        msg += x.name + "\n"
      }
      console.log("orgsList msg",msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    }
  }
  request(options, callback);
}

function alertsList(res) {
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
      res.json({
        speech: JSON.stringify(msgs.map(msg => msg.subject), null, 2),
        displayText: JSON.stringify(msgs.map(msg => msg.subject), null, 2)
      });
    })
    .catch(error => {
      res.json({
        status: {
          code: 400,
          errorType: "Getting alerts failed: " + error
        }
      })
    })
}

restService.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});