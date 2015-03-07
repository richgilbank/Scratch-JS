function Coffee() {
  Transformer.call(this);

  this.name = 'CoffeeScript (' + this.getVersion() + ')';
  this.handle = 'coffee-script';
  this.opts = {
    bare: true
  };
}

// Inherit from Transformer
Coffee.prototype = Object.create(Transformer.prototype);
Coffee.prototype.constructor = Coffee;

Coffee.prototype.transform = function(input) {
  return CoffeeScript.compile(input, this.opts);
}

Coffee.prototype.getVersion = function() {
  return CoffeeScript.VERSION;
}

var coffeeTransformer = new Coffee();
