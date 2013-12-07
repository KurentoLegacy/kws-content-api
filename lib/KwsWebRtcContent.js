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


var Content = require("./Content");


/**
 * @constructor
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
function KwsWebRtcContent(url, options)
{
  options = options || {};

  Content.call(this, url, options);

  var self = this;


  var pc = null;


  function onerror(error)
  {
    self.emit('error', error);
  };


  /**
   * Request a connection with the webRTC endpoint server
   *
   * @private
   *
   * @param {MediaStream | undefined} localStream: stream locally offered
   */
  function initRtc(localStream)
  {
    // Create the PeerConnection object
    var iceServers = options.iceServers
                  || [{url: 'stun:'+'stun.l.google.com:19302'}];

    pc = new RTCPeerConnection
    (
      {iceServers: iceServers},
      {optional: [{DtlsSrtpKeyAgreement: true}]}
    );

    // Add the local stream if defined
    if(localStream)
      pc.addStream(localStream);

    // Dispatch 'close' event if signaling gets closed
    pc.onsignalingstatechange = function(event)
    {
      if(pc.signalingState == "closed")
        self.emit('terminate');
    };

    var mediaConstraints =
    {
      mandatory:
      {
        OfferToReceiveAudio: self._audio.remote,
        OfferToReceiveVideo: self._video.remote
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
      // We are still generating the candidates, don't send the SDP yet.
      if(event.candidate)
        return;

      start();
    }
  }


  // RPC calls

  // Start

  /**
   * Request a connection with the webRTC endpoint server
   *
   * @private
   */
  function start()
  {
    /**
     * Callback when connection is succesful
     *
     * @private
     *
     * @param {Object} response: JsonRPC response
     */
    function success(result)
    {
      function success2()
      {
        // Local streams
        if(self._video.local)
        {
          var streams = pc.getLocalStreams();

          if(streams && streams[0])
          {
            var stream = streams[0];
            var url = URL.createObjectURL(stream);

            if(options.localVideoTag)
            {
              var localVideo = document.getElementById(options.localVideoTag);

              if(localVideo)
              {
                localVideo.muted = true;
                localVideo.src = url;
              }
              else
              {
                var msg = "Requested local video tag '"+options.localVideoTag
                        + "' is not available";
                onerror(new Error(msg));
                return
              };
            };

            self.emit('localstream', {stream: stream, url: url});
          }
          else
          {
            onerror(new Error("No local streams are available"));
            return
          }
        };

        // Remote streams
        if(self._video.remote)
        {
          var streams = pc.getRemoteStreams();

          if(streams && streams[0])
          {
            var stream = streams[0];
            var url = URL.createObjectURL(stream);

            if(options.remoteVideoTag)
            {
              var remoteVideo = self._setRemoteVideoTag(url);

            }
            else
              console.warn("No remote video tag available, successful terminate event due to remote end will be no dispatched");

            self.emit('remotestream', {stream: stream, url: url});
          }
          else
          {
            self.emit('error', new Error("No remote streams are available"));
            return
          }
        };

        // Notify we created the connection successfully
        self.emit('start');
      };

      // Set answer description and init local environment
      pc.setRemoteDescription(new RTCSessionDescription(
      {
        type: 'answer',
        sdp: result.sdp
      }),
      success2,
      onerror);
    };


    var params =
    {
      sdp: pc.localDescription.sdp,
      constraints:
      {
        audio: options.audio,
        video: options.video
      }
    };

    self._start(params, success);
  };


  /**
   * Terminate the connection with the WebRTC media server
   */
  function close()
  {
    // Close the PeerConnection
    pc.close();
  };

  this.on('error',     close);
  this.on('terminate', close);


  // Mode set to send local audio and/or video stream
  if(this._audio.local || this._video.local)
    getUserMedia({'audio': this._audio.local, 'video': this._video.local},
    function(stream)
    {
      console.log('User has granted access to local media.');

      initRtc(stream);
    },
    onerror);

  // Mode set to only receive a stream, not send it
  else
    initRtc();
};
KwsWebRtcContent.prototype.__proto__   = Content.prototype;
KwsWebRtcContent.prototype.constructor = KwsWebRtcContent;


module.exports = KwsWebRtcContent;