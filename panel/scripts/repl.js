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
    output: $('.output')[0],
    input: $('.input')[0]
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Repl.prototype.loadContexts = function() {
  chrome.devtools.inspectedWindow.getResources(function(resources) {
    var resources = Array.prototype.filter.call(resources, function(resource) {
      if(resource.type === 'document') return true;
      return false;
    }).map(function(context) {
      return {
        url: context,
        handle: context.url.split('/').slice(2).join('/').split('?')[0]
      }
    });

    var optionString = '<option value="top">&lt;top frame&gt;</option>';
    resources.forEach(function(resource) {
      optionString += '<option value="' + resource.url + '">' + resource.handle + '</option>';
    });

    $('.execution-context-selector')[0].innerHTML = optionString;
  });
}

Repl.prototype.onDomReady = function() {
  this.loadContexts();
  this.addEventListeners(this);

  this.width = window.innerWidth;

  this.editor = CodeMirror.fromTextArea($('#input')[0], {
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
      $('#combinationKey')[0].textContent = 'Ctrl';
    }
  });
}

Repl.prototype.deliverContent = function(content){
  var transformer = this.transformers[this.settings.data.transformer];
  transformer.beforeTransform();

  try {
    var es5 = transformer.transform(content);

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
  this.output = this.output || CodeMirror.fromTextArea($('#output')[0], {
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
    this.updateOutput();
  }
};

Repl.prototype.updateOutput = function() {
  if(this.output === undefined) return;
  try {
    var input = this.editor.getValue();
    var es5 = this.transformers[this.settings.data.transformer].transform(input);
    this.output.setValue(es5);
  } catch(e) {}
}

Repl.prototype.onWindowResize = function() {
  this.width = window.innerWidth;
};

Repl.prototype.onResizeMousedown = function() {
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

  $('.execute-script')[0].addEventListener('click', function(){
    _this.deliverContent(_this.editor.getValue());
  });

  $('#toggleOutput')[0].addEventListener('click', function(e){
    _this.toggleOutput(e);
  });

  document.addEventListener('keydown', debounce(_this.updateOutput, 200, _this));
  document.addEventListener('keydown', function(e) {
    if(e[combinationKey] && e.which == 13) {
      _this.deliverContent(_this.editor.getValue());
    }
  });

  window.addEventListener('resize', debounce(this.onWindowResize.bind(this)), 200);
  $('#resize')[0].addEventListener('mousedown', debounce(this.onResizeMousedown.bind(this)), 200);

  bus.on('settings:changed:theme', function(theme) {
    this.editor.setOption('theme', theme);
    if(this.output) this.output.setOption('theme', theme);
  }, this);

  bus.on('settings:changed:transformer', function() {
    this.updateOutput();
  }, this);
}

// Instantiate the object
window.repl = new Repl();
