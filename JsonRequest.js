this.JsonRequest = (function() {
	'use strict';
	var Request = Java.type('de.tuhh.vs.Request');

	return function(method, url, data) {
		return new Promise(function(resolve, reject) {
			print("Request("+ method +"): "+ url);
			new Request({
				method: (method+"").toUpperCase(),
				url: url,
				data: data && JSON.stringify(data),
				onload: function(text) {
					print('onload', text);
					try {
						resolve(JSON.parse(text));
					} catch (e) {
						reject(e);
					}
				},
				onerror: function(error) {
					print('onerror', error);
					try {
						reject(JSON.parse(text));
					} catch (e) {
						if (typeof error == 'string') {
							reject({
								error: 0x40,
								description: error,
							});
						} else {
							try {
								reject({
									error: NaN,
									description: error.getClass().getName() +': '+ error.getMessage(),
								})
							} catch (e) {
								reject(error);
							}
						}
					}
				},
			});
		});
	};
})();