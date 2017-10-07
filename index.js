'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const restService = express();
restService.use(bodyParser.json());

restService.post('/', function (req, res) {
  console.log('hook request');
  try {
      if (req.body) {
          var requestBody = req.body;
          if (requestBody.result) {
            if (requestBody.result.action == "ADD INTENT HERE") {
            }
          }
      }
  }
  catch (err) {
    console.error('Cannot process request', err);
    return res.status(400).json({
        status: {
            code: 400,
            errorType: err.message
        }
    });
  }
});


restService.listen((process.env.PORT || 8000), function () {
  console.log('Server listening');
});