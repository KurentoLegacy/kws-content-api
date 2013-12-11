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
function KwsContentPlayer(url, options)
{
  options = options || {};

  Content.call(this, url, options);

  var self = this;


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
      // Remote streams
      if(self._video.remote)
      {
        var url = result.url;

        if(options.remoteVideoTag)
        {
          var remoteVideo = self._setRemoteVideoTag(url);

          remoteVideo.addEventListener('ended', function()
          {
            self.terminate();
          })
        }
        else
          console.warn("No remote video tag available, successful terminate event due to remote end will be no dispatched");

        self.emit('remotestream', {url: url});
      };

      // Notify we created the connection successfully
      self.emit('start');
    };


    var params =
    {
      constraints:
      {
        audio: options.audio,
        video: options.video
      }
    };

    self._start(params, success);
  };

  // Mode set to only receive a stream, not send it
  start();


  function close(reason)
  {
    if(reason == Content.REASON_SERVER_ENDED_SESSION)
      return;

    var remoteVideo = document.getElementById(options.remoteVideoTag);
    if(remoteVideo) {
        remoteVideo.src = '';
        remoteVideo.removeAttribute('src');
    }
  };

  this.on('error',     close);
  this.on('terminate', close);
};
KwsContentPlayer.prototype.__proto__   = Content.prototype;
KwsContentPlayer.prototype.constructor = KwsContentPlayer;


module.exports = KwsContentPlayer;