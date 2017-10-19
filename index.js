"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const TempMail = require("tempmail.js");
const dashboard = require('node-meraki-dashboard')('27fece4cac8304e262ee1ee81d27844096e7b2e4');

const tmpEmail = "ticuleyire@p33.org";
const account = new TempMail(tmpEmail);

const axios = require('axios');

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

var isSpark = false;

restService.post("/", function (req, res) {
  console.log("hook request");
  try {
    if (req.body) {
      var requestBody = req.body;
      var chatSource = requestBody.originalRequest.source;
      isSpark = (chatSource == "spark");
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
  orgsList, alertsList, networksList, devicesList, adminsFind, topTraffic, dataUsage, blockSite
}

function orgsList(res) {
  dashboard.organizations.list()
    .then(orgs => {
      var msg = "You are in the following organizations:\n";
      console.log("orgsList orgs\n",orgs);
      msg += orgs.map(org => org.name).join('\n');
      console.log("orgsList msg\n",msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    })
    .catch(error => {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
      });
    });
  /*options.url = baseUrl + "/api/v0/organizations";
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
  request(options, callback);*/
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
  dashboard.networks.list(549236)
    .then(networks => {
      var msg = "Your organization has the networks:\n";
      console.log("networksList networks\n", networks);
      msg += networks.map(network => network.name).join('\n');
      console.log("networksList msg\n", msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    })
    .catch(error => {
      return res.json({
        speech: JSON.stringify(error),
        displayText: JSON.stringify(error)
      });
    });

  /*options.url = baseUrl + "/api/v0/organizations/549236/networks";
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
  request(options, callback);*/
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
          top_traffic.push({ app: x.application, source: x.destination, time: x.activeTime, numClients: x.numClients });
        }
        else {
          for (var i = 0; i < top_traffic.length; i++){
            if (x.activeTime > top_traffic[i].activeTime) {
              top_traffic[i] = { app: x.application, source: x.destination, time: x.activeTime, numClients: x.numClients };
              break;
            }
          }
        }
      }

      function compare(a, b) {
        return a.time - b.time;
      }
      top_traffic.sort(compare);

      for (var i = 0; i < top_traffic.length; i++){
        msg += top_traffic[i].source + ": " + top_traffic[i].time + " hours\n";
      }

      console.log("topTraffic msg", msg);

      var params = '';

      var cat = [];
      var val = [];
      for (var i = 1; i <= 5; i++){
        params += 'cat' + i + '=' + top_traffic[i - 1].source + '&';
        params += 'val' + i + '=' + top_traffic[i - 1].time + '&';
      }

      var imageUrl = 'http://ezviz.paperplane.io/pie.html?' + params;

      msg += imageUrl;

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

function dataUsage(res, params) {
  let network_id = 'N_646829496481140676';
  let hours = params.hours.amount;

  dashboard_client
    .get(`/networks/${network_id}/devices`)
    .then(res => {
      console.log(res.data.length);
      return res.data
    })
    .then(data => {
      console.log('init_map');
      return data.map(item => item.serial).slice(0, 10)
    })
    .then(serials => {
      var seconds = hours * 60 * 60;
      console.log('serial');
      return pMapSeries(serials, cereal => dashboard_client.get(`/devices/${cereal}/clients?timespan=${seconds}`))
    })
    .then(raw_results => {
      console.log(raw_results.length);
      console.log('raw');
      return raw_results.map(rres => {
        console.log(typeof rres);
        return {
          sent: rres.usage.sent,
          received: rres.usage.recv,
          total: rres.usage.sent + rres.usage.recv
        }
      })
    })
    .then(final_results => {
      console.log('final')
      var total_results = final_results.reduce((sum, value) => {
        return {
          sent: sum.sent + value.sent,
          received: sum.received + value.received,
          total: sum.total + value.total
        };
      });

      console.log(final_results);
      var final_spoken_msg = `The overall data usage over ${hours} hours is or ${total_results.total / 1024.0} megabytes. On average, most clients use about ${total_results.total / 1024.0 / hours} megabytes per hour.`
      var final_display_msg =
        `Overall Data Usage over ${hours} hours: ${total_results.total / 1024.0} MB\n` +
        `Average Data Usage over ${hours} hours: ${total_results.total / 1024.0 / hours} MB/hr`;
      res.json({
        speech: final_spoken_msg,
        displayText: final_display_msg
      })
    })
    .catch(error => {
      res.json({
        speech: JSON.stringify(error.response.data),
        displayText: JSON.stringify(error.response.data)
      })
    })
}

function blockSite(rez, params) {
  request.post({
    url:'https://dashboard.meraki.com/api/v0/networks/N_646829496481140676/ssids/0/l3FirewallRules', 
    form: 
  {policy: 'Deny',
   protocol: "any",
   destPort: "any",
   destCidr: params.url
  }}
  ,function(err,res,body){ 
    console.log("blockSite callback");
    console.log(err,res,body);
    if(!err){
      return rez.json({
        speech: "Successfully blocked: " + params.url,
        displayText: "Successfully blocked: " + params.url
      })
    }
    else {
      return rez.json({
        speech: JSON.stringify(err),
        displayText: JSON.stringify(err)
      })
    }
  });
}

restService.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});