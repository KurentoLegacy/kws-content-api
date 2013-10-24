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


var EventEmitter = require("events").EventEmitter;

var XMLHttpRequest = require("xmlhttprequest");
var RpcBuilder     = require("rpc-builder");


/**
 * @constructor
 * @abstract
 *
 * @param {String} url: URL of the WebRTC endpoint server.
 * @param {Object} options: optional configuration parameters
 *   {Enum('inactive', 'sendonly', 'recvonly', 'sendrecv')} audio: audio stream mode
 *   {Enum('inactive', 'sendonly', 'recvonly', 'sendrecv')} video: video stream mode
 *   {[Object]} iceServers: array of objects to initialize the ICE servers. It
 *     structure is the same as an Array of WebRTC RTCIceServer objects.
 *
 * @throws RangeError
 */
function Content(url, options)
{
  EventEmitter.call(this);

  var self = this;


  const ERROR_NO_REMOTE_VIDEO_TAG = -1;


  /**
   * Decode the mode of the streams
   *
   * @private
   *
   * @param {Object} options: constraints to update and decode
   * @param {String} type: name of the constraints to decode
   *
   * @returns {Object}
   *
   * @throws RangeError
   */
  function decodeMode(options, type)
  {
    var result = {};

    // If not defined, set send & receive by default
    options[type] = options[type] || 'sendrecv';

    switch(options[type])
    {
      case 'sendrecv':
        result.local  = true;
        result.remote = true;
      break;

      case 'sendonly':
        result.local  = true;
        result.remote = false;
      break;

      case 'recvonly':
        result.local  = false;
        result.remote = true;
      break;

      case 'inactive':
        result.local  = false;
        result.remote = false;
      break;

      default:
        throw new RangeError("Invalid "+type+" media mode");
    }

    return result;
  }

  // We can't disable both audio and video on a stream, raise error
  if(options.audio == 'inactive' && options.video == 'inactive')
    throw new RangeError("At least one audio or video must to be enabled");

  // Audio media
  this._audio = decodeMode(options, "audio");

  // Video media
  this._video = decodeMode(options, "video");

  // Init the KwsWebRtcContent object

  var _sessionId = null;
  var pollingTimeout = null;


  this.__defineGetter__('sessionId', function()
  {
    return _sessionId;
  });


  var xhr = new XMLHttpRequest();
  var rpc = new RpcBuilder();

  // Init XmlHttpRequest object
  xhr.addEventListener('error', function(error)
  {
    self.emit('error', error);
  });


  function close()
  {
    xhr.abort();

    _sessionId = null;
  };

  self.on('error',     close);
  self.on('terminate', close);


  // Error dispatcher functions

  var MAX_ALLOWED_ERROR_TRIES = 10;

  var error_tries = 0;


  // RPC calls

  // Start

  this._start = function(params, success)
  {
    if(this.sessionId)
      throw new SyntaxError("Connection already open");


    // Register callback for the Application Server
    xhr.addEventListener('load', function()
    {
      rpc.decodeJSON(this.responseText);
    });

    // Connect to Content Server and send request
    xhr.open('POST', url);


    xhr.send(rpc.encodeJSON('start', params, function(error, result)
    {
      if(error)
        self.emit('error', error);

      else
      {
        if(result.rejected)
          self.emit('error', result.rejected)

        else
        {
          _sessionId = result.sessionId;

          success(result);
        }
      }
    }));
  };


  // Pool

  /**
   * Pool for events dispatched on the server pipeline
   *
   * @private
   */
  function pollMediaEvents()
  {
    if(!self.sessionId)
      return;

    var params =
    {
      sessionId: self.sessionId
    };

    function success(result)
    {
      error_tries = 0;

      // Content events
      if(result.contentEvents)
        for(var i=0, data; data=result.contentEvents[i]; i++)
          self.emit('mediaevent', data);

      // Control events
      if(result.controlEvents)
        for(var i=0, data; data=result.controlEvents[i]; i++)
        {
          var type = data.type;

          switch(type)
          {
            case "sessionTerminated":
              self.emit('terminate', Content.REASON_SERVER_ENDED_SESSION);
            break;

            case "sessionError":
              self.emit('error', data.data);
            break;

            default:
              console.warn("Unknown control event type: "+type);
          }
        };

      // Check if we should keep polling events
      if(pollingTimeout != 'stopped')
         pollingTimeout = setTimeout(pollMediaEvents, 0);
    };

    function failure(error)
    {
      // A poll error has occurred, retry it
      if(error_tries < MAX_ALLOWED_ERROR_TRIES)
      {
        if(pollingTimeout != 'stopped')
           pollingTimeout = setTimeout(pollMediaEvents, Math.pow(2, error_tries));

        error_tries++;
      }

      // Max number of poll errors achieved, raise error
      else
      {
        terminateConnection(error);
        self.emit('error', error);
      }
    };

    xhr.open('POST', url);
    xhr.send(rpc.encodeJSON('poll', params, function(error, result)
    {
      if(error)
        failure(error)
      else
        success(result)
    }));
  };

  this.on('start', pollMediaEvents);


  /**
   * Terminate the connection with the WebRTC media server
   */
  function terminateConnection(reason)
  {
    // Stop polling
    clearTimeout(pollingTimeout);
    pollingTimeout = 'stopped';

    // Notify to the WebRTC endpoint server
    if(self.sessionId)
    {
      var params =
      {
        sessionId: self.sessionId,
        reason: reason
      };

      xhr.open('POST', url);
      xhr.send(rpc.encodeJSON('terminate', params));

      _sessionId = null;
    };
  };


  //
  // Methods
  //

  /**
   * @private
   */
  this._setRemoteVideoTag = function(url)
  {
    var remoteVideo = document.getElementById(options.remoteVideoTag);
    if(remoteVideo)
    {
      remoteVideo.src = url;

      return remoteVideo;
    };

    var msg = "Requested remote video tag '" + options.remoteVideoTag
            + "' is not available";

    var error = new Error(msg);
        error.code = ERROR_NO_REMOTE_VIDEO_TAG;

    self.emit('error', error);
  };


  /**
   * Send a command to be executed on the server
   *
   * @param {string} type - The command to execute
   * @param {*} data - Data needed by the command
   * @param {} callback - Function executed after getting a result or an error
   */
  this.execute = function(type, data, callback)
  {
    if(!this.sessionId)
      throw new SyntaxError("Connection needs to be open");

    var params =
    {
      sessionId: this.sessionId,
      command:
      {
        type: type,
        data: data
      }
    };

    xhr.send(rpc.encodeJSON('execute', params, function(error, result)
    {
      callback(error, result.commandResult);
    }));
  }

  /**
   * Close the connection
   */
  this.terminate = function()
  {
    var reason = Content.REASON_USER_ENDED_SESSION;

    terminateConnection(reason);
    self.emit('terminate', reason);
  };
};
Content.prototype.__proto__   = EventEmitter.prototype;
Content.prototype.constructor = Content;


Content.REASON_USER_ENDED_SESSION =
{
  code: 1,
  message: "User ended session"
};
Content.REASON_SERVER_ENDED_SESSION =
{
  code: 2,
  message: "Server ended session"
};


module.exports = Content;