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
$(function(event)
{
  var txtUri = $('#txtUri');
  var chkUseWebRTC = $('#chkUseWebRTC');
  var btnConnect = $('#btnConnect');
  var btnTerminate = $('#btnTerminate');
  var localVideo = $('#localVideo');
  var remoteVideo = $('#remoteVideo');

  console = new Console('console', console);


  /**
   * Disable connect button
   */
  function disableInput(value)
  {
    btnConnect.attr('disabled', value);
    txtUri.attr('disabled', value);
  }


  /**
   * Set and enable the terminate button
   *
   * @param {WebRtcContent} conn: WebRTC streamming connection
   */
  function setTerminate(conn)
  {
    // Enable and init button to terminate the connection
    btnTerminate.one('click', function(event)
    {
      // Disable terminate button
      btnTerminate.attr('disabled', true);

      // Terminate the connection
      conn.terminate();

      console.log("Connection terminated by user");

      // Enable connect button
      disableInput(false);
    });
  }


  function initConnection(conn)
  {
    // Set and enable the terminate button
    setTerminate(conn);

    // Set connection success and error events
    conn.onstart = function(event)
    {
      console.log("Connection started");

      // Enable terminate button
      btnTerminate.attr('disabled', false);
    };
    conn.onterminate = function(event)
    {
      console.log("Connection terminated");
    };

    conn.onlocalstream = function(event)
    {
      console.info("LocalStream set")
    }
    conn.onremotestream = function(event)
    {
      console.info("RemoteStream set")
    }

    conn.onmediaevent = function(event)
    {
      console.info("MediaEvent: "+JSON.stringify(event.data))
    }

    conn.onerror = function(error)
    {
      // Enable connect button
      disableInput(false);

      // Notify to the user of the error
      console.error(error.message);
    };
  }


  btnConnect.on('click', function(event)
  {
    // Disable connect button
    disableInput(true);

    // Create a new connection
    var uri = txtUri.val();

    var options =
    {
      localVideoTag:  'localVideo',
      remoteVideoTag: 'remoteVideo'
    };

    try
    {
      var conn = null;

      if(chkUseWebRTC.is(":checked"))
        conn = new WebRtcContent(uri, options);
      else
        conn = new KwsContent(uri, options);

      console.log("Connection created pointing to '"+uri+"'");

      initConnection(conn);
    }
    catch(error)
    {
      // Enable connect button
      disableInput(false);

      // Notify to the user of the error
      console.error(error.message)
    }
  });
});
