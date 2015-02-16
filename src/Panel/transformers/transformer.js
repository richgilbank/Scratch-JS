function Transformer() {
  bus.on('transformers:register', this.registerSelf, this);
  bus.on('settings:changed:transformer', this.onTransformerChange, this);
}

// Attributes to override on the subclass
Transformer.prototype = {
  // Required
  name: false,
  handle: false,
  runtimePath: false,
  transform: function(input) { return ''; },

  // Optional
  beforeTransform: function() {},

  // Internal
  _active: false
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

Transformer.prototype.onTransformerChange = function(newTransformer) {
  if(this._active && newTransformer !== this.handle) {
    // TODO: Remove runtime
  } else if(newTransformer === this.handle) {
    this.insertRuntime();
    this._active = true;
  }
}

Transformer.prototype.registerSelf = function() {
  return this;
}
