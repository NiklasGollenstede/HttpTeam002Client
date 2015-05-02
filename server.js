/**
* node.js implementation of the server as described in 'Aufgebe 2' of the 'Praktikum: Verteilte Systeme' (TUHH, SoSe2015)
* start via "node server options"
* @param options A JavaScript object with the following (case insensitive) keys
* @param options.port The port the server listens at || 8081
* @param options.ip The servers (ip-)addres || 'localhost'
* @param options.minPing Minimal (emulated) time the server takes to process a request || 300
* @param options.maxPing Maximal (emulated) time the server takes to process a request || 800
*
* @require a working installation of node.js
*/

var options = process.argv[2] && eval('('+ process.argv[2] +')') || { }; // XXX remove eval
options = Object.keys(options).reduce(function(ret, key) {
	ret[key.toLowerCase()] = options[key];
	return ret;
}, {
	port: 8081,
	ip: 'localhost',
	minping: 300,
	maxping: 800,
});
console.log('options:', options);

var Validate, Types;
(function(validator) {
	Validate = validator.validate.bind(null, console.log.bind(console));
	Types = validator.types;
})(require('./validate.js'));

// keygen
var newId = (function() {
	var counter = 0;
	return function() {
		return ++counter;
	}
})();

// testdata
var book = [
	[ 2012, [ 1, 5, ], ],
	[ 2013, [ 2, 6, ], ],
	[ 2014, [ 3, 7, ], ],
	[ 2015, [ 1, 4, 8, ], ],
].reduce(function(book, line) {
	book[line[0]] = line[1].reduce(function(year, month) {
		year[month] = {
			budget: (line[0] % 2010) * 100- -month,
			entries: [
				{ id: newId(), desc: line[0] +"-"+ month +"-13", amount: month / 2, date: +(new Date(line[0] +"-"+ (month < 10 ? '0'+ month : month) +"-13")), },
				{ id: newId(), desc: line[0] +"-"+ month +"-28", amount: month * 2, date: +(new Date(line[0] +"-"+ (month < 10 ? '0'+ month : month) +"-28")), },
			],
		}
		return year;
	}, { });
	return book;
}, { });
Object.keys(book).forEach(function(year) {
	Object.keys(book[year]).forEach(function(month) {
		book[year][month].entries.forEach(function(payment) {
			Validate(Types.payment, payment);
		});
	});
});

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

		console.log('handle:', method, url, body);

		var ret = (function() {
			switch (url.match(/\/(\w*)/)[1]) { // word following the first '/'
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
						})(); break;
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

							console.log("book", book);

							return [ payment, new Month(year, month)];
						})(); break;
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
							
							return new Month(year, month);
						})(); break;
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
							
							return new Month(year, month);
						})(); break;
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
						})(); break;
						case 'post': return (function() {
							console.log('update month ', body[0], ' to ', body[1]);
							var old = Validate(Types.month, body[0]), now = Validate(Types.month, body[1])
							var year = now.year, month = now.month;
							if (old.id != now.id || ![old, now].every(function(item) {
								return item.id == item.year*100- -item.month;
							}) || !(book[year] && book[year][month])) {
								throw Errors.badRequest;
							}
							book[year][month].budget = now.budget;
							return new Month(year, month);
						})(); break;
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
	setTimeout(function() {
		console.log('request.headers:', request.headers);

		if ([ 'put', 'post', 'delete' ].indexOf(request.method.toLowerCase()) != -1) {
			request.once('data', handle.bind(null, response, request.method, request.url));
		} else {
			handle(response, request.method, request.url);
		}

	}, Math.floor(Math.random() * ((options.maxping - options.minping) || 0) + options.minping));
}).listen(options.port, options.ip);

console.log('Server running at http://'+ options.ip +':'+ options.port +'/');
