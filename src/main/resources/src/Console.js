/**
 * Object that piggy-back the browser console and show their messages on a DIV
 *
 * Inspired by Node.js ClIM module (https://github.com/epeli/node-clim)
 *
 * @constructor
 *
 * @param {String} id: id attribute of the DIV tag where to show the messages
 * @param console: reference to the original browser console
 */
function Console(id, console)
{
//  var div = document.getElementById(id);
  var div = $('#'+id);


  /**
   * Show an Error message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.error = function(msg)
  {
    console.error(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    msg = '<span style="color: #FF0000">'+msg+'</span>';

    div.html(div.html() + msg + '<br>');
  }

  /**
   * Show an Warn message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.warn = function(msg)
  {
    console.warn(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    msg = '<span style="color: #FFFF00">'+msg+'</span>';

    div.html(div.html() + msg + '<br>');
  }

  /**
   * Show an Info message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.info = this.log = function(msg)
  {
    console.info(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    div.html(div.html() + msg + '<br>');
  }

  /**
   * Show an Debug message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.debug = function(msg)
  {
    console.log(msg);

    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    msg = '<span style="color: #0000FF">'+msg+'</span>';

    div.html(div.html() + msg + '<br>');
  }
}