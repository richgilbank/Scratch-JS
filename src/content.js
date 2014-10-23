traceur.options.experimental = true;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  try {
    window.eval(traceur.Compiler.script(request.content));
  }
  catch(e){
    console.error(e);
  }
});

