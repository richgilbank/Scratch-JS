document.addEventListener('DOMContentLoaded', function(){
  var str = "var st = document.createElement('script'); st.src = '"+chrome.extension.getURL('node_modules/traceur/bin/traceur-runtime.js')+"'; (document.head||document.documentElement).appendChild(st);"
  chrome.devtools.inspectedWindow.eval(str)

  var editor = CodeMirror.fromTextArea(document.querySelector("textarea"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"},
    tabSize: 2,
    autoCloseBrackets: true
  });

  editor.setOption('theme', 'solarized dark');

  var deliverContent = function(content){
    traceur.options.experimental = true;
    try {
      var es5 = traceur.Compiler.script(content);
      chrome.devtools.inspectedWindow.eval(es5, function(result, exceptionInfo) {
        if(typeof exceptionInfo !== 'undefined' && exceptionInfo.hasOwnProperty('isException'))
          logError(exceptionInfo.value);
      });
    }
    catch (e) {
      logError(e);
    }
  }

  var combinationKey = 'metaKey';
  chrome.runtime.sendMessage('platformInfo', function(info) {
    if (info.os !== 'mac') {
      combinationKey = 'ctrlKey';
      document.getElementById('combinationKey').textContent = 'Ctrl';
    }
  });

  document.onkeydown = function(e){
    if(e[combinationKey] && e.which == 13){
      deliverContent(editor.getValue());
    }
  }

  document.querySelector('button').addEventListener('click', function(){
    deliverContent(editor.getValue());
  });
});

function logError(err) {
  chrome.devtools.inspectedWindow.eval("console.error(\"" + err + "\");");
}
