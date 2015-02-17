function Babel() {
  Transformer.call(this);

  this.name = 'Babel';
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
  return to5.transform(input, this.opts).code;
}

var babelTransformer = new Babel();
