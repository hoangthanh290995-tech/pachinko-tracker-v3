# P'sCUBE Mobile Collector

Android collector for the public P'sCUBE page. It keeps the P'sCUBE page in a WebView, extracts visible DATA text and graph image URLs from the same page, and posts snapshots to the V3 API. Collection interval: 5 minutes.

This is intentionally a native WebView app rather than a cross-origin iframe, because browser same-origin rules prevent a separate hosted page from reading P'sCUBE DOM.
