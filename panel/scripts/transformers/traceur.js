function Traceur() {
  Transformer.call(this);

  this.name = 'Traceur (' + this.getVersion() + ')';
  this.handle = 'traceur';
  this.runtimePath = 'node_modules/traceur/bin/traceur-runtime.js';
}

// Inherit from Transformer
Traceur.prototype = Object.create(Transformer.prototype);
Traceur.prototype.constructor = Traceur;

Traceur.prototype.transform = function(input) {
  try {
    var options = traceur.util.Options.experimental(true);
    options.script = true;
    var compiler = new traceur.Compiler(options);
    return compiler.compile(input);
  }
  catch(err) {
    console.log('error', err.name);
  }
}

Traceur.prototype.getVersion = function() {
  var loader = new traceur.runtime.TraceurLoader();
  return loader.version;
}

var traceurTransformer = new Traceur();
