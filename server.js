/**
* node.js implementation of the server as described in 'Aufgebe 2' of the 'Praktikum: Verteilte Systeme' (TUHH, SoSe2015)
* start via "node server options"
* @param node Path to a working installation of node.js
* @param server Path to this file
* @param options A JSON object with the following keys, (e.g. "{ \"prompt\": true }")
* @param options.port The port the server listens at || 8081
* @param options.ip The servers (ip-)addres || 'localhost'
* @param options.prompt If true, the server will prompt for permission to answer at each request || false
* @param options.minping Minimal (emulated) time the server takes to process a request || (options.prompt ? 0 : 300)
* @param options.maxping Maximal (emulated) time the server takes to process a request || (options.prompt ? 0 : 800)
* @param options.print If true, the server will print its current ``database´´ at startup and after each change
* @param options.noData If true, the server will not generate any testdata at startup
*
* This implementation supports all required methods and paths (including PUT /months/[year]/[month])
* At startup it generates some testdata, @see // testdata
* If the file 'validate.js' is placed in the same folder as 'server.js',
* 	in- and output will be validated, warned about if not valid and then be cast to ensure data integrity
*/

var args = process.argv[2] && JSON.parse(process.argv[2]) || { };
var options = {
	port: args.port || 8081,
	ip: args.ip || 'localhost',
	print: !!args.print,
	noData: !!(args.noData || args.nodata),
};
if (args.prompt) {
	options.prompt = true;
} else {
	options.maxping = args.maxping || 800;
	options.minping = Math.min(options.maxping, (args.minping || 300));
}
console.log('options:', options);

var Validate, Types;
(function(validator) {
	try {
		validator = require('./validate.js');
	} catch (e) {
		console.log('failed to load validate.js, continue without validation');
		validator = {
			validate: function() { },
			types: { },
		};
	}
	Validate = validator.validate.bind(null, console.log.bind(console));
	Types = validator.types;
})();

// keygen
var newId = (function() {
	var counter = 0;
	return function() {
		return ++counter;
	};
})();

// testdata
var book = options.noData ? [ ] : [
	[ 2012, [ 1, 5, ], ],
	[ 2013, [ 2, 6, ], ],
	[ 2014, [ 3, 7, ], ],
	[ 2015, [ 1, 4, 8, ], ],
].reduce(function(book, line) {
	book[line[0]] = line[1].reduce(function(year, month) {
		year[month] = {
			budget: (line[0] % 2010) * 100- -month,
			entries: [
				{ id: newId(), desc: line[0] +"-"+ month +"-13", amount: month * 7, date: +(new Date(line[0] +"-"+ (month < 10 ? '0'+ month : month) +"-13")), },
				{ id: newId(), desc: line[0] +"-"+ month +"-28", amount: month * 23, date: +(new Date(line[0] +"-"+ (month < 10 ? '0'+ month : month) +"-28")), },
			],
		};
		return year;
	}, [ ]);
	return book;
}, [ ]);
Object.keys(book).forEach(function(year) {
	Object.keys(book[year]).forEach(function(month) {
		book[year][month].entries.forEach(function(payment) {
			Validate(Types.payment, payment);
		});
	});
});
options.print && console.log("testdata", JSON.stringify(book, null, "|   "));

function Month(year, month) {
	return {
		id: year*100- -month,
		year: year,
		month: month,
		budget: book[year][month].budget,
		sum: book[year][month].entries.reduce(function(sum, it) { return sum + it.amount; }, 0),
	};
}

var Errors = {
	badRequest: { code: 400, message: 'Bad Request', },
	notFound: { code: 404, message: 'Not Found', },
	methodNotAllowed: { code: 405, message: 'Method Not Allowed', },
	notImplpemented: { code: 501, message: 'Not Implemented', },
};

