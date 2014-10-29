chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request === 'platformInfo') {
    chrome.runtime.getPlatformInfo(function(info) {
      sendResponse(info);
    });
    return true; // indicates sendResponse will be called asynchronously
  }
});
