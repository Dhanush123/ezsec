"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const TempMail = require("tempmail.js");
const fs = require('fs');
var randomColor = require('randomcolor');
var quiche = require('quiche');
//27fece4cac8304e262ee1ee81d27844096e7b2e4
const dashboard = require('node-meraki-dashboard')('c83cec6e968362a0e77d34b871a2075a1c4d6ced');

const tmpEmail = "ticuleyire@p33.org";
const account = new TempMail(tmpEmail);

const axios = require('axios');

var dashboard_client = axios.create({
  baseURL: 'https://dashboard.meraki.com/api/v0/',
  headers: {"X-Cisco-Meraki-API-Key": "c83cec6e968362a0e77d34b871a2075a1c4d6ced"}
});

const botServer = express();
botServer.use(bodyParser.json());
botServer.use(express.static('charts'))

const baseUrl = "https://dashboard.meraki.com";
var options = {
  headers: {
    "X-Cisco-Meraki-API-Key": "c83cec6e968362a0e77d34b871a2075a1c4d6ced"
  },
};

var isSpark = false;

botServer.post("/chat", function (req, res) {
  console.log("webhook request");
  try {
    if (req.body) {
      var requestBody = req.body;
      console.log(JSON.stringify(requestBody, null, 2))
      var chatSource = requestBody.originalRequest.source;
      isSpark = (chatSource == "spark");
      if (requestBody.result && Object.keys(requestBody.result.parameters).length == 0) {
        actions[requestBody.result.action](res);
      }
      else { //requestBody.result probably there, deals w/ params here
        actions[requestBody.result.action](res, requestBody.result.parameters);
      }
      console.log("end webhook request");
    } else {
      var errMsg = "req.body is missing!";
      console.error("Cannot process request", errMsg);
      return res.status(400).json({
        status: {
          code: 400,
          errorType: errMsg
        }
      });
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
  orgsList, /*alertsList,*/ networksList, devicesList, adminsFind, topTraffic, dataUsage, blockSite
}

function defaultErrorHandler(error, res) {
  return res.json({
    speech: JSON.stringify(error),
    displayText: JSON.stringify(error)
  });
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
    .catch(error => defaultErrorHandler(error, res));
}

/*function alertsList(res) {
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
        speech: JSON.stringify(msgs, null, 2),
        displayText: JSON.stringify(msgs, null, 2)
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
}*/

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
    .catch(error => defaultErrorHandler(error, res));
}

function devicesList(res) {
  dashboard.devices.list('L_646829496481095933')
    .then(devices => {
      var msg = "Your network, Sandbox 2 - Las Vegas USA, has these devices:\n";
      console.log("devicesList devices\n", devices);
      msg += devices.map(device => device.name || device.model).join('\n');
      console.log("devicesList msg\n", msg);
      return res.json({
        speech: msg,
        displayText: msg
      });
    })
    .catch(error => defaultErrorHandler(error, res));
}

function adminsFind(res) {
  dashboard.admins.list(549236)
    .then(admins => {
      var msg = "Your organization, Meraki Live Sandbox, has the following admins:\n";
      console.log("adminsFinds people\n", admins);
      msg += admins.slice(0, 10).map(admin => admin.name + " - " + admin.email).join('\n');
      msg += admins.length >= 10 ? `and ${admins.length - 10} more admins...` : "";
      console.log("adminsFind msg\n", msg);
      console.log("str length",msg.length);
      return res.json({
        speech: msg,
        displayText: msg
      });
    })
    .catch(error => defaultErrorHandler(error, res));
}

function topTraffic(res, params) {
  dashboard.networks
    .getTrafficData('L_646829496481095933', { 'timespan' : params.hours * 3600 })
    .then(traffic_data => {
      var msg;

      if (traffic_data.length === 0) {
        msg = "It looks like no traffic data has been found!"
        return res.json({
          speech: msg,
          displayText: msg
        });
      }

      msg = "Your networkz, Sandbox 2 - Las Vegas USA, has the following sites/apps in Top 10 Traffic:\n";
      console.log("topTraffic traffic\n", traffic_data);

      var top_traffic = traffic_data
        .slice(0, 10)
        .map(t_data => {
          return {
            app: t_data.application, source: t_data.destination, time: t_data.activeTime, numClients: t_data.numClients
          };
        })
        .sort((a, b) => a.time - b.time);
      msg += top_traffic.map(tt => tt.source + ": " + tt.time + " hours").join('\n');

      console.log("topTraffic msg\n", msg);

      console.log('test');
      var pie = new Quiche('pie');
      console.log('test');
      pie.setTransparentBackground(); // Make background transparent
      console.log('test');
      for (var tt of top_traffic) {
        pie.addData(tt.time, tt.source, randomColor())
      }
      console.log('test');
      pie.setLabel(top_traffic.map(tt => tt.source)); // Add labels to pie segments
      console.log('test');
      var imageUrl = pie.getUrl(true); // First param controls http vs. https
      console.log({
        speech: msg,
        displayText: msg,
        data: {
          text: msg,
          files: [imageUrl]
        }
      })
      return res.json({
        speech: msg,
        displayText: msg,
        data: {
          text: msg,
          files: [imageUrl]
        }
      });
    })
    .catch(error => defaultErrorHandler(error, res));
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
    {
      policy: 'Deny',
      protocol: "any",
      destPort: "any",
      destCidr: params.url
    }
  }
  ,
  function(err,res,body){ 
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

botServer.listen((process.env.PORT || 8000), function () {
  console.log("Server listening");
});