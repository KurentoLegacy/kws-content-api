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

var inherits = require("inherits");


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

  if(options.autostart == undefined)
     options.autostart = true;

  Content.call(this, url, options);

  var self = this;

  var Content_start = this.start;


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
    if(localStream)
      console.log('User has granted access to local media.');

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

    // PeerConnection events

    pc.onicecandidate = function(event)
    {
      // We are still generating the candidates, don't send the SDP yet.
      if(event.candidate) return;

      var params =
      {
        sdp: pc.localDescription.sdp,
        constraints:
        {
          audio: options.audio,
          video: options.video
        }
      };

      console.debug('offer: '+params.sdp);

      Content_start.call(self, params, success);
    };

    // Dispatch 'close' event if signaling gets closed
    pc.onsignalingstatechange = function(event)
    {
      if(pc.signalingState == "closed")
        self.emit('terminate');
    };
  }


  /**
   * Callback when connection is succesful
   *
   * @private
   *
   * @param {Object} response: JsonRPC response
   */
  function success(result)
  {
    console.debug('answer: '+result.sdp);

    // Set answer description and init local environment
    pc.setRemoteDescription(new RTCSessionDescription(
    {
      type: 'answer',
      sdp: result.sdp
    }),
    success2,
    onerror);
  };

  function success2()
  {
    // Local streams
    if(self._video.local)
    {
      var stream = pc.getLocalStreams()[0];
      if(!stream)
        return onerror(new Error("No local streams are available"));

      var url = URL.createObjectURL(stream);

      if(options.localVideoTag)
      {
        var localVideo = document.getElementById(options.localVideoTag);
        if(!localVideo)
        {
          var msg = "Requested local video tag '"+options.localVideoTag
                  + "' is not available";
          return onerror(new Error(msg));
        };

        localVideo.muted = true;
        localVideo.src = url;
      };

      self.emit('localstream', {stream: stream, url: url});
    };

    // Remote streams
    if(self._video.remote)
    {
      var stream = pc.getRemoteStreams()[0];
      if(!stream)
        return self.emit('error', new Error("No remote streams are available"));

      var url = URL.createObjectURL(stream);

      if(options.remoteVideoTag)
      {
        var remoteVideo = self._setRemoteVideoTag(url);

      }
      else
        console.warn("No remote video tag available, successful terminate event due to remote end will be no dispatched");

      self.emit('remotestream', {stream: stream, url: url});
    };

    // Notify we created the connection successfully
    self.emit('start');
  };


  /**
   * Terminate the connection with the WebRTC media server
   */
  function close()
  {
    if(pc.signalingState == "closed")
      return;

    // Close the PeerConnection
    pc.close();
  };

  this.on('error',     close);
  this.on('terminate', close);


  // Mode set to send local audio and/or video stream
  this.start = function()
  {
    var audio = this._audio.local;
    var video = this._video.local;

    if(audio || video)
    {
      var constraints =
      {
        audio: audio,
        video: video
      };

      getUserMedia(constraints, initRtc, onerror);
    }

    // Mode set to only receive a stream, not send it
    else
      initRtc();
  }

  if(options.autostart)
    this.start();
};
inherits(KwsWebRtcContent, Content);


module.exports = KwsWebRtcContent;
