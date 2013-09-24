/**
 * @constructor KwsContent
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
  var self = this;

  // Initialize options and object status

  options = options || {};

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

  // Init the WebRtcContent object

  $.jsonRPC.setup({endPoint: url});

  var sessionId = null;
  var pollingTimeout = null;

  // Error dispatcher functions

  var MAX_ALLOWED_ERROR_TRIES = 10;

  var _error = null;
  var error_tries = 0;

  /**
   * Common function to dispatch the error to the user application
   *
   * @param {Error} error: error object to be dispatched
   */
  this._onerror = function(error)
  {
    _error = error;

    self.terminate();
  };

  /**
   * Adaptor from jsonRPC errors to standard Javascript Error objects
   *
   * @param response: jsonRPC error object
   */
  function onerror_jsonrpc(response)
  {
    self._onerror(response.error);
  };


  // RPC calls

  // Start

  this._start = function(params, success)
  {
    if(sessionId)
      throw new SyntaxError("Connection already open");

    else
      $.jsonRPC.request('start',
      {
        params:  params,
        success: success,
        error:   onerror_jsonrpc
      });
  }

  // Pool

  /**
   * Pool for events dispatched on the server pipeline
   *
   * @private
   */
  this._pollMediaEvents = function()
  {
    var params =
    {
      sessionId: sessionId
    };

    $.jsonRPC.request('poll',
    {
      params: params,
      success: function(response)
      {
        error_tries = 0;

        var result = response.result;

        if(result.events)
          for(var i=0, data; data=result.events[i]; i++)
            if(self.onmediaevent)
            {
              var event = new Event('MediaEvent');
                  event.data = data;

              self.onmediaevent(event);
            }

        if(pollingTimeout != 'stopped')
           pollingTimeout = setTimeout(self._pollMediaEvents, 0);
      },
      error: function(response)
      {
        // A poll error has occurred, retry it
        if(error_tries < MAX_ALLOWED_ERROR_TRIES)
        {
          if(pollingTimeout != 'stopped')
             pollingTimeout = setTimeout(self._pollMediaEvents, Math.pow(2, error_tries));

          error_tries++;
        }

        // Max number of poll errors achieved, raise error
        else
          onerror_jsonrpc(response);
      }
    });
  }

  /**
   * Terminate the connection with the WebRTC media server
   */
  this._terminate = function()
  {
    // Stop polling
    clearTimeout(pollingTimeout);
    pollingTimeout = 'stopped';

    // Notify to the WebRTC endpoint server
    if(sessionId)
    {
      var params =
      {
        sessionId: sessionId
      };

      $.jsonRPC.request('terminate', {params: params});

      this._setSessionId(null);
    };
  };


  this._setSessionId = function(id)
  {
    sessionId = id;
  }

  this._close = function()
  {
    if(_error)
    {
      if(self.onerror)
         self.onerror(_error);
    }
    else
    {
      if(self.onterminate)
         self.onterminate(new Event('terminate'));
    }
  }

  this._setRemoteVideoTag = function(url)
  {
    var remoteVideo = document.getElementById(options.remoteVideoTag);

    if(remoteVideo)
       remoteVideo.src = url;
    else
    {
      var msg = "Requested remote video tag '" + options.localVideoTag
              + "' is not available";

      self._onerror(new Error(msg));
      return
    };

    return remoteVideo;
  }

  this.execute = function(type, data, callback)
  {
    if(sessionId)
    {
      var params =
      {
        sessionId: sessionId,
        command:
        {
          type: type,
          data: data
        }
      };

      $.jsonRPC.request('execute',
      {
        params: params,
        success: function(response)
        {
          callback(null, response.result.commandResult);
        },
        error: function(response)
        {
          callback(response.error);
        }
      });
    }

    else
      throw new SyntaxError("Connection needs to be open");
  }
}