document.addEventListener('DOMContentLoaded', function(){
  var editor = CodeMirror.fromTextArea(document.querySelector("textarea"), {
    lineNumbers: true,
    matchBrackets: true,
    continueComments: "Enter",
    extraKeys: {"Ctrl-Q": "toggleComment"}
  });

  editor.setSize(window.innerWidth-20, window.innerHeight - 20);
  editor.setOption('theme', 'solarized dark');

  var deliverContent = function(content){
    chrome.runtime.sendMessage({content: content});
  }

  document.onkeydown = function(e){
    if(e.metaKey && e.which == 13){
      deliverContent(editor.getValue());
    }
  }

  document.querySelector('button').addEventListener('click', function(){
    deliverContent(editor.getValue());
  });
});

