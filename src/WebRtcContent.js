/**
 * @class WebRtcContent
 *
 * @param {String} url: URL of the WebRTC endpoint server.
 * @param {Object} options: optional configurations
 *   {Enum('none', 'send', 'recv', 'sendrecv')} audio: audio stream mode
 *   {Enum('none', 'send', 'recv', 'sendrecv')} video: video stream mode
 */
function WebRtcContent(url, options)
{
  var self = this;


  // Initialize options and object status

  options = options || {};

  /**
   * Decode the mode of the streams
   *
   * @param {String} type: name of the constraints to decode (only for debug)
   * @param {String} mode: constraints to decode
   */
  function decodeMode(type, mode)
  {
    var result = {};

    switch(mode)
    {
      case undefined:  // If not defined, set send & receive by default
      case null:
      case 'sendrecv':
        result.local  = true;
        result.remote = true;
      break;

      case 'send':
        result.local  = true;
        result.remote = false;
      break;

      case 'recv':
        result.local  = false;
        result.remote = true;
      break;

      case 'none':
        result.local  = false;
        result.remote = false;
      break;

      default:
        throw new RangeError("Invalid "+type+" media mode");
    }

    return result;
  }

  // We can't disable both audio and video on a stream, raise error
  if(options.audio == 'none' && options.video == 'none')
    throw new RangeError("At least one audio or video must to be enabled");

  // Audio media
  var audio = decodeMode("audio", options.audio);

  // Video media
  var video = decodeMode("video", options.video);


  // Init the WebRtcContent object

  $.jsonRPC.setup({endPoint: url});

  var sessionId = null;
  var pollingTimeout = null;


  // Error dispatcher functions

  var _error = null;

  /**
   * Common function to dispatch the error to the user application
   *
   * @param {Error} error: error object to be dispatched
   */
  function onerror(error)
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
    onerror(new Error(response.error || response));
  };


  // Create the PeerConnection object
  var iceServers = options.iceServers
                || [{url: 'stun:'+'stun.l.google.com:19302'}];

  var pc = new RTCPeerConnection({iceServers: iceServers});

  // Add the local stream if defined
  if(options.stream)
    pc.addStream(options.stream);

  // Dispatch 'close' event if signaling gets closed
  pc.onsignalingstatechange = function(event)
  {
    if(pc.signalingState == "closed")
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
  };


  // RPC calls

  // Start

  var mediaConstraints =
  {
    'mandatory':
    {
      'OfferToReceiveAudio': true,
      'OfferToReceiveVideo': true
    }
  };

  pc.createOffer(function(offer)
  {
    // Set the peer local description
    pc.setLocalDescription(offer,
    function()
    {
      console.info("LocalDescription correctly set");
    },
    onerror);
  },
  onerror,
  mediaConstraints);

  pc.onicecandidate = function(event)
  {
    if(event.candidate)
      return;

    var params =
    {
      sdp: pc.localDescription.sdp
    };

    /**
     * Callback when connection is succesful
     *
     * @param {Object} response: JsonRPC response
     */
    function success(response)
    {
      var result = response.result;

      sessionId = result.sessionId;

      pc.setRemoteDescription(new RTCSessionDescription(
      {
        type: 'answer',
        sdp: result.sdp
      }),
      function()
      {
        // Init MediaEvents polling
        pollMediaEvents();

        // Notify to the user about the new stream
        if(self.onstart)
        {
          var streams = pc.getRemoteStreams();

          if(streams && streams[0])
          {
            var event = new Event('start');
                event.stream = streams[0];

            self.onstart(event);
          }
          else
            onerror(new Error("No streams are available"));
        }
      },
      onerror);
    }

    $.jsonRPC.request('start',
    {
      params:  params,
      success: success,
      error:   onerror_jsonrpc
    });
  };


  /**
   * Terminate the connection with the WebRTC media server
   */
  this.terminate = function()
  {
    // Stop polling
    clearTimeout(pollingTimeout);
    pollingTimeout = 'stopped';

    // Notify to the WebRTC endpoint server
    var params =
    {
      sessionId: sessionId
    };

    $.jsonRPC.request('terminate', {params: params});

    // Close the PeerConnection
    pc.close();
  };


  // Pool

  var MAX_ALLOWED_ERROR_TRIES = 10;

  var error_tries = 0;

  /**
   * Pool for events dispatched on the server pipeline
   */
  function pollMediaEvents()
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
           pollingTimeout = setTimeout(pollMediaEvents, 0);
      },
      error: function(event)
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
    	  onerror_jsonrpc(event);
      }
    });
  }










  // Mediacontrol

  /**
   * Start a new media communication
   *
   * @param {String} mediaId: identifier of the media communication
   * @param {Function(Error, Media)} callback: continuation function
   */
/*  this.startMedia = function(mediaId, options, callback)
  {
*/

    /**
     * Send an offer with the current and new streams and constraints
     */
/*
    // Mode set to send local audio and/or video stream
    if(audio.local || video.local)
      navigator.getUserMedia({'audio': audio.local, 'video': video.local},
      function(stream)
      {
        pc.addStream(stream);
        sendOffer();
      },
      onerror)

    // Mode set to only receive a stream, not send it
    else
      sendOffer();
  }*/
}