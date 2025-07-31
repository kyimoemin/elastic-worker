Node.js Support (using node:worker_threads)
To support Node.js:

Use Worker from node:worker_threads instead of the global browser Worker.
Adjust worker script loading (Node.js uses file paths, not URLs).
Handle differences in message/event APIs (mostly compatible, but some events differ).
Detect environment (browser vs Node.js) and use the appropriate Worker implementation.
