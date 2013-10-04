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

/**
 * @constructor WebRtcContent
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
function WebRtcContent(url, options)
{
  var self = this;

  Content.call(this, url, options);

  var pc = null;

  /**
   * Request a connection with the webRTC endpoint server
   *
   * @private
   *
   * @param {MediaStream || undefined} localStream: stream locally offered
   */
  function initRtc(localStream)
  {
    // Create the PeerConnection object
    var iceServers = options.iceServers
                  || [{url: 'stun:'+'stun.l.google.com:19302'}];

    pc = new RTCPeerConnection({iceServers: iceServers});

    // Add the local stream if defined
    if(localStream)
      pc.addStream(localStream);

    // Dispatch 'close' event if signaling gets closed
    pc.onsignalingstatechange = function(event)
    {
      if(pc.signalingState == "closed")
        self._close();
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
      self._onerror);
    },
    self._onerror,
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
    var params =
    {
      sdp: pc.localDescription.sdp,
      contrainsts:
      {
        audio: options.audio,
        video: options.video
      }
    };

    /**
     * Callback when connection is succesful
     *
     * @private
     *
     * @param {Object} response: JsonRPC response
     */
    function success(response)
    {
      var result = response.result;

      self._setSessionId(result.sessionId);

      function success2()
      {
        // Init MediaEvents polling
        self._pollMediaEvents();

        // Local streams
        if(self._video.local)
        {
          var streams = pc.getLocalStreams();

          if(streams && streams[0])
          {
            var stream = streams[0];

            if(options.localVideoTag)
            {
              var localVideo = document.getElementById(options.localVideoTag);

              if(localVideo)
                 localVideo.src = URL.createObjectURL(stream);
              else
              {
                var msg = "Requested local video tag '"+options.localVideoTag
                        + "' is not available";
                self._onerror(new Error(msg));
                return
              };
            }

            if(self.onlocalstream)
            {
              var event = new Event('localstream');
                  event.stream = stream;

              self.onlocalstream(event)
            }
          }
          else
          {
            self._onerror(new Error("No local streams are available"));
            return
          }
        }

        // Remote streams
        if(self._video.remote)
        {
          var streams = pc.getRemoteStreams();

          if(streams && streams[0])
          {
            var stream = streams[0];

            if(options.remoteVideoTag)
            {
              var url = URL.createObjectURL(stream);

              self._setRemoteVideoTag(url);
            }

            if(self.onremotestream)
            {
              var event = new Event('remotestream');
                  event.stream = stream;

              self.onremotestream(event)
            }
          }
          else
          {
            self._onerror(new Error("No remote streams are available"));
            return
          }
        }

        // Notify we created the connection successfully
        if(self.onstart)
           self.onstart(new Event('start'));
      }

      pc.setRemoteDescription(new RTCSessionDescription(
      {
        type: 'answer',
        sdp: result.sdp
      }),
      success2,
      self._onerror);
    }

    self._start(params, success);
  };


  /**
   * Terminate the connection with the WebRTC media server
   */
  this.terminate = function()
  {
    this._terminate();

    // Close the PeerConnection
    pc.close();
  };

  // Mode set to send local audio and/or video stream
  if(this._audio.local || this._video.local)
    getUserMedia({'audio': this._audio.local, 'video': this._video.local},
    function(stream)
    {
      console.log('User has granted access to local media.');

      initRtc(stream);
    },
    self._onerror);

  // Mode set to only receive a stream, not send it
  else
    initRtc();
}
