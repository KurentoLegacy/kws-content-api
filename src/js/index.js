$(function(event)
{
  var txtUri = $('#txtUri');
  var btnConnect = $('#btnConnect');
  var btnTerminate = $('#btnTerminate');
  var video = $('#video');
  var divLog = $('#divLog');


  function error(msg)
  {
    // Sanitize the input
    msg = msg.replace(/</g, '&lt;');

    msg = '<span style="color: #FF0000; padding-left: 15px">'+msg+'</span>';

    divLog.html(divLog.html() + msg + '<br>');
  }

  function info(msg)
  {
    // Sanitize the input
    msg = msg.replace(/</g, '&lt;');

    divLog.html(divLog.html() + msg + '<br>');
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

      info("Connection terminated by user");

      // Enable connect button
      btnConnect.attr('disabled', false);
      txtUri.attr('disabled', false);
    });
  }


  btnConnect.on('click', function(event)
  {
    // Disable connect button
    btnConnect.attr('disabled', true);
    txtUri.attr('disabled', true);

    // Create a new connection
    var uri = txtUri.val();
    var conn = new WebRtcContent(uri);

    info("Connection created pointing to '"+uri+"'");

    // Set and enable the terminate button
    setTerminate(conn);

    // Set connection success and error events
    conn.onopen = function(event)
    {
      info("Connection openned");

      // Set the incoming stream on the video tag
      video.attr('src', event.stream);

      // Enable terminate button
      btnTerminate.attr('disabled', false);
    };
    conn.onclose = function(event)
    {
      info("Connection clossed");
    };

    conn.onerror = function(event)
    {
      // Notify to the user of the error
      error(event.error);
      console.error(event);

      // Enable connect button
      btnConnect.attr('disabled', false);
    };
  });
});