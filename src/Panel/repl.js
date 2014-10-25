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
    traceur.options.experimental = true;
    try {
      var es5 = traceur.Compiler.script(content);
      var str = "var st = document.createElement('script'); st.type = 'text/javascript'; st.src = '"+chrome.extension.getURL('traceur.js')+"'; (document.head||document.documentElement).appendChild(st);"
      chrome.devtools.inspectedWindow.eval(str)
      chrome.devtools.inspectedWindow.eval(es5)
    }
    catch (e) {
      chrome.devtools.inspectedWindow.eval("console.error(\"" + e + "\");");
    }
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
