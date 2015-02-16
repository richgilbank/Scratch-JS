function Babel() {
  Transformer.call(this);

  this.name = 'Babel';
  this.handle = 'to5';
  this.runtimePath = 'node_modules/6to5/browser-polyfill.js';
  this.opts = {
    experimental: true
  };
}

// Inherit from Transformer
Babel.prototype = Object.create(Transformer.prototype);
Babel.prototype.constructor = Babel;

Babel.prototype.transform = function(input) {
  return to5.transform(input, this.opts).code;
}

var babelTransformer = new Babel();
