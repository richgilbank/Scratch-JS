function Transformer() {
  bus.on('transpilers:register', this.registerSelf, this);
  bus.on('settings:changed:transpiler', this.insertRuntime, this);
}

// Attributes to override on the subclass
Transformer.prototype = {
  // Required
  handle: false,
  runtimePath: false,
  transform: function(input) { return ''; },

  // Optional
  beforeTransform: function() {}
}

Transformer.prototype.insertRuntime = function() {
  if(!this.runtimePath) return false;
  var str =
    "if(!document.querySelector('#" + this.handle + "')) {" +
      "var st = document.createElement('script');" +
      "st.id='" + this.handle + "';" +
      "st.src = '" + chrome.extension.getURL(this.runtimePath) + "';" +
      "document.head.appendChild(st);" +
    "}";
  chrome.devtools.inspectedWindow.eval(str)
}

Transformer.prototype.registerSelf = function() {
  return this;
}
