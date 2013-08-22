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
  this._div = document.getElementById(id);


  function createMessage(msg, color)
  {
    // Sanitize the input
    msg = msg.toString().replace(/</g, '&lt;');

    var span = document.createElement('SPAN');

    if(color != undefined)
      span.style.color = color;

    span.appendChild(document.createTextNode(msg));
    span.appendChild(document.createElement('BR'));

    return span;
  }


  /**
   * Show an Error message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.error = function(msg)
  {
    console.error(msg);

    this._div.appendChild(createMessage(msg, "#FF0000"));
  }

  /**
   * Show an Warn message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.warn = function(msg)
  {
    console.warn(msg);

    this._div.appendChild(createMessage(msg, "#FFFF00"));
  }

  /**
   * Show an Info message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.info = this.log = function(msg)
  {
    console.info(msg);

    this._div.appendChild(createMessage(msg));
  }

  /**
   * Show an Debug message both on browser console and on defined DIV
   *
   * @param msg: message or object to be shown
   */
  this.debug = function(msg)
  {
    console.log(msg);

    this._div.appendChild(createMessage(msg, "#0000FF"));
  }
}