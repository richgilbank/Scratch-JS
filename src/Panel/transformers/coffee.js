function Coffee() {
  Transformer.call(this);

  this.name = 'CoffeeScript';
  this.handle = 'coffee';
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

var coffeeTransformer = new Coffee();
