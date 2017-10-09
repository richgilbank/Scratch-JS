function BabelTransformer() {
  Transformer.call(this);

  this.name = 'Babel (' + this.getVersion() + ')';
  this.handle = 'babel';
  this.runtimePath = 'node_modules/babel-polyfill/dist/polyfill.min.js'
  this.opts = {
    filename: 'Babel',
    presets: [
      'latest',
      'stage-0' // includes stages 0, 1, 2, and 3
    ],
    plugins: [
      // disabled from stage-2 preset until update, see:
      // https://babeljs.io/docs/plugins/preset-stage-2/
      'transform-decorators-legacy'
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
    return Babel.transform(input, this.opts).code;
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
