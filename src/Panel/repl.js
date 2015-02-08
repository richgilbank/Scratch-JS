/*----------------------------------
  Settings and storage
 ---------------------------------*/
function Settings(repl) {
  var _this = this;
  this.domReady = false;
  this.repl = repl;
  this.DEFAULTS = this.data = {
    transpiler: 'to5'
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Settings.prototype.onDomReady = function() {
  var _this = this;
  this.domReady = true;

  // Check for latest settings
  this.get(function(data) {
    // If there's no data stored, store the defaults
    if(typeof data === undefined || !data.hasOwnProperty('transpiler')) {
      _this.set(_this.DEFAULTS, function() {
        _this.setFormDefaults(_this.data);
      });
    }
    else {
      _this.data = data;
      _this.setFormDefaults(data);
    }

    _this.repl.insertRuntime();
  });

  document.querySelector('.open-settings').addEventListener('click', function() {
    document.querySelector('.settings').classList.toggle('is-active');
  });

  document.querySelector('.settings__close-btn').addEventListener('click', function() {
    document.querySelector('.settings').classList.remove('is-active');
  });

  [].forEach.call(document.querySelectorAll('input[name="transpiler"]'), function (el) {
    el.addEventListener('click', function(e) {
      _this.set({ transpiler: e.target.value });
    });
  });
}

Settings.prototype.setFormDefaults = function() {
  document.querySelector('[name="transpiler"][value="' + this.data.transpiler + '"]').checked = true;
}

Settings.prototype.loadingOn = function() {
  [].forEach.call(document.querySelectorAll('.loading'), function(el) {
    if(this.domReady)
      el.classList.add('is-active');
  }.bind(this));
}

Settings.prototype.loadingOff = function() {
  [].forEach.call(document.querySelectorAll('.loading'), function(el) {
    setTimeout(function(){el.classList.remove('is-active') }, 500);
  }.bind(this));
}

Settings.prototype.get = function(cb) {
  var _this = this;
  this.loadingOn();
  // FIXME: https://code.google.com/p/chromium/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&groupby=&sort=&id=178618
  // chrome.storage.sync.get('settings', function(data) {
  chrome.runtime.sendMessage({name: 'getSettings'}, function(data) {
    _this.loadingOff();
    cb(data || {});
  });
}

Settings.prototype.set = function(settings, cb) {
  var _this = this;
  this.loadingOn();
  // FIXME: https://code.google.com/p/chromium/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&groupby=&sort=&id=178618
  // chrome.storage.sync.set({settings: settings}, function() {
  chrome.runtime.sendMessage({name: 'setSettings', value: settings}, function(data) {
    var tempSettings = _this.data;
    _this.data = settings;
    if(tempSettings.transpiler !== settings.transpiler) {
     _this.repl.insertRuntime();
    }
    _this.loadingOff();
    if(typeof cb === 'function')
      cb();
  });
}


/*----------------------------------
  The Repl interface / app
 ---------------------------------*/
var combinationKey = 'metaKey';
function Repl() {
  this.RUNTIME_PATHS = {
    'traceur': 'node_modules/traceur/bin/traceur-runtime.js',
    'to5': 'node_modules/6to5/browser-polyfill.js'
  }

  this.settings = new Settings(this);
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
  this.addEventListeners.call(this);

  this.editor = CodeMirror.fromTextArea(document.querySelector("textarea"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    tabSize: 2,
    autoCloseBrackets: true,
    theme: 'solarized dark'
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

  document.onkeydown = function(e){
    if(e[combinationKey] && e.which == 13){
      _this.deliverContent(_this.editor.getValue());
    }
  }
}

// Instantiate the object
var repl = new Repl();

function logError(err) {
  chrome.devtools.inspectedWindow.eval("console.error(\"" + err + "\");");
}
