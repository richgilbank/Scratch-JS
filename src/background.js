chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.name === 'platformInfo') {
    chrome.runtime.getPlatformInfo(function(info) {
      sendResponse(info);
    });
    return true; // indicates sendResponse will be called asynchronously
  } else if(request.name === 'getSettings') {
    sendResponse(JSON.parse(localStorage.getItem('settings')));
  } else if(request.name === 'setSettings') {
    localStorage.setItem('settings', JSON.stringify(request.value));
    sendResponse(localStorage.getItem('settings'));
  }
});
