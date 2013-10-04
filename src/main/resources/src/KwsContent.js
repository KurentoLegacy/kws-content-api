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

function KwsContent(url, options)
{
  var self = this;

  Content.call(this, url, options);

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
      constraints:
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
    function success(result)
    {
      function success2()
      {
        // Init MediaEvents polling
        self._pollMediaEvents();

        // Remote streams
        if(self._video.remote)
        {
          if(options.remoteVideoTag)
          {
            var remoteVideo = self._setRemoteVideoTag(result);

            remoteVideo.addEventListener('ended', function()
            {
              self.terminate();
            })
          }
          else
            console.warn("No remote video tag available, successful terminate event due to remote end will be no dispatched");

          if(self.onremotestream)
          {
            var event = new Event('remotestream');
                event.stream = result;

            self.onremotestream(event)
          }
        }

        // Notify we created the connection successfully
        if(self.onstart)
           self.onstart(new Event('start'));
      }

      // Init local environment
      success2();
    }

    self._start(params, success);
  };


  /**
   * Terminate the connection with the WebRTC media server
   */
  this.terminate = function()
  {
    this._terminate(Content.REASON_USER_ENDED_SESSION);

    var remoteVideo = document.getElementById(options.remoteVideoTag);
    if(remoteVideo)
       remoteVideo.src = '';

    this._close();
  };

  // Mode set to only receive a stream, not send it
  start();
}
