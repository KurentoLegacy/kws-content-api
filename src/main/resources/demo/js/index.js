$(function(event)
{
  var txtUri = $('#txtUri');
  var btnPlayStop = $('#btnPlayStop');
  var video = $('#video');
  var rangeVolume = $('#rangeVolume');
  var viewer = $('#viewer');

  console = new Console('console', console);


  var conn = null;

  function destroyConnection()
  {
    // Enable connect button
    btnPlayStop.html("Play");
    btnPlayStop.attr('disabled', false);

    txtUri.attr('disabled', false);

    conn = null;
  }

  function initConnection()
  {
    // Set connection success and error events
    conn.onstart = function(event)
    {
      console.log("Connection started");

      // Enable terminate button
      btnPlayStop.html("Stop");
      btnPlayStop.attr('disabled', false);
    };
    conn.onterminate = function(event)
    {
      console.log("Connection terminated");
    };

    conn.onremotestream = function(event)
    {
      console.info("RemoteStream set to "+event.data);
    }

    conn.onmediaevent = function(event)
    {
      var data = event.data;

      data = data.data;
      if(data.substr(0, 4) == "http")
        viewer.attr('src', data);
      else
        console.info(data);
    }

    conn.onerror = function(error)
    {
      destroyConnection()

      // Notify to the user of the error
      console.error(error.message);
    };
  }


  btnPlayStop.on('click', function(event)
  {
    // Disable terminate button
    btnPlayStop.attr('disabled', true);

    if(conn)
    {
      // Terminate the connection
      conn.terminate();

      console.log("Connection terminated by user");

      destroyConnection()
    }

    else
    {
      txtUri.attr('disabled', true);

      // Create a new connection
      var uri = txtUri.val();

      var options =
      {
        remoteVideoTag: 'video'
      };

      try
      {
        conn = new KwsContent(uri, options);

        console.log("Connection created pointing to '"+uri+"'");

        initConnection();
      }
      catch(error)
      {
        destroyConnection()

        // Notify to the user of the error
        console.error(error.message)
      }
    }
  });

  rangeVolume.on('change', function(event)
  {
    video[0].volume = rangeVolume.val();
  })
});