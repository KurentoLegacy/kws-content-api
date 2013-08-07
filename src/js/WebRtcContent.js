/**
 * @class WebRtcContent
 *
 * @param {String} ws_uri: URI of the server WebSocket endpoint. Alternatively,
 *   it can be used a WebSocket or DataChannel object.
 */
function WebRtcContent(url)
{
  var self = this;


  $.jsonRPC.setup({endPoint: url});

  var sessionId = null;
  var pollingTimeout = null;

  var pc = new RTCPeerConnection(
  {
    iceServers: [{url: 'stun:'+'stun.l.google.com:19302'}]
  });

  pc.addEventListener('signalingState', function(event)
  {
    if(pc.signalingState == "close"
    && self.onclose)
       self.onclose(new Event('close'));
  });


  function onerror(error)
  {
    if(self.onerror)
       self.onerror(error);
  }

  function onerror_jsonrpc(event)
  {
    onerror(new Error(event.error));
  }


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
        if(self.onopen)
        {
          var streams = pc.getRemoteStreams();

          if(streams)
          {
            var event = new Event('open');
                event.stream = streams[0];

            self.onopen(event);
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


  // Terminate
  this.terminate = function()
  {
    var params =
    {
      sessionId: sessionId
    };

    $.jsonRPC.request('terminate',
    {
      params: params,
      success: function(result)
      {
        // Stop polling
        clearTimeout(pollingTimeout);

        console.info("Connection terminated");
      },
      error: onerror_jsonrpc
    });
  };


  // Pool

  /**
   * Pool for events dispatched on the server pipeline
   */
  function pollMediaEvents()
  {
    var timeout = 5*1000;  // Request events each 5 seconds

    var params =
    {
      sessionId: sessionId
    };

    $.jsonRPC.request('poll',
    {
      params: params,
      success: function(response)
      {
        var result = response.result;

        if(result.events)
          for(var i=0, data; data=result.events[i]; i++)
            if(self.onMediaEvent)
            {
              var event = new Event('MediaEvent');
                  event.data = data;

              self.onMediaEvent(event);
            }

        pollingTimeout = setTimeout(pollMediaEvents, timeout);
      },
      error: function(event)
      {
        onerror_jsonrpc(event);

        pollingTimeout = setTimeout(pollMediaEvents, timeout);
      }
    });
  }










  // Mediacontrol

  /**
   * Start a new media communication
   *
   * @param {String} mediaId: identifier of the media communication
   * @param {Object} options: configuration options
   *   {Enum(null, 'send', 'recv', 'sendrecv')} audio: audio stream mode
   *   {Enum(null, 'send', 'recv', 'sendrecv')} video: video stream mode
   * @param {Function(Error, Media)} callback: continuation function
   */
/*  this.startMedia = function(mediaId, options, callback)
  {
    // Adjust arguments if options is not defined
    if(typeof options == 'function')
    {
      callback = options;
      options = undefined;
    }

    options = options || {};

    // We can't disable both audio and video on a stream, raise error
    if(options.audio == null
    && options.video == null)
    {
      callback(new Error("No audio or video medias are defined"));
      return
    }
*/
    /**
     * Decode the mode of the streams
     */
/*    function decodeMode(type, mode)
    {
      var result = {};

      switch(mode)
      {
        case undefined:  // If not defined, set send & receive by default
        case 'sendrecv':
          result.local = true;
          result.remote = true;
        break;

        case 'send':
          result.local = true;
          result.remote = false;
        break;

        case 'recv':
          result.local = false;
          result.remote = true;
        break;

        default:
          callback(new Error("Invalid "+type+" media mode"));
          return
      }

      return result;
    }

    // Audio media
    var audio = decodeMode("audio", options.audio);
    if(!audio) return;

    // Video media
    var video = decodeMode("video", options.video);
    if(!video) return;
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
