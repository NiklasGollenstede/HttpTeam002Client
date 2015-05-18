this.JsonRequest = (function() {
	'use strict';
	var Request = Java.type('de.tuhh.vs.Request');

	return function(method, url, data, retry) {
		return new Promise(function(resolve, reject) {
			resolve = makeAsync(resolve);
			reject = makeAsync(reject);
			(function doIt() {
				try {
					print("Request("+ method +"): "+ url);
					new Request({
						method: (method+"").toUpperCase(),
						url: url,
						data: data && JSON.stringify(data),
						onload: function(text) {
							try {
								resolve(JSON.parse(text));
							} catch (e) {
								reject(e);
							}
						},
						onerror: function(error) {
							try {
								reject(JSON.parse(error));
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
										});
									} catch (e) {
										reject(error);
									}
								}
							}
						},
					});
				} catch (e) {
					if (retry > 0) {
						//print(e, "; occured, retrying in "+ retry);
						setTimeout(doIt, retry);
					} else {
						throw e;
					}
				}
			})();
		});
	};
})();
