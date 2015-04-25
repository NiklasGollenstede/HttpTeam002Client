(function() {
	'use strict';
	var Timer = Java.type('java.util.Timer');
	var eventLoop = new Timer('jsEventLoop', false);

	this.setTimeout = function(fn, millis /*, args... */) {
		var args = Array.prototype.slice.call(arguments, 2);

		eventLoop.schedule(fn.apply.bind(fn, null, args), millis);
	};

	this.shutdownTimer = function() {
		eventLoop.cancel();
	}
}).call(this);


//(function() {
//	'use strict';
//	var Timer = Java.type('java.util.Timer');
//	var TimerTask = Java.type('java.util.TimerTask');
//
//	var eventLoop = new Timer('jsEventLoop', false);
//	var tasks = { };
//	var counter = 0;
//
//	this.setTimeout = function(fn, millis /*, args... */) {
//		var args = Array.prototype.slice.call(arguments, 2);
//		++counter;
//
//		var task = tasks[counter] = Java.extend(TimerTask, {
//			run: (function(counter) { return function() {
//				delete tasks[counter];
//				fn.apply(null, args);
//			}; })(counter),
//		});
//
//		eventLoop.schedule(task, millis);
//
//		return counter;
//	};
//
//	this.clearTimeout = function(counter) {
//		tasks[counter] && tasks[counter].cancel();
//		delete tasks[counter];
//	};
//
//	this.shutdownTimer = function() {
//		eventLoop.cancel();
//	}
//}).call(this);