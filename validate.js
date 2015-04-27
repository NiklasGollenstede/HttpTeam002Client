(function() {
	'use strict';
	var global = (typeof exports != 'undefined') ? exports : { };

	var natural = { type: "number", range: [0, 4503599627370495/*^=2^52-1*/], error: "cast warn", map: function(i) { return Math.round(i); }, };
	var date = natural;
	var month = { type: "number", range: [1, 12], error: "cast warn", map: function(i) { return Math.round(i); }, };
	var positive = { type: "number", range: [0, Number.MAX_VALUE], error: "cast warn", };
	var rational = { type: "number", range: [Number.MIN_VALUE, Number.MAX_VALUE], error: "cast warn", };
	var string = { type: "string", error: "cast warn", };
	var bool = { type: "boolean", error: "cast warn", };

	// must not contain any key == 'type'
	var types = global.types = {
		payment: {
			id: natural,
			desc: string,
			amount: rational,
			date: date,
		},
		month: {
			id: natural,
			sum: rational,
			budget: rational,
			year: natural,
			month: month,
		}
	}

	var throwOut = { };

	var validate = global.validate = function(log, type, object) {
		if (!typeof object === "object") {
			return undefined;
		}
		if (typeof type === "string") {
			type = types[type];
		}
		if (!typeof type === "object") {
			throw "invalid type provided";
		}
		log = log || (function(){});
		try {
			for (var key in object) {
				if (typeof object[key] === "object") {
					object[key] = validate(log, type[key], object[key]);
					continue;
				}
				// else

				var validator = type[key];
				if (!validator) {
					log("object."+ key +" = "+ object[key] +" should't exist, deleting");
					delete object[key];
					continue;
				}

				var mapped;
				if (validator.map && (mapped = validator.map(object[key])) !== object[key]) {
					object[key] = mapped;
				}

				if (typeof object[key] !== validator.type) {
					if (validator.error.indexOf("warn") !== -1) {
						log("typeof (object."+ key +" = "+ object[key] +") !== "+ validator.type);
					}
					if (validator.error.indexOf("drop") !== -1) {
						throw "typeof (object."+ key +" = "+ object[key] +") !== "+ validator.type;
					} else if (validator.error.indexOf("cast") !== -1) {
						if (validator.type == "string") {
							object[key] = object[key] +""; log("WTF");
						} else if (validator.type == "number") {
							object[key] = object[key] -0; log("blub");
						} else if (validator.type == "boolean") {
							object[key] = !!object[key];
						}
						if (typeof object[key] !== validator.type) { // still wrong type
							throw "couldn't cast (object."+ key +" = "+ object[key] +") to "+ validator.type;
						}
					} else {
						throw { type: throwOut, error: "typeof (object."+ key +" = "+ object[key] +") !== "+ validator.type, };
					}
				} // type is correct

				if (validator.type == "string" && validator.match
					&& !validator.match.test(object[key])
				) {
					if (validator.error.indexOf("warn") !== -1) {
						log("object."+ key +" = "+ object[key] +" doesn't match "+ validator.match);
					}
					if (validator.error.indexOf("drop") !== -1) {
						throw "object."+ key +" = "+ object[key] +" doesn't match "+ validator.match;
					} else {
						throw { type: throwOut, error: "object."+ key +" = "+ object[key] +" doesn't match "+ validator.match, };
					}
				} else
				if (validator.type == "number" && validator.range
					&& !(validator.range[0] <= object[key] && object[key] <= validator.range[1])
				) {
					if (validator.error.indexOf("warn") !== -1) {
						log("object."+ key +" = "+ object[key] +" out of range "+ validator.range[0] +" < value < "+ validator.range[1]);
					}
					if (validator.error.indexOf("drop") !== -1) {
						throw "object."+ key +" = "+ object[key] +" out of range "+ validator.range[0] +" < value < "+ validator.range[1];
					} else if (validator.error.indexOf("cast") !== -1) {
						object[key] = Math.min(validator.range[1], Math.max(validator.range[0], object[key]));
					} else {
						throw { type: throwOut, error: "object."+ key +" = "+ object[key] +" out of range "+ validator.range[0] +" < value < "+ validator.range[1], };
					}
				}
			}
			return object;
		} catch (e) {
			if (e.type === throwOut) {
				throw e.error;
			} else {
				log(e);
				return null;
			}
		}
	};
	return global;
})();