$(function(event)
{
  var btnConnect = $('#btnConnect');
  var btnTerminate = $('#btnTerminate');
  var txtUri = $('#txtUri');


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

      // Enable connect button
      btnConnect.attr('disabled', false);
      txtUri.attr('disabled', false);
    })
  }


  btnConnect.on('click', function(event)
  {
    // Disable connect button
    btnConnect.attr('disabled', true);
    txtUri.attr('disabled', true);

    // Create a new connection
    var conn = new WebRtcContent(txtUri.val());

    // Set and enable the terminate button
    setTerminate(conn);

    // Set connection success and error events
    conn.onerror = function(event)
    {
      // Notify to the user of the error
      alert(event.error);

      // Enable connect button
      btnConnect.attr('disabled', false);
    }
    conn.onsuccess = function(event)
    {
      // Set the incoming stream on the video tag
      $('#video').attr('src', event.stream);

      // Enable terminate button
      btnTerminate.attr('disabled', false);
    }
  })
})