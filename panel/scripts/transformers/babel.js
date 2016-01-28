function BabelTransformer() {
  Transformer.call(this);

  this.name = 'Babel (' + this.getVersion() + ')';
  this.handle = 'babel';
  this.runtimePath = 'node_modules/babel-core/browser-polyfill.min.js'
  this.opts = {
    presets: [
      'es2015',
      'stage-0',
      'stage-1'
    ]
  };
}

// Inherit from Transformer
BabelTransformer.prototype = Object.create(Transformer.prototype);
BabelTransformer.prototype.constructor = BabelTransformer;

BabelTransformer.prototype.beforeTransform = function(){
  bus.trigger('transformers:beforeTransform');
}

BabelTransformer.prototype.transform = function(input) {
  try {
    var ret = Babel.transform(input, this.opts).code;
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

BabelTransformer.prototype.getVersion = function() {
  return Babel.version;
}

var babelTransformer = new BabelTransformer();
