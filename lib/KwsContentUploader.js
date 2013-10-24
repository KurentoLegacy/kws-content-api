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

var XMLHttpRequest = require("xmlhttprequest");


/**
 * Upload a file to a Media Server
 * 
 * @constructor
 * 
 * @param {string} url - URL of the Connect Server endpoint
 * @param {KwsContentUploader} [options]
 */
function KwsContentUploader(url, options)
{
  options = options || {};

  Content.call(this, url, options);

  var self = this;


  // XmlHttpRequest object used to upload the files
  var xhr = new XMLHttpRequest();

  xhr.upload.addEventListener('error', function(error)
  {
    self.emit('error', error);
  });
  xhr.upload.addEventListener('load', function(event)
  {
    console.log(event);
    self.emit('localfile');
//    self.emit('localfile', file);
  });


  /**
   * Request to the content server the URL where to upload the file
   */
  function start()
  {
    function success(result)
    {
      // Connect to Media Server and set the url where to upload the file
      xhr.open('POST', result.url);


      function sendFiles(container)
      {
        var files = container.files;
        if(files)
          self.send(files);
      };


      // Set events on elements (if specified)
      if(options.inputTag)
      {
        var input = document.getElementById(options.inputTag);
        if(!input)
          throw new SyntaxError("ID "+options.inputTag+" was not found");

        input.addEventListener('change', function(event)
        {
          sendFiles(input);
        });

        sendFiles(input);
      };

      if(options.dragdropTag)
      {
        var div = document.getElementById(options.dragdropTag);
        if(!div)
          throw new SyntaxError("ID "+options.dragdropTag+" was not found");

        div.addEventListener('drop', function(event)
        {
          sendFiles(event.dataTransfer)
        });

        /**
         * @todo Allow to drop files before connecting
         */
      };

      self.emit('start');
    };


    var params =
    {
      constraints:
      {
        audio: 'sendonly',
        video: 'sendonly'
      }
    };

    self._start(params, success);
  };

  start();


  //
  // Methods
  //

  /**
   * Upload a file
   * 
   * @param {File} file - media file to be uploaded to the server
   */
  this.send = function(file)
  {
    if(!this.sessionId)
      throw new SyntaxError("Connection with media server is not stablished");

    if(options.useFormData)
    {
      var formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    }
    else
      xhr.send(file);
  };
};
KwsContentUploader.prototype.__proto__   = Content.prototype;
KwsContentUploader.prototype.constructor = KwsContentUploader;


/**
 * @typedef {object} KwsContentUploader
 * @property {Boolean} [useFormData] - select if files should be uploaded as raw
 *   Blobs or inside a FormData object
 * @property {string} [inputTag] - ID of the input tag that will host the file
 * @property {string} [dragdropTag] - ID of the element where to drop the files
 */


module.exports = KwsContentUploader;