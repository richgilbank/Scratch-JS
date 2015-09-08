/*----------------------------------
  Settings and storage
 ---------------------------------*/
function Settings(repl) {
  var _this = this;
  this.domReady = false;
  this.repl = repl;
  this.DEFAULTS = this.data = {
    transformer: 'babel',
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: true,
    theme: 'default'
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Settings.prototype.onDomReady = function() {
  var _this = this;
  this.domReady = true;

  document.querySelector('.transformer-options').innerHTML = _this.transformerOptionTemplate(this.repl.transformers);

  // Check for latest settings
  this.get(function(data) {
    // If there's no data stored, store the defaults
    if(typeof data === undefined || !data.hasOwnProperty('transformer')) {
      _this.set(_this.DEFAULTS, function() {
        _this.setFormDefaults(_this.data);
      });
    }
    else {
      _this.data = data;
      _this.setFormDefaults(data);
      for(key in data) {
        bus.trigger('settings:changed:' + key, data[key]);
      }
    }
  });

  document.querySelector('.open-settings').addEventListener('click', function() {
    document.querySelector('.settings').classList.toggle('is-active');
  });

  document.querySelector('.settings__close-btn').addEventListener('click', function() {
    document.querySelector('.settings').classList.remove('is-active');
  });

  document.querySelector('.transformer-options').addEventListener('click', function(e) {
    if(e.target.name === 'transformer')
      _this.set({ transformer: e.target.value });
  });

  [].forEach.call(document.querySelectorAll('input[name="theme"]'), function (el) {
    el.addEventListener('click', function(e) {
      _this.set({ theme: e.target.value });
    });
  });
  //editor
  [].forEach.call(document.querySelectorAll('input[name="tabSize"]'), function (el) {
    el.addEventListener('change', function(e) {
      var val = parseInt(e.target.value)
      _this.set({ tabSize: val });
      _this.set({ indentUnit: val });

    });
  });
  [].forEach.call(document.querySelectorAll('input[name="indentWithTabs"]'), function (el) {
    el.addEventListener('change', function(e) {
      var val = document.querySelectorAll('input[name="indentWithTabs"]:checked')[0].value
      val = val == "true"?true:false;
      _this.set({ indentWithTabs: val });
    });
  });
}

Settings.prototype.transformerOptionTemplate = function(transformers) {
  var template = '';
  for(var i in transformers) {
    var t = transformers[i];
    template +=
      '<div class="settings__option-container">' +
        '<label>' +
          '<input type="radio" name="transformer" value="' + t.handle + '"' + (t._active ? ' checked' : '') + '>' +
          ' <span>' + t.name + '</span>' +
        '</label>' +
      '</div>'
  }
  return template;
}

Settings.prototype.setFormDefaults = function() {
  document.querySelector('[name="theme"][value="' + this.data.theme + '"]').checked = true;
  document.querySelector('[name="tabSize"]').value = this.data.tabSize;
  var indentWithTabs = "false";
  if(this.data.indentWithTabs)
      indentWithTabs = "true"
  document.querySelector('[name="indentWithTabs"][value="'+indentWithTabs+'"]').checked = true
}

Settings.prototype.loadingOn = function() {
  [].forEach.call(document.querySelectorAll('.settings__spinner'), function(el) {
    if(this.domReady)
      el.classList.add('is-active');
  }.bind(this));
}

Settings.prototype.loadingOff = function() {
  [].forEach.call(document.querySelectorAll('.settings__spinner'), function(el) {
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
      bus.trigger('settings:changed:' + key, settings[key]);
    }
  });
}
