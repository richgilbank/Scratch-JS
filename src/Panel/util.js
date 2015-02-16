function debounce(fn, delay, ctx) {
  var timer = null;
  return function () {
    var context = ctx || this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

function logError(err) {
  chrome.devtools.inspectedWindow.eval("console.error(\"" + err + "\");");
}
