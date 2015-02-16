/*----------------------------------
  The Repl interface / app
 ---------------------------------*/
var combinationKey = 'metaKey';
function Repl() {
  this.RUNTIME_PATHS = {
    'traceur': 'node_modules/traceur/bin/traceur-runtime.js',
    'to5': 'node_modules/6to5/browser-polyfill.js'
  }

  this.bus = new Events();
  this.settings = new Settings(this);

  this.DOM = {
    body: document.body,
    output: document.querySelector('.output'),
    input: document.querySelector('.input')
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Repl.prototype.insertRuntime = function() {
  var transpiler = this.settings.data.transpiler;
  if(this.RUNTIME_PATHS[transpiler]) {
    var str =
      "if(!document.querySelector('#"+transpiler+"')) {" +
        "var st = document.createElement('script');" +
        "st.id='"+ transpiler +"';" +
        "st.src = '"+chrome.extension.getURL(this.RUNTIME_PATHS[transpiler])+"';" +
        "(document.head||document.documentElement).appendChild(st);" +
      "}";
    chrome.devtools.inspectedWindow.eval(str)
  }
}

Repl.prototype.onDomReady = function() {
  var _this = this;
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
  if(this.settings.data.transpiler === 'traceur')
    traceur.options.experimental = true;

  try {
    if(this.settings.data.transpiler === 'traceur') {
      var es5 = traceur.Compiler.script(content);
    }
    if(this.settings.data.transpiler === 'to5') {
      var es5 = to5.transform(content).code;
    }

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

  this.bus.on('settings:changed:theme', function(theme) {
    _this.editor.setOption('theme', theme);
    if(_this.output) _this.output.setOption('theme', theme);
  });

  this.bus.on('settings:changed:transpiler', function(transpiler) {
    _this.insertRuntime();
  });
}

// Instantiate the object
var repl = new Repl();
