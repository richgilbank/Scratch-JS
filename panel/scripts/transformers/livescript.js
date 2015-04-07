var LS = require('LiveScript');

function LiveScript() {
  Transformer.call(this);

  this.name = 'LiveScript (' + this.getVersion() + ')';
  this.handle = 'LiveScript';
  this.opts = {
    bare: true
  }
}

// Inherit from Transformer
LiveScript.prototype = Object.create(Transformer.prototype);
LiveScript.prototype.constructor = LiveScript;

LiveScript.prototype.transform = function(input) {
  return LS.compile(input, this.opts);
}

LiveScript.prototype.getVersion = function() {
  return LS.VERSION;
}

var livescriptTransformer = new LiveScript();
