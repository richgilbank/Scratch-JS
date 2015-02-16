/*----------------------------------
  Events - Basic PubSub
 ---------------------------------*/
var Events = function() {};
Events.prototype = {
  _events: {},
  on: function(event, callback) {
    this._events[event] = this._events[event] || [];
    this._events[event].push(callback);
  },
  trigger: function(event) {
    if(!this._events.hasOwnProperty(event)) return;
    for(handler of this._events[event]) {
      handler.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
}
