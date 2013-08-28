$(function(event) {
	var txtUri = $('#txtUri');
	var btnPlayStop = $('#btnPlayStop');
	var video = $('#video');
	var rangeVolume = $('#rangeVolume');
	var viewer = $('#viewer');
//	viewer.on('load', function() {
//		viewer.css('visibility', 'visible');
//	});
	var eventTypeTxt = $('#eventTypeTxt');
	var eventValueTxt = $('#eventValueTxt');

	console = new Console('console', console);

	var conn = null;

	function destroyConnection() {
		// Enable connect button
		btnPlayStop.html("Play");
		btnPlayStop.attr('disabled', false);

		txtUri.attr('disabled', false);

		conn = null;
	}

	function initConnection() {
		// Set connection success and error events
		conn.onstart = function(event) {
			console.log("Connection started");

			// Enable terminate button
			btnPlayStop.html("Stop");
			btnPlayStop.attr('disabled', false);
		};
		conn.onterminate = function(event) {
			console.log("Connection terminated");
		};

		conn.onremotestream = function(event) {
			console.info("RemoteStream set to " + event.data);
		}

		conn.onmediaevent = function(event) {
			var data = event.data;

			eventTypeTxt.text("Event type: " + data.type);

			data = data.data;
			if(data.substr(0, 4) == "http")
			{
				// Animate arrow to right
				var arrowRight = $('#arrowRight');
				var left = arrowRight.css("left");
				var newLeft = $(window).width()
						- (arrowRight.width() + parseInt(left));

				// [Hack] delay event to synchronize with video image
				setTimeout(function()
				{
					// Show event url value
					eventValueTxt.html('Event data: <a href="'+data+'">'+data+'</a>');

					// Update iframe content with a fade-to-white effect
					viewer.attr('src', "about:blank");
					setTimeout(function()
					{
						viewer.attr('src', data);
					}, 0);

					//viewer.css('visibility', 'hidden');
					arrowRight
						.fadeIn('slow')
						.animate({left: newLeft}, 1000)
						.fadeOut('slow')
						.animate({left: left}, 0);

					// Make appear iframe content
					// viewer.attr('src', data);

				}, 3600);
			} else {
				eventValueTxt.text("Event data: " + data);

				// Animate arrow to down
				var arrowDown = $('#arrowDown');
				var top = arrowDown.css("top");
				var newTop = $(window).height() -(arrowDown.height() + parseInt(top));

				arrowDown
					.fadeIn('fast')
					.animate({top: newTop}, 'slow')
					.fadeOut('fast')
					.animate({top: top}, 0);

				console.info(data);
			}
		}

		conn.onerror = function(error) {
			destroyConnection()

			// Notify to the user of the error
			console.error(error.message);
		};
	}

	function playVideo() {
		// Disable terminate button
		btnPlayStop.attr('disabled', true);

		if (conn) {
			// Terminate the connection
			conn.terminate();

			console.log("Connection terminated by user");

			destroyConnection()
		}

		else {
			txtUri.attr('disabled', true);

			// Create a new connection
			var uri = txtUri.val();

			var options = {
				remoteVideoTag : 'video'
			};

			try {
				conn = new KwsContent(uri, options);

				console.log("Connection created pointing to '" + uri + "'");

				initConnection();
			} catch (error) {
				destroyConnection()

				// Notify to the user of the error
				console.error(error.message)
			}
		}
	}

	btnPlayStop.on('click', playVideo);

	txtUri.keydown(function(event) {
		var key = event.which || event.keyCode;
		if (key === 13)
			playVideo();
	})

	rangeVolume.on('change', function(event) {
		video[0].volume = rangeVolume.val();
	})
});