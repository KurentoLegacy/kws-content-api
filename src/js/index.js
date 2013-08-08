$(function(event)
{
  var txtUri = $('#txtUri');
  var btnConnect = $('#btnConnect');
  var btnTerminate = $('#btnTerminate');
  var localVideo = $('#localVideo');
  var remoteVideo = $('#remoteVideo');
  var divLog = $('#divLog');

  var localStream = null;


  function error(msg)
  {
    // Sanitize the input
    msg = msg.replace(/</g, '&lt;');

    msg = '<span style="color: #FF0000">'+msg+'</span>';

    divLog.html(divLog.html() + msg + '<br>');
  }

  function info(msg)
  {
    // Sanitize the input
    msg = msg.replace(/</g, '&lt;');

    msg = '<span style="color: #0000FF">'+msg+'</span>';

    divLog.html(divLog.html() + msg + '<br>');
  }

  function log(msg)
  {
    // Sanitize the input
    msg = msg.replace(/</g, '&lt;');

    divLog.html(divLog.html() + msg + '<br>');
  }


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

      log("Connection terminated by user");

      // Enable connect button
      disableInput(false);
    });
  }


  btnConnect.on('click', function(event)
  {
    // Disable connect button
    disableInput(true);

    // Create a new connection
    var uri = txtUri.val();
    var conn = new WebRtcContent(uri, {stream: localStream});

    log("Connection created pointing to '"+uri+"'");

    // Set and enable the terminate button
    setTerminate(conn);

    // Set connection success and error events
    conn.onopen = function(event)
    {
      log("Connection openned");

      // Set the incoming stream on the video tag
      remoteVideo.attr('src', URL.createObjectURL(event.stream));

      // Enable terminate button
      btnTerminate.attr('disabled', false);
    };
    conn.onclose = function(event)
    {
      log("Connection clossed");
    };

    conn.onMediaEvent = function(event)
    {
      info("MediaEvent: "+JSON.stringify(event.data))
    }

    conn.onerror = function(event)
    {
      // Enable connect button
      disableInput(false);

      // Notify to the user of the error
      error(event.message);
      console.error(event);
    };
  });

  // Camera
  getUserMedia({'audio': true, 'video': true},
  function(stream)
  {
    console.log('User has granted access to local media.');

    localVideo.attr('src', URL.createObjectURL(stream));

    localStream = stream;
  },
  function(error)
  {
    console.error(error);
  });
});