(function(global) {
	'use strict';

	var natural = { type: "number", range: [0, 4503599627370495/*^=2^52-1*/], cast: true,  warn: true, map: Math.round, };
	var date = natural;
	var month = { type: "number", range: [1, 12], cast: true,  warn: true, map: Math.round, };
	var positive = { type: "number", range: [0, Number.MAX_VALUE], cast: true,  warn: true, };
	var number = { type: "number", cast: true,  warn: true, };
	var string = { type: "string", cast: true,  warn: true, };
	var bool = { type: "boolean", cast: true,  warn: true, };

	// must not contain any key == 'type'
	var types = global.types = {
		payment: {
			id: natural,
			desc: string,
			amount: number,
			date: date,
		},
		month: {
			id: natural,
			sum: number,
			budget: number,
			year: natural,
			month: month,
		}
	};

	var throwOut = { };

	global.validate = function(log, type, souce) {
		log = log || (function(){});
		if (typeof souce !== "object") {
			log("souce = "+ souce +"is not an object, dropping");
			return null;
		}
		if (typeof type === "string") {
			type = types[type];
		}
		if (typeof type !== "object") {
			throw "invalid type provided";
		}

		try {
			return (function validate(type, souce, target) {
				for (var key in souce) {

					var validator = type[key];
					if (!validator) {
						log("souce."+ key +" = "+ souce[key] +" should't exist, skiping");
						continue;
					}

					if (typeof souce[key] === "object") {
						target[key] = validate(validator, souce[key], { });
						continue;
					}

					var value = validator.map ? validator.map(souce[key]) : souce[key];

					if (typeof value !== validator.type) {
						validator.warn && log("typeof (souce."+ key +" = "+ value +") !== "+ validator.type);

						if (validator.drop) {
							throw "typeof (souce."+ key +" = "+ value +") !== "+ validator.type;
						} else if (validator.cast) {
							if (validator.type == "string") {
								value = value +"";
							} else if (validator.type == "number") {
								value = +value;
							} else if (validator.type == "boolean") {
								value = !!value;
							}
							if (typeof value !== validator.type) { // still wrong type
								throw "couldn't cast (souce."+ key +" = "+ value +") to "+ validator.type;
							}
						} else {
							throw { type: throwOut, error: "typeof (souce."+ key +" = "+ value +") !== "+ validator.type, };
						}
					} // type is correct

					// check validator.match
					if (validator.type == "string" && validator.match
						&& !validator.match.test(value)
					) {
						validator.warn && log("souce."+ key +" = "+ value +" doesn't match "+ validator.match);

						if (validator.drop) {
							throw "souce."+ key +" = "+ value +" doesn't match "+ validator.match;
						} else {
							throw { type: throwOut, error: "souce."+ key +" = "+ value +" doesn't match "+ validator.match, };
						}
					}

					// check validator.range
					if (validator.type == "number" && validator.range
						&& !(validator.range[0] <= value && value <= validator.range[1])
					) {
						validator.warn && log("souce."+ key +" = "+ value +" out of range "+ validator.range[0] +" < value < "+ validator.range[1]);

						if (validator.drop) {
							throw "souce."+ key +" = "+ value +" out of range "+ validator.range[0] +" < value < "+ validator.range[1];
						} else if (validator.cast) {
							value = Math.min(validator.range[1], Math.max(validator.range[0], value));
						} else {
							throw { type: throwOut, error: "souce."+ key +" = "+ value +" out of range "+ validator.range[0] +" < value < "+ validator.range[1], };
						}
					}

					target[key] = value;
				}
				return target;
			})(type, souce, { });
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
})((typeof exports != 'undefined') ? exports : ((typeof window != 'undefined') ? window : { }));
