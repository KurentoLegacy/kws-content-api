/**
 * Object that piggy-back the browser console and show their messages on a DIV
 *
 * Inspired by Node.js ClIM module (https://github.com/epeli/node-clim)
 *
 * @param {String} id: id attribute of the DIV tag where to show the messages
 */
function Console(id, console)
{
//  var div = document.getElementById(id);
  var div = $('#'+id);


  this.error = function(msg)
  {
    console.error(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    msg = '<span style="color: #FF0000">'+msg+'</span>';

    div.html(div.html() + msg + '<br>');
  }

  this.warn = function(msg)
  {
    console.warn(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    msg = '<span style="color: #FFFF00">'+msg+'</span>';

    div.html(div.html() + msg + '<br>');
  }

  this.info = this.log = function(msg)
  {
    console.info(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    div.html(div.html() + msg + '<br>');
  }

  this.debug = function(msg)
  {
    console.log(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    msg = '<span style="color: #0000FF">'+msg+'</span>';

    div.html(div.html() + msg + '<br>');
  }
}