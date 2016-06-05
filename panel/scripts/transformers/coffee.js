function Coffee() {
  Transformer.call(this);

  this.name = 'CoffeeScript (' + this.getVersion() + ')';
  this.handle = 'coffee-script';
  this.opts = {
    bare: true,
    filename: 'CoffeeScript'
  };
}

// Inherit from Transformer
Coffee.prototype = Object.create(Transformer.prototype);
Coffee.prototype.constructor = Coffee;

Coffee.prototype.beforeTransform = function() {
  bus.trigger('transformers:beforeTransform');
}

Coffee.prototype.transform = function(input) {
  try{
    var ret = CoffeeScript.compile(input, this.opts);
    return ret;
  }
  catch(err){
    if(err.name === "SyntaxError"){
      bus.trigger("transformers:error", {
        name: 'SyntaxError',
        message: err.toString(),
        line: err.location.first_line,
        column: err.location.first_column
      });
    }
    else{
      throw err;
    }
  }
  return null;
}

Coffee.prototype.getVersion = function() {
  return CoffeeScript.VERSION;
}

var coffeeTransformer = new Coffee();
