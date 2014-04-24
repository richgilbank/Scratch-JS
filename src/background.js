chrome.runtime.onMessage.addListener(function(message){
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
});

