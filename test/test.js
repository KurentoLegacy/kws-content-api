/*
 * (C) Copyright 2013 Kurento (http://kurento.org/)
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the GNU Lesser General Public License
 * (LGPL) version 2.1 which accompanies this distribution, and is available at
 * http://www.gnu.org/licenses/lgpl-2.1.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 */


var nock       = require('nock');
var nodeunit   = require('nodeunit');
var RpcBuilder = require("rpc-builder");

var kwsContentApi = require('../lib/index.js');


var CONTENT_DOMAIN = 'http://content.example.com';
var CONTENT_PATH   = '/contentEndpoint';


exports['KwsContentPlayer'] =
{
  setUp: function(callback)
  {
    callback();
  },

  tearDown: function(callback)
  {
    nock.cleanAll();

    callback();
  },


  "Server receive JSON 'start' message": function(test)
  {
    test.expect(1);

    // Server
    var contentServer = nock(CONTENT_DOMAIN)
//        .cleanAll()
//        .disableNetConnect()
        .post(CONTENT_PATH)
        .reply(200, function(uri, requestBody)
        {
          var rpc = new RpcBuilder();
          var request = rpc.decodeJSON(requestBody);

          console.log(uri);
          console.log(requestBody);
          console.log("request.method="+request.method);
          test.equal(request.method, "start");

          return '';
        });

    nock.recorder.rec()

    // Client
    var uri = CONTENT_DOMAIN + CONTENT_PATH;

    var kwsContentPlayer = new kwsContentApi.KwsContentPlayer(uri);

    test.done();
  },

//  "Client receive answer to 'start' message": function(test)
//  {
//    test.expect(1);
//
//    // Server
//    var contentServer = nock(CONTENT_DOMAIN)
////        .cleanAll()
////        .disableNetConnect()
//        .post(CONTENT_PATH)
//        .reply(200, function(uri, requestBody)
//        {
//          var rpc = new RpcBuilder();
//          var request = rpc.decodeJSON(requestBody);
//
//          test.equal(request.method, "start");
//
//          var response =
//          {
//            sessionId: 1234,
//            url: 'http://media.example.com/mediaEndpoint'
//          };
//
//          return request.response(null, response);
//        });
//
//    nock.recorder.rec()
//
//    // Client
//    var uri = CONTENT_DOMAIN + CONTENT_PATH;
//
//    var kwsContentPlayer = new kwsContentApi.KwsContentPlayer(uri);
//
//    kwsContentPlayer.on('error', function(error)
//    {
//      test.ifError(error);
//      test.done();
//    });
//    kwsContentPlayer.on('start', function()
//    {
//      test.done();
//    });
//  }
};