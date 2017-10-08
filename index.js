"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
var TempMail = require("tempmail.js");

var tmpEmail = "juyahevah@p33.org";
var account = new TempMail(tmpEmail);

var axios = require('axios');

var dashboard_client = axios.create({
  baseURL: 'https://dashboard.meraki.com/api/v0/',
  headers: {"X-Cisco-Meraki-API-Key": "27fece4cac8304e262ee1ee81d27844096e7b2e4"}
});

const restService = express();
restService.use(bodyParser.json());

const baseUrl = "https://dashboard.meraki.com";
var options = {
  headers: {
    "X-Cisco-Meraki-API-Key": "27fece4cac8304e262ee1ee81d27844096e7b2e4"
  },
};

restService.post("/", function (req, res) {
  console.log("hook request");
  try {
    if (req.body) {
      var requestBody = req.body;
      if (requestBody.result && Object.keys(requestBody.result.parameters).length == 0) {
        actions[requestBody.result.action](res);
      }
      else { //requestBody.result probably there, deals w/ params here
        actions[requestBody.result.action](res, requestBody.result.parameters);
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
  orgsList, alertsList, networksList, devicesList, adminsFind, topTraffic
}

function orgsList(res) {
  options.url = baseUrl + "/api/v0/organizations";
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
    else {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
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
        speech: JSON.stringify(msgs/*.map(msg => msg.subject)*/, null, 2),
        displayText: JSON.stringify(msgs/*.map(msg => msg.subject)*/, null, 2)
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

function networksList(res){
  options.url = baseUrl + "/api/v0/organizations/549236/networks";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var networks = JSON.parse(body);
      var msg = "Your organization has the networks:\n";
      console.log("networksList networks", networks);
      for (var x of networks) {
        msg += x.name + "\n"
      }
      console.log("networksList msg", msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    }
    else {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
      });
    }
  }
  request(options, callback);
}

function devicesList(res) {
  options.url = baseUrl + "/api/v0/networks/N_646829496481140676/devices";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var devices = JSON.parse(body);
      var msg = "Your network, Cal Hackz - wireless, has these devices:\n";
      console.log("devicesList devices", devices);
      for (var x of devices) {
        var add_str = x.name != null ? x.name : x.model;
        msg += add_str + "\n"
      }
      console.log("devicesList msg", msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    }
    else {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
      });
    }
  }
  request(options, callback);
}

function adminsFind(res) {
  options.url = baseUrl + "/api/v0/organizations/549236/admins";
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var people = JSON.parse(body);
      var msg = "Your organization, Meraki Live Sandbox, has the following admins:\n";
      console.log("adminsFinds people", people);
      var i = 0;
      for (var x of people) {
        if (i < 10){
          msg += x.name + " - " + x.email + "\n";
        }
        else {
          break;
        }
        i += 1;
      }
      console.log("adminsFind msg", msg);
      console.log("str length",msg.length);
      return res.json({
        speech: msg,
        displayText: msg
      });
    }
    else {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
      });
    }
  }
  request(options, callback);
}

function topTraffic(res, params) {
  options.url = baseUrl + "/api/v0/networks/N_646829496481140676/traffic?timespan="+(params.hours*3600);
  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var traffic = JSON.parse(body);
      var top_traffic = []
      var msg = "Your network, Cal Hackz - wireless, has the following sites/apps in Top 10 Traffic:\n";
      console.log("topTraffic traffic", traffic);
      for (var x of traffic) {
        if (top_traffic.length < 10) {
          top_traffic.push({source: x.destination, time: x.activeTime});
        }
        else {
          for (var i = 0; i < top_traffic.length; i++){
            if (x.activeTime > top_traffic[i]) {
              top_traffic[i] = {source: x.destination, time: x.activeTime};
            }
          }
        }
      }

      function compare(a, b) {
        return a.time - b.time;
      }
      top_traffic.sort(compare);
      for (var i = 0; i < top_traffic.length; i++){
        msg += top_traffic[i].destination + ": " + top_traffic[i].time + " hour(s)\n";
      }
      console.log("topTraffic msg", msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    }
    else {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
      });
    }
  }
  request(options, callback);
}

/*function dataUsageStats(res, params) {
  let network_id = 'N_646829496481140676';
  dashboard_client
    .get(`/networks/${network_id}/devices`)
    .then(res => res.data)
    .then(data => {
      return data.map(item => item.serial)
    })
    .then(serials => {
      Promise.all(serials.map(serial => dashboard_client.)).then(values => {
        console.log(values); // [3, 1337, "foo"]
      });


    })
    .catch(err => console.log(err.response.data))

}*/

restService.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});