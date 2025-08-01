// Minimal dummy worker script for browser tests
self.onmessage = function (e) {
  // Echo back the message
  self.postMessage(e.data);
};
