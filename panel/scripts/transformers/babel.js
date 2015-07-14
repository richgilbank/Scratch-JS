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
      var message = "<pre>" + err.toString() + "</pre>";
      bus.trigger("transformers:error", {
        line: err.loc.line - 1,
        column: err.loc.column
      }, message);
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
