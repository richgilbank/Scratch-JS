function Traceur() {
  Transformer.call(this);

  this.handle = 'traceur';
  this.runtimePath = 'node_modules/traceur/bin/traceur-runtime.js';
}

// Inherit from Transformer
Traceur.prototype = Object.create(Transformer.prototype);
Traceur.prototype.constructor = Traceur;

Traceur.prototype.beforeTransform = function() {
  debugger
  traceur.options.experimental = true;
}

Traceur.prototype.transform = function(input) {
  return traceur.Compiler.script(input);
}

var traceurTransformer = new Traceur();
