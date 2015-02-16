/*----------------------------------
  The Repl interface / app
 ---------------------------------*/
var combinationKey = 'metaKey';

function Repl() {

  var registered = bus.trigger('transformers:register');
  this.transformers = {};
  registered.forEach(function(v) {
    this.transformers[v.handle] = v;
  }, this);

  this.settings = new Settings(this);

  this.DOM = {
    body: document.body,
    output: document.querySelector('.output'),
    input: document.querySelector('.input')
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Repl.prototype.onDomReady = function() {
  this.addEventListeners.call(this);

  this.width = window.innerWidth;

  this.editor = CodeMirror.fromTextArea(document.getElementById("input"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    tabSize: 2,
    autoCloseBrackets: true,
    theme: this.settings.data.theme
  });

  chrome.runtime.sendMessage({name: 'platformInfo'}, function(info) {
    if (info.os !== 'mac') {
      combinationKey = 'ctrlKey';
      document.getElementById('combinationKey').textContent = 'Ctrl';
    }
  });
}

Repl.prototype.deliverContent = function(content){
  var transformer = this.transformers[this.settings.data.transformer];
  transformer.beforeTransform();

  try {
    var es5 = transformer.transform(content);

    if (this.output)
      this.output.setValue(es5);

    chrome.devtools.inspectedWindow.eval(es5, function(result, exceptionInfo) {
      if(typeof exceptionInfo !== 'undefined' && exceptionInfo.hasOwnProperty('isException'))
        logError(exceptionInfo.value);
    });
  }
  catch (e) {
    logError(e);
  }
}

Repl.prototype.toggleOutput = function(e) {
  this.output = this.output || CodeMirror.fromTextArea(document.getElementById("output"), {
    lineNumbers: true,
    tabSize: 2,
    readOnly: true,
    theme: this.settings.data.theme
  });

  this.DOM.output.classList.toggle('is-hidden');
  this.DOM.input.classList.toggle('is-reduced');
  this.DOM.input.style.width = "100%";

  e.target.classList.toggle('is-open');

  if (!this.DOM.output.classList.contains('is-hidden')) {
    this.deliverContent(this.editor.getValue());
  }

};

Repl.prototype.onWindowResize = function() {
  this.width = window.innerWidth;
};

Repl.prototype.onReizeMousedown = function() {
  var resizeOutput = this.resizeOutput.bind(this);
  this.DOM.body.classList.add('is-resizing');
  document.addEventListener('mousemove', resizeOutput);
  document.addEventListener('mouseup', function(){
    document.removeEventListener('mousemove', resizeOutput);
    this.DOM.body.classList.remove('is-resizing');
  }.bind(this));
};

Repl.prototype.resizeOutput = function(e) {
  var percentWidth = e.x / this.width * 100;
  this.DOM.input.style.width = percentWidth + "%";
  this.DOM.output.style.width = 100 - percentWidth + "%";
};

Repl.prototype.addEventListeners = function() {
  var _this = this;

  document.querySelector('.execute-script').addEventListener('click', function(){
    _this.deliverContent(_this.editor.getValue());
  });

  document.getElementById('toggleOutput').addEventListener('click', function(e){
    _this.toggleOutput(e);
  });

  document.onkeydown = function(e){
    if(e[combinationKey] && e.which == 13) {
      _this.deliverContent(_this.editor.getValue());
    }
  };

  window.addEventListener('resize', debounce(this.onWindowResize.bind(this)), 200);
  document.getElementById('resize').addEventListener('mousedown', debounce(this.onReizeMousedown.bind(this)), 200);

  bus.on('settings:changed:theme', function(theme) {
    this.editor.setOption('theme', theme);
    if(this.output) this.output.setOption('theme', theme);
  }, this);
}

// Instantiate the object
window.repl = new Repl();
