function Babel() {
  Transformer.call(this);

  this.name = 'Babel (' + this.getVersion() + ')';
  this.handle = 'babel';
  this.runtimePath = 'node_modules/babel-core/browser-polyfill.js';
  this.opts = {
    experimental: true
  };
}

// Inherit from Transformer
Babel.prototype = Object.create(Transformer.prototype);
Babel.prototype.constructor = Babel;

Babel.prototype.beforeTransform = function(){
  bus.trigger('transformers:beforeTransform');
}

Babel.prototype.transform = function(input) {
  try {
    var ret = babel.transform(input, this.opts).code;
    return ret;
  }
  catch(err) {
    if(err.name === "SyntaxError"){
      bus.trigger("transformers:error", {
        name: 'SyntaxError',
        message: err.message,
        line: err.loc.line - 1,
        column: err.loc.column
      });
    }
    else {
      throw err;
    }
    return null;
  }
}

Babel.prototype.getVersion = function() {
  return babel.version;
}

var babelTransformer = new Babel();
