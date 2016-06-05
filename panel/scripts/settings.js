/*----------------------------------
  Settings and storage
 ---------------------------------*/
function Settings(repl) {
  this.domReady = false;
  this.repl = repl;
  this.DEFAULTS = this.data = {
    transformer: 'babel',
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    theme: 'default'
  }

  document.addEventListener('DOMContentLoaded', this.onDomReady.bind(this));
}

Settings.prototype.onDomReady = function() {
  this.domReady = true;
  this.DOM = {
    transformerOptions: document.querySelector('.transformer-options'),
    openSettingsBtn: document.querySelector('.open-settings'),
    closeSettingsBtn: document.querySelector('.settings__close-btn'),
    settings: document.querySelector('.settings'),
    includedScriptsContainer: document.querySelector('#includesContainer'),
  }

  this.DOM.transformerOptions.innerHTML = this.transformerOptionTemplate(this.repl.transformers);

  // Check for latest settings
  this.get(function(data) {
    // If there's no data stored, store the defaults
    if(typeof data === undefined || !data.hasOwnProperty('transformer')) {
      this.set(this.DEFAULTS, function() {
        this.setFormDefaults(this.data);
      }.bind(this));
    }
    else {
      this.data = data;
      this.setFormDefaults(data);
      for(key in data) {
        bus.trigger('settings:changed:' + key, data[key]);
      }
    }
  }.bind(this));

  this.DOM.openSettingsBtn.addEventListener('click', function() {
    this.DOM.settings.classList.toggle('is-active');
  }.bind(this));

  this.DOM.closeSettingsBtn.addEventListener('click', function() {
    this.DOM.settings.classList.remove('is-active');
  }.bind(this));

  this.DOM.transformerOptions.addEventListener('click', function(e) {
    if(e.target.name === 'transformer')
      this.set({ transformer: e.target.value });
  }.bind(this));

  [].forEach.call(document.querySelectorAll('input[name="theme"]'), function (el) {
    el.addEventListener('click', function(e) {
      this.set({ theme: e.target.value });
    }.bind(this));
  }.bind(this));

  [].forEach.call(document.querySelectorAll('input[name="tabSize"]'), function (el) {
    el.addEventListener('change', function(e) {
      var val = parseInt(e.target.value, 10);
      this.set({ tabSize: val });
      this.set({ indentUnit: val });
    }.bind(this));
  }.bind(this));

  [].forEach.call(document.querySelectorAll('input[name="indentWithTabs"]'), function (el) {
    el.addEventListener('click', function(e) {
      var val = document.querySelectorAll('input[name="indentWithTabs"]')[0].checked;
      this.set({ indentWithTabs: val });
    }.bind(this));
  }.bind(this));

  this.DOM.settings.addEventListener('click', function(evt) {
    // Delegate the listener, since new rows are added each time a
    // script is added to the page
    if(!~Array.prototype.slice.call(evt.target.classList).indexOf('btn--add-source')) return;
    var button = evt.target;
    var input = button.previousElementSibling;
    var url = input.value;
    if(url.trim().length === 0) return;
    chrome.devtools.inspectedWindow.eval(`!document.querySelector('script[src="${url}"]')`, {}, function(result) {
      if(!result) return;
      var include = `var script=document.createElement('script');script.src='${url}';document.body.appendChild(script);`;
      chrome.devtools.inspectedWindow.eval(include, {}, function (_, exceptionInfo) {
        if (typeof exceptionInfo !== "undefined" && exceptionInfo.hasOwnProperty("isException")) {
          logError(exceptionInfo.value);
        } else {
          button.innerHTML = '&#10003;';
          button.disabled = true;
          input.readOnly = true;
          this.DOM.includedScriptsContainer.insertAdjacentHTML('beforeend', this.newSourceRow());
        }
      }.bind(this));
    }.bind(this));
  }.bind(this));
}

Settings.prototype.newSourceRow = function() {
  return `<div class="settings__option-container settings__includes-container">
  <input type="text" class="input--text" placeholder="External source URL">
  <button class="btn btn--add-source">&#10095</button>
  </div>`;
}

Settings.prototype.transformerOptionTemplate = function(transformers) {
  var template = '';
  for(var i in transformers) {
    var t = transformers[i];
    template +=
      `<div class="settings__option-container">
        <label>
          <input type="radio" name="transformer" value="${t.handle}" ${t.active ? 'checked' : ''}>
          <span>${t.name}</span>
        </label>
      </div>`;
  }
  return template;
}

Settings.prototype.setFormDefaults = function() {
  document.querySelector('[name="theme"][value="' + this.data.theme + '"]').checked = true;
  document.querySelector('[name="tabSize"]').value = this.data.tabSize;
  document.querySelector('[name="indentWithTabs"]').checked = this.data.indentWithTabs;
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
  this.loadingOn();
  // FIXME: https://code.google.com/p/chromium/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&groupby=&sort=&id=178618
  // chrome.storage.sync.get('settings', function(data) {
  chrome.runtime.sendMessage({name: 'getSettings'}, function(data) {
    this.loadingOff();
    cb(data || {});
  }.bind(this));
}

Settings.prototype.set = function(settings, cb) {
  this.loadingOn();
  var updatedSettings = this.data;
  for(i in settings) {
    updatedSettings[i] = settings[i];
  }
  // FIXME: https://code.google.com/p/chromium/issues/detail?can=2&start=0&num=100&q=&colspec=ID%20Pri%20M%20Week%20ReleaseBlock%20Cr%20Status%20Owner%20Summary%20OS%20Modified&groupby=&sort=&id=178618
  // chrome.storage.sync.set({settings: settings}, function() {
  chrome.runtime.sendMessage({name: 'setSettings', value: updatedSettings}, function(data) {
    this.data = updatedSettings;
    this.loadingOff();
    if(typeof cb === 'function')
      cb();

    for(key in settings) {
      bus.trigger('settings:changed:' + key, settings[key]);
    }
  }.bind(this));
}
