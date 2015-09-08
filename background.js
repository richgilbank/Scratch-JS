chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.name) {
    case 'platformInfo':
      chrome.runtime.getPlatformInfo(function(info) {
        sendResponse(info);
      });
      return true; // indicates sendResponse will be called asynchronously
      break;
    case 'getSettings':
      sendResponse(JSON.parse(localStorage.getItem('settings')));
      break;
    case 'setSettings':
      localStorage.setItem('settings', JSON.stringify(request.value));
      sendResponse(localStorage.getItem('settings'));
      break;
    case 'getCode':
      chrome.storage.sync.get('code', function (data) {
        sendResponse(data);    
      });
      return true;
      break;
    case 'setCode':
      chrome.storage.sync.set({'code': request.value}, function () {
        sendResponse('success');  
      });
      return true;
      break;
  }
});
