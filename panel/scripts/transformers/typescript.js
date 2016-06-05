function TypeScriptTransformer() {
  Transformer.call(this);

  this.name = 'TypeScript';
  this.handle = 'typescript';
  this.opts = {
    module: ts.ModuleKind.None,
  };
}

// Inherit from Transformer
TypeScriptTransformer.prototype = Object.create(Transformer.prototype);
TypeScriptTransformer.prototype.constructor = TypeScriptTransformer;

TypeScriptTransformer.prototype.transform = function(input) {
  try {
    var transpiled = ts.transpileModule(input, this.opts);
    return transpiled.outputText;
  }
  catch(err) {
    console.error('error', err);
  }
}

var typeScriptTransformer = new TypeScriptTransformer();
