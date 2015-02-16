function Traceur() {
  Transformer.call(this);

  this.name = 'Traceur';
  this.handle = 'traceur';
  this.runtimePath = 'node_modules/traceur/bin/traceur-runtime.js';
}

// Inherit from Transformer
Traceur.prototype = Object.create(Transformer.prototype);
Traceur.prototype.constructor = Traceur;

Traceur.prototype.beforeTransform = function() {
  traceur.options.experimental = true;
}

Traceur.prototype.transform = function(input) {
  return traceur.Compiler.script(input);
}

var traceurTransformer = new Traceur();
