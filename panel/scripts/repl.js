var combinationKey = 'metaKey';

function Repl() {

  var registered = bus.trigger('transformers:register');
  this.transformers = {};
  registered.forEach((transformer) => this.transformers[transformer.handle] = transformer);

  this.executionContext = 'top';
  this.settings = new Settings(this);

  this.DOM = {
    body: document.body,
    output: document.querySelector('.output'),
    outputTextArea: document.querySelector('#output'),
    input: document.querySelector('.input'),
    inputTextArea: document.querySelector('#input'),
    contextSelector: document.querySelector('.execution-context-selector'),
    combinationKey: document.querySelector('#combinationKey'),
    executeScriptBtn: document.querySelector('#executeScript'),
    toggleOutputBtn: document.querySelector('#toggleOutput'),
    resizeDivider: document.querySelector('#resize'),
    topNav: document.querySelector('.top-nav'),
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Repl.prototype.onDomReady = function() {
  chrome.devtools.inspectedWindow.eval('document.location.href', function(currentUrl) {
    this.topLocation = currentUrl;
    this.loadContexts();
    chrome.devtools.inspectedWindow.onResourceAdded.addListener(this.loadContexts.bind(this));
  }.bind(this));

  this.addEventListeners(this);

  this.widgets = [];

  this.editor = CodeMirror.fromTextArea(this.DOM.inputTextArea, {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {
      "Ctrl-J": (cm) => {
        this.Vim.exitInsertMode(cm);
      },
      "Ctrl-Q": "toggleComment",
      "Ctrl-Space": "autocomplete"
    },
    tabSize: this.settings.data.tabSize || 2,
    indentUnit: this.settings.data.tabSize || 2,
    indentWithTabs: this.settings.data.indentWithTabs || false,
    autoCloseBrackets: true,
    theme: this.settings.data.theme,
    keyMap: this.settings.data.vimMode ? 'vim' : 'default'
  });

  // Need to dig in to grab Vim
  this.Vim = document.querySelector('.CodeMirror').CodeMirror.constructor.Vim

  chrome.runtime.sendMessage({name: 'platformInfo'}, function(info) {
    if (info.os !== 'mac') {
      combinationKey = 'ctrlKey';
      this.DOM.combinationKey.textContent = 'Ctrl';
    }
  }.bind(this));

  chrome.runtime.sendMessage({name: 'getCode'}, (data) => {
    if (data.code) {
      this.editor.setValue(data.code);
    }
  });
}

Repl.prototype.loadContexts = function() {
  chrome.devtools.inspectedWindow.getResources(function(resources) {
    var contexts = Array.prototype.filter.call(resources, function(resource) {
      if(resource.type === 'document') {
        if(resource.url === this.topLocation) return false;
        return true;
      }
      return false;
    }).map(function(resource) {
      return {
        url: resource.url,
        handle: resource.url.split('/').slice(2).join('/').split('?')[0]
      }
    });

    var optionString = '<option value="top">&lt;top frame&gt;</option>';
    contexts.forEach(function(resource) {
      var selectedString = resource.url === this.executionContext ? ' selected' : '';
      optionString += `<option value="${resource.url}" ${selectedString}>${resource.handle}</option>`;
    }, this);

    this.DOM.contextSelector.innerHTML = optionString;
  }.bind(this));
}

Repl.prototype.removeWidgets = function(){
  for (var i = 0; i < this.widgets.length; ++i){
    this.editor.removeLineWidget(this.widgets[i]);
  }
  this.widgets.length = 0;
}

Repl.prototype.deliverContent = function(content){
  var transformer = this.transformers[this.settings.data.transformer];
  transformer.beforeTransform();

  try {
    var es5 = transformer.transform(content);
    var evalOptions = {};
    if(this.executionContext !== 'top') evalOptions.frameURL = this.executionContext;
    if(typeof es5 == "string"){
      chrome.devtools.inspectedWindow.eval(es5, evalOptions, function(result, exceptionInfo) {
        if(typeof exceptionInfo !== 'undefined' && exceptionInfo.hasOwnProperty('isException'))
          logError(exceptionInfo.value);
      });
    }
  }
  catch (e) {
    logError(e);
  }
}

Repl.prototype.toggleOutput = function(e, state) {
  this.output = this.output || CodeMirror.fromTextArea(this.DOM.outputTextArea, {
    lineNumbers: true,
    tabSize: 2,
    readOnly: true,
    theme: this.settings.data.theme
  });

  switch (state) {
    case 'hidden':
      this.DOM.output.classList.remove('is-bottom');
      this.DOM.output.classList.add('is-hidden');
      this.DOM.input.style.height = '100%';
      this.DOM.output.style.height = '100%';
      e.target.classList.remove('is-open');
      break;
    case 'right':
      this.DOM.output.classList.remove('is-hidden');
      this.DOM.output.classList.add('is-right');
      this.DOM.input.style.width = '70%';
      this.DOM.output.style.width = '30%';
      e.target.classList.add('is-open');
      break;
    case 'bottom':
      this.DOM.output.classList.remove('is-right');
      this.DOM.output.classList.add('is-bottom');
      this.DOM.input.style.width = '100%';
      this.DOM.input.style.height = '70%';
      this.DOM.output.style.width = '100%';
      this.DOM.output.style.height = '30%';
      break;
  }

  if (!this.DOM.output.classList.contains('is-hidden')) {
    this.updateOutput();
  }
};

Repl.prototype.updateOutput = function() {
  if(this.output === undefined) return;
  try {
    var input = this.editor.getValue();
    var transformer = this.transformers[this.settings.data.transformer];
    transformer.beforeTransform();

    var es5 = transformer.transform(input);
    this.output.setValue(es5);

    this.output.refresh();
  } catch(e) {}
}

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
  if(this.DOM.output.classList.contains('is-right')) {
    var percentWidth = e.x / window.innerWidth * 100;
    this.DOM.input.style.width = percentWidth + "%";
    this.DOM.output.style.width = 100 - percentWidth + "%";
  } else {
    var percentHeight = e.y / window.innerHeight * 100;
    this.DOM.input.style.height = percentHeight + "%";
    this.DOM.output.style.height = 100 - percentHeight + "%";
  }
};

Repl.prototype.saveCode = function() {
  chrome.runtime.sendMessage({name: 'setCode', value: this.editor.getValue()});
}

Repl.prototype.addEventListeners = function() {
  this.DOM.executeScriptBtn.addEventListener('click', () => this.deliverContent(this.editor.getValue()));

  this.DOM.toggleOutputBtn.addEventListener('click', (function(e) {
    var _e = e, i = 0, states = ['hidden', 'right', 'bottom'];
    return function(_e) {
      i = ++i % states.length;
      this.toggleOutput(_e, states[i]);
    }.bind(this);
  }.bind(this))());

  this.DOM.contextSelector.addEventListener('change', (evt) => this.executionContext = evt.target.value);

  document.addEventListener('keydown', debounce(this.updateOutput, 200, this));
  document.addEventListener('keydown', debounce(this.saveCode, 1000, this));
  document.addEventListener('keydown', function(e) {
    if(e[combinationKey] && e.which == 13) {
      this.deliverContent(this.editor.getValue());
    }
  }.bind(this));
  document.addEventListener('keydown', function(e) {
    if(e.key === '?') {
      e.stopPropagation();
    }
  }, true);

  this.DOM.resizeDivider.addEventListener('mousedown', debounce(this.onResizeMousedown.bind(this)), 200);

  bus.on('settings:changed:theme', function(theme) {
    this.editor.setOption('theme', theme);
    if(this.output) this.output.setOption('theme', theme);

    // Set the top nav color
    var classes = Array.prototype.slice.call(document.querySelector('.input .CodeMirror').classList);
    this.DOM.topNav.className = classes.concat('top-nav').join(' ');
  }, this);

  bus.on('settings:changed:tabSize', (tabSize) => {
    this.editor.setOption('tabSize', tabSize);
    this.editor.setOption('indentUnit', tabSize);
  });
  bus.on('settings:changed:indentWithTabs', (useTabs) => this.editor.setOption('indentWithTabs', useTabs));
  bus.on('settings:changed:vimMode', (vimMode) => this.editor.setOption('vimMode', vimMode));
  bus.on('settings:changed:transformer', () => this.updateOutput());
  bus.on('transformers:beforeTransform', () => this.removeWidgets());

  bus.on('transformers:error',function(err){
    var msgEl = document.createElement("div");
    msgEl.className = "line-error";
    var icon = msgEl.appendChild(document.createElement("span"));
    icon.innerHTML = "!";
    icon.className = "line-error-icon";

    var message = "<pre>" + err.name + ": ";
    message += err.message + "\n";
    message += "</pre>";

    var msgInfoEl = document.createElement("div");
    msgInfoEl.className = 'line-error-info';
    msgInfoEl.innerHTML = message;
    msgEl.appendChild(msgInfoEl);

    this.widgets.push(this.editor.addLineWidget(err.line, msgEl, {coverGutter: false, noHScroll: true}));
  }, this);
}

// Instantiate the object
window.repl = new Repl();
