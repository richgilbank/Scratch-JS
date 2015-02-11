/*----------------------------------
  Settings and storage
 ---------------------------------*/
function Settings(repl) {
  var _this = this;
  this.domReady = false;
  this.repl = repl;
  this.DEFAULTS = this.data = {
    transpiler: 'to5',
    theme: 'solarized dark'
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
      for(key in data) {
        _this.repl.bus.trigger('settings:changed:' + key, data[key]);
      }
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

  [].forEach.call(document.querySelectorAll('input[name="theme"]'), function (el) {
    el.addEventListener('click', function(e) {
      _this.set({ theme: e.target.value });
    });
  });
}

Settings.prototype.setFormDefaults = function() {
  document.querySelector('[name="transpiler"][value="' + this.data.transpiler + '"]').checked = true;
  document.querySelector('[name="theme"][value="' + this.data.theme + '"]').checked = true;
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
  var updatedSettings = this.data;
  for(i in settings) {
    updatedSettings[i] = settings[i];
  }
  // FIXME: https://code.google.com/p/chromium/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&groupby=&sort=&id=178618
  // chrome.storage.sync.set({settings: settings}, function() {
  chrome.runtime.sendMessage({name: 'setSettings', value: updatedSettings}, function(data) {
    _this.data = updatedSettings;
    _this.loadingOff();
    if(typeof cb === 'function')
      cb();

    for(key in settings) {
      _this.repl.bus.trigger('settings:changed:' + key, settings[key]);
    }
  });
}


/*----------------------------------
  Events
 ---------------------------------*/
var Events = function() {};
Events.prototype = {
  _events: {},
  on: function(event, callback) {
    this._events[event] = this._events[event] || [];
    this._events[event].push(callback);
  },
  trigger: function(event) {
    if(!this._events.hasOwnProperty(event)) return;
    for(handler of this._events[event]) {
      handler.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
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

  this.bus = new Events();
  this.settings = new Settings(this);

  this.DOM = {
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

Repl.prototype.toggleOutput = function() {
  this.output = this.output || CodeMirror.fromTextArea(document.getElementById("output"), {
    lineNumbers: true,
    tabSize: 2,
    readOnly: true,
    theme: 'solarized light'
  });

  this.DOM.output.classList.toggle('is-hidden');
  this.DOM.input.classList.toggle('is-reduced');

  if (!this.DOM.output.classList.contains('is-hidden')) {
    this.deliverContent(this.editor.getValue());
  }

};

Repl.prototype.addEventListeners = function() {
  var _this = this;

  document.querySelector('.execute-script').addEventListener('click', function(){
    _this.deliverContent(_this.editor.getValue());
  });

  document.getElementById('toggleOutput').addEventListener('click', this.toggleOutput.bind(this));

  document.onkeydown = function(e){
    if(e[combinationKey] && e.which == 13) {
      _this.deliverContent(_this.editor.getValue());
    }
    if(e[combinationKey] && e.which == 48) {
      location.reload();
    }
  }

  this.bus.on('settings:changed:theme', function(theme) {
    _this.editor.setOption('theme', theme)
  });

  this.bus.on('settings:changed:transpiler', function(transpiler) {
    _this.insertRuntime();
  });
}

// Instantiate the object
var repl = new Repl();

function logError(err) {
  chrome.devtools.inspectedWindow.eval("console.error(\"" + err + "\");");
}