function handle(response, method, url, body) {
	try {
		body = body && JSON.parse(body);

		console.log('handle:', method, url, body || '<no body>');

		var ret = (function() {
			switch (url.match(/\/(\w*)/)[1]) {
				case 'payments': {
					switch (method.toLowerCase()) {
						case 'get': return (function() {
							var tupel = url.match(/\/\w*\/(\d+)\/(\d+)/);
							if (!tupel) { throw Errors.notFound; }
							var year = +tupel[1], month = +tupel[2];
							console.log('get payments: year ', year, ', month ', month);

							var entry = book[year] && book[year][month];
							if (!entry) { throw Errors.notFound; }
							return entry.entries;
						})();
						case 'put': return (function() {
							var payment = Validate(Types.payment, body);
							console.log('insert payment ', payment);

							var date = new Date(payment.date);
							var year = date.getYear()- -1900;
							var month = date.getMonth()- -1;

							book[year] = book[year] || { };
							book[year][month] = book[year][month] || {
								budget: 0,
								entries: [ ],
							};
							payment.id = newId();
							book[year][month].entries.push(payment);
							options.print && console.log("testdata", JSON.stringify(book, null, "|   "));

							return [ payment, new Month(year, month)];
						})();
						case 'delete': return (function() {
							var payment = Validate(Types.payment, body);
							console.log('delete payment ', payment);

							var date = new Date(payment.date);
							var year = date.getYear()- -1900;
							var month = date.getMonth()- -1;

							if (!(book[year] && book[year][month])) { throw Errors.notFound; }

							var old = book[year][month].entries.reduce(function(match, entry) {
								return (Object.keys(payment).every(function(key) { return payment[key] == entry[key]; }))
									? entry : match;
							}, undefined);
							if (!old) { throw Errors.badRequest; }

							book[year][month].entries.splice(book[year][month].entries.indexOf(old), 1);
							options.print && console.log("testdata", JSON.stringify(book, null, "|   "));

							return new Month(year, month);
						})();
						case 'post': return (function() {
							var payment = Validate(Types.payment, body[0]), now = Validate(Types.payment, body[1]);
							console.log('update payment ', payment, ' to ', now);

							var date = new Date(payment.date);
							var year = date.getYear()- -1900;
							var month = date.getMonth()- -1;

							if (!(book[year] && book[year][month])) { throw Errors.notFound; }
							if (payment.id != now.id) { throw Errors.badRequest; }

							var old = book[year][month].entries.reduce(function(match, entry) {
								return (Object.keys(payment).every(function(key) { return payment[key] == entry[key]; }))
									? entry : match;
							}, undefined);
							if (!old) { throw Errors.badRequest; }

							book[year][month].entries.splice(book[year][month].entries.indexOf(old), 1, now);
							options.print && console.log("testdata", JSON.stringify(book, null, "|   "));

							return new Month(year, month);
						})();
						default: {
							throw Errors.methodNotAllowed;
						}
					}
				} break;
				case 'months': {
					switch (method.toLowerCase()) {
						case 'get': return (function() {
							if (/^\/\w*\/?$/.test(url)) {
								console.log('get all months');

								return Object.keys(book).reduce(function(ret, year) {
									Object.keys(book[year]).forEach(function(month) {
										ret.push(new Month(year, month));
									});
									return ret;
								}, []);
							} else {
								var tupel = url.match(/\/\w*\/(\d+)\/(\d+)/);
								if (!tupel) { throw Errors.notFound; }
								var year = +tupel[1], month = +tupel[2];
								console.log('get month: year ', year, ', month ', month);

								if (!(book[year] && book[year][month])) { throw Errors.notFound; }

								return new Month(year, month);
							}
						})();
						case 'post': return (function() {
							var tupel = url.match(/\/\w*\/(\d+)\/(\d+)/);
							if (!tupel) { throw Errors.notFound; }
							var year = +tupel[1], month = +tupel[2];
							var budget = +body.budget;
							console.log('update budget of '+ year +''+ month +' to ', budget);
							if (!(book[year] && book[year][month])) {
								throw Errors.badRequest;
							}
							book[year][month].budget = budget;
							options.print && console.log("testdata", JSON.stringify(book, null, "|   "));

							return new Month(year, month);
						})();
						default: {
							throw Errors.methodNotAllowed;
						}
					}
				} break;
				default: {
					throw Errors.notFound;
				}
			}
			throw Errors.notImplpemented;
		})();

		response.writeHead(200, {'content-type': 'application/json'});
		response.end(JSON.stringify(ret));
		console.log('responded', ret);

	} catch (e) {
		console.log(e);
		response.writeHead(e.code || 500, {'content-type': 'application/json'});
		response.end(JSON.stringify({
			error: e.code,
			description: e.message || 'something went wrong',
		}));
	}
}

require('http').createServer(function(request, response) {
	// console.log('request.headers:', request.headers);
	request.headers.accept != 'application/json' && console.log("request.headers.accept != 'application/json'");

	if ([ 'put', 'post', 'delete' ].indexOf(request.method.toLowerCase()) != -1) {
		request.once('data', postpone.bind(null, response, request.method, request.url));
	} else {
		postpone(response, request.method, request.url);
	}
}).listen(options.port, options.ip);

console.log('Server running at http://'+ options.ip +':'+ options.port +'/');

var requests = [];
requests.toString = function() {
	return 'Requests: ' + (this.reduce(function(string, request, index) {
		return string +'\n'+ index +": "+ request[1] +" "+ request[2];
	}, '') || '<none>');
};

function postpone(response, method, url, body) {
	var args = arguments;
	if (!options.prompt) {
		setTimeout(function() {
			handle.apply(null, args);
		}, Math.floor(Math.random() * ((options.maxping - options.minping) || 0) + options.minping));
	} else {
		requests.push(args);
		console.log(requests +'');
	}
}


options.prompt && process.openStdin().addListener("data", function(line) {
	var index = +line;
	if (!(index === 0 || index)) {
		console.log("NaN, try\n"+ requests);
		return;
	}
	if (!requests[index]) {
		console.log("invalid index, try\n"+ requests);
		return;
	}
	handle.apply(null, requests[index]);
	requests.splice(index, 1);
	console.log(requests +'');
});
