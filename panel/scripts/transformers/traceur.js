function TraceurTransformer() {
  Transformer.call(this);

  this.name = 'Traceur (' + this.getVersion() + ')';
  this.handle = 'traceur';
  this.runtimePath = 'node_modules/traceur/bin/traceur-runtime.js';
}

// Inherit from Transformer
TraceurTransformer.prototype = Object.create(Transformer.prototype);
TraceurTransformer.prototype.constructor = TraceurTransformer;

TraceurTransformer.prototype.transform = function(input) {
  try {
    var options = traceur.util.Options.experimental(true);
    options.script = true;
    options.importRuntime = false; // https://github.com/google/traceur-compiler/issues/2126
    var compiler = new traceur.Compiler(options);
    return compiler.compile(input);
  }
  catch(err) {
    if(err.name === "MultipleErrors"){
      bus.trigger("transformers:error", {
        name: 'SyntaxError',
        message: err.message,
        line: 0 // no err.line from traceur :'(
      });
    }
    else {
      throw err;
    }
    return null;
  }
}

TraceurTransformer.prototype.getVersion = function() {
  var loader = new traceur.loader.TraceurLoader();
  return loader.version;
}

var traceurTransformer = new TraceurTransformer();
