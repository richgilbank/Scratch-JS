/*----------------------------------
  Settings and storage
 ---------------------------------*/
function Settings() {
  var _this = this;
  var DEFAULTS = this.data = {
    transpiler: '6to5'
  }

  // Check for latest settings
  this.get(function(data) {
    // If there's no data stored, store the defaults
    if(typeof data === undefined || !data.hasOwnProperty('transpiler')) {
      _this.set(DEFAULTS);
    }
    else {
      _this.data = data;
    }
  });
}

Settings.prototype.get = function(cb) {
  chrome.storage.sync.get('settings', cb);
}

Settings.prototype.set = function(settings, cb) {
  cb = cb || function(){}
  chrome.storage.sync.set({settings: settings}, cb);
}


/*----------------------------------
  The Repl interface / app
 ---------------------------------*/
var combinationKey = 'metaKey';
function Repl() {
  this.RUNTIME_PATHS = {
    'traceur': 'node_modules/traceur/bin/traceur-runtime.js'
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
  this.addEventListeners.call(this);
  this.settings = new Settings();
}

Repl.prototype.onDomReady = function() {
  if(this.settings.data.transpiler in this.RUNTIME_PATHS) {
    var str = "var st = document.createElement('script'); st.src = '"+chrome.extension.getURL(this.RUNTIME_PATHS[this.settings.data.transpiler])+"'; (document.head||document.documentElement).appendChild(st);"
    chrome.devtools.inspectedWindow.eval(str)
  }

  this.editor = CodeMirror.fromTextArea(document.querySelector("textarea"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    tabSize: 2,
    autoCloseBrackets: true,
    theme: 'solarized dark'
  });

  chrome.runtime.sendMessage('platformInfo', function(info) {
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
    else if(this.settings.data.transpiler === '6to5') {
      var es5 = to5.transform(content).code;
    }
    chrome.devtools.inspectedWindow.eval(es5, function(result, exceptionInfo) {
      if(typeof exceptionInfo !== 'undefined' && exceptionInfo.hasOwnProperty('isException'))
        logError(exceptionInfo.value);
    });
  }
  catch (e) {
    logError(e);
  }
}

Repl.prototype.addEventListeners = function() {
  var _this = this;

  document.querySelector('.execute-script').addEventListener('click', function(){
    _this.deliverContent(_this.editor.getValue());
  });

  document.querySelector('.open-settings').addEventListener('click', function() {
    document.querySelector('.settings-panel').classList.toggle('is-active');
  });

  document.querySelector('.close-settings').addEventListener('click', function() {
    document.querySelector('.settings-panel').classList.remove('is-active');
  });

  [].forEach.call(document.querySelectorAll('input[name="transpiler"]'), function (el) {
    el.addEventListener('click', function(e) {
      _this.settings.set({ transpiler: e.target.value });
    });
  });

  document.onkeydown = function(e){
    if(e[combinationKey] && e.which == 13){
      _this.deliverContent(_this.editor.getValue());
    }
    if(e[combinationKey] && e.which == 48) {
      location.reload();
    }
  }
}

// Instantiate the object
var repl = new Repl();

function logError(err) {
  chrome.devtools.inspectedWindow.eval("console.error(\"" + err + "\");");
}
