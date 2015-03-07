function Babel() {
  Transformer.call(this);

  this.name = 'Babel (' + this.getVersion() + ')';
  this.handle = 'babel';
  this.runtimePath = 'node_modules/babel/browser-polyfill.js';
  this.opts = {
    experimental: true
  };
}

// Inherit from Transformer
Babel.prototype = Object.create(Transformer.prototype);
Babel.prototype.constructor = Babel;

Babel.prototype.transform = function(input) {
  return babel.transform(input, this.opts).code;
}

Babel.prototype.getVersion = function() {
  return babel.version;
}

var babelTransformer = new Babel();
