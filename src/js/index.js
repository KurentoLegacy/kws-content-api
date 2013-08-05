$(function(event)
{
  var btnConnect = $('#btnConnect');

  btnConnect.on('click', function(event)
  {
    // Create a new connection
    var conn = new WebRtcContent('http://localhost:8000/video.mpg');

    // Set connection success and error events
    conn.onsuccess = function(event)
    {
      var stream = event.stream;

      $('#video').attr('src', stream);
    }
    conn.onerror = function(event)
    {
      console.error(event);
    }

    // Enable and init button to terminate the connection
    var btnTerminate = $('#btnTerminate');

    btnTerminate.one('click', function(event)
    {
      // Terminate the connection
      conn.terminate();

      // Swap enabled buttons (enable connect)
      btnTerminate.attr('disabled', true);
      btnConnect.attr('disabled', false);
    })

    // Swap enabled buttons (enable terminate)
    btnConnect.attr('disabled', true);
    btnTerminate.attr('disabled', false);
  })
})
