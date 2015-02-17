/*----------------------------------
  Events - Basic PubSub
 ---------------------------------*/
var Events = function() {};
Events.prototype = {
  _events: {},

  on: function(event, callback, context) {
    context = context || this;
    this._events[event] = this._events[event] || [];
    this._events[event].push({
      callback: callback,
      context: context
    });
  },

  trigger: function(event) {
    if(!this._events.hasOwnProperty(event)) return;
    var responses = [];
    for(handler of this._events[event]) {
      var args = Array.prototype.slice.call(arguments, 1);
      responses.push(handler.callback.apply(handler.context, args));
    }
    return responses;
  }
}
