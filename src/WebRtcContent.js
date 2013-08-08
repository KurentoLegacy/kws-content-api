/**
 * @class WebRtcContent
 * 
 * @param {String} ws_uri: URI of the server WebSocket endpoint. Alternatively,
 *   it can be used a WebSocket or DataChannel object.
 * @param {Object} options: configuration options
 *   {String} username: authentication username.
 *   {String} password: authentication password.
 *   {Object} listeners: listeners for the desired events.
 * @param {Function(Error, WebRtcContent)} callback: continuation function
 */
function WebRtcContent(url)
{
  var self = this;


  var getUserMedia = navigator.getUserMedia
                  || navigator.mozGetUserMedia
                  || navigator.webkitGetUserMedia;

  var RTCPeerConnection = navigator.RTCPeerConnection
                       || navigator.mozRTCPeerConnection
                       || webkitRTCPeerConnection;


  $.jsonRPC.setup({url: url});

  var sessionId = null;

  var pc = new RTCPeerConnection(
  {
    iceServers: [{url: 'stun:'+'stun.l.google.com:19302'}]
  });


  function onerror(error)
  {
    if(self.onerror && error)
       self.onerror(error);
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
    console.log(offer);

    // Set the peer local description
    pc.setLocalDescription(offer,
    function()
    {
      console.info("setLocalDescription = success")
    },
    onerror);
  },
  onerror,
  mediaConstraints)

  pc.onicecandidate = function(event)
  {
    if(event.candidate)
      return;

    var params =
    {
      sdp: pc.localDescription.sdp
    };

    function success(result)
    {
      sessionId = result.sessionId;

      pc.setRemoteDescription(
      {
        type: 'answer',
        sdp: result.sdp
      },
      function()
      {
        if(self.onsuccess)
        {
          var streams = pc.getRemoteStreams();

          if(streams)
            self.onsuccess(stream[0]);
          else
            onerror(new Error("No streams are available"));
        }
      },
      onerror)
    }

    $.jsonRPC.request('start',
    {
      params:  params,
      success: success,
      error:   onerror
    });
  }


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
        console.info("Connection terminated");
      },
      error: function(result)
      {
        console.error("Error terminating the connection");
      }
    });
  }


  // Pool

  /**
   * Pool for events dispatched on the server pipeline
   *
   * @param {Function(Error, result)} callback: function to process the events
   */
  this.poll = function(callback)
  {
    var params =
    {
      sessionId: sessionId
    };

    $.jsonRPC.request('poll',
    {
      params: params,
      success: function(result)
      {
        callback(null, result.events);
      },
      error: function(result)
      {
        callback(result.error);
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
/*    function sendOffer()
    {
      var mediaConstraints =
      {
        'mandatory':
        {
          'OfferToReceiveAudio': audio.remote,
          'OfferToReceiveVideo': video.remote
        }
      };

      pc.createOffer(function(offer)
      {
        console.log(offer);

        // Set the peer local description
        pc.setLocalDescription(offer,
        function()
        {
          nsss.call('offer', peerUID, offer.sdp, onerror);
        },
        onerror);
      },
      onerror,
      mediaConstraints)
    }

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
