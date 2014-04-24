var traceurWebPageTranscoder = new traceur.WebPageTranscoder(document.location.href);
var traceurScriptName = traceurWebPageTranscoder.nextInlineScriptName_();

traceur.options.experimental = true;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  try {
    traceurWebPageTranscoder.addFileFromScriptElement(null, traceurScriptName, request.content);
  }
  catch(e){
    console.error(e);
  }
});

