function JavaScript() {
  Transformer.call(this);

  this.name = 'JavaScript';
  this.handle = 'javascript';
}

JavaScript.prototype = Object.create(Transformer.prototype);
JavaScript.prototype.constructor = JavaScript;

JavaScript.prototype.transform = function(input) {
  return input;
}

var javascriptTransformer = new JavaScript();
