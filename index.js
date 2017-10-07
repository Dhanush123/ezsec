"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");

const restService = express();
restService.use(bodyParser.json());

gRes = null

var options = {
  headers: {
    "X-Cisco-Meraki-API-Key": "27fece4cac8304e262ee1ee81d27844096e7b2e4"
  }
};

restService.post("/", function (req, res) {
  console.log("hook request");
  try {
      if (req.body) {
          gRes = res
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
      for x in orgs:
        msg += x.name + "\n"
      gRes.json(msg);
    }
  }
  request(options, callback);
}

restService.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});