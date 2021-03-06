(function() {
	'use strict';
	var self;
	var System = Java.type('java.lang.System');
	var Long = Java.type('java.lang.Long');
	var Double = Java.type('java.lang.Double');
	var Exception = Java.type('java.lang.Exception');
	var Thread = Java.type('java.lang.Thread');
	var ArrayList = Java.type('java.util.ArrayList');
	var Date = Java.type('java.util.Date');
	var Dialog = Java.type('de.tuhh.vs.lab.common.ui.BookingEntryDialog');

	var Validate, Types;
	(function(validator) {
		Validate = validator.validate.bind(null, print);
		Types = validator.types;
	})(load('./validate.js', { }));

	var Logger = function(line) function(arg) print("log "+ line +":", JSON.stringify(arg));

	function Modal(old) {
		return new Promise(function(resolve, reject) {
			var dialog = new Dialog((old.id && old.id != -1 ? "edit" : "create") +" entry", false);

			var date = new Date(old.date || 0);
			dialog.setBookingDateString(old.dateString || (date.getDate() +"."+ (date.getMonth()- -1) +"."+ (date.getYear()- -1900)));
			dialog.setDescriptionString(old.desc || "");
			dialog.setAmountString(((old.amount || 0)+ "").replace('.', ','));

			dialog.setVisible(true);
			new Thread(function() {
				try {
					if (dialog.getAction() == 0x01/*OK*/) {
						var date = dialog.getBookingDateString().match(/^([0-9][0-9])\.([0-9][0-9])\.([0-9][0-9][0-9][0-9])$/);
						if (date == null) {
							throw "bad date format";
						}
						date = new Date( // year: 00 ^= 2000 AD; 29 ^= 2029 AD; 30 ^= 1930 AD; 99 ^= 1999 AD; 100+ ^= 100+ AD
							((+date[3] < 30) ? (date[3]- -100) : ((+date[3] < 100) ? date[3] : (date[3] - 1900))),
							(date[2] - 1),
							(date[1] - 0)
						);

						resolve({
							id: old.id || -1,
							desc: dialog.getDescriptionString() +"",
							amount: +(dialog.getAmountString().replace(/\./g, "").replace(",", ".")),
							date: date.getTime(),
						});
					} else {
						throw "canceled by user";
					}
				} catch (e) {
					reject(e);
				}
			}).start();
		});
	}

	return (self = ({
		init: makeAsync(function(port) {
			print("init: ", port);
			self.baseUrl = 'http://localhost:'+ port;
			self.panel = window.getPanel();
			self.rows = self.panel.getTable();
			self.table = self.panel.getTableModel();
			self.combo = {
				year: self.panel.getComboYear(),
				month: self.panel.getComboMonth(),
			};

			Object.defineProperty(self, 'budget', {
				get: function() { return +self.panel.getFormTextfieldBudget().getText(); },
				set: function(value) { self.panel.getFormTextfieldBudget().setText(value +""); },
			});
			Object.defineProperty(self, 'diff', {
				get: function() { return +self.panel.getFormTextfieldDifference().getText(); },
				set: function(value) { self.panel.getFormTextfieldDifference().setText(value +""); },
			});
			Object.defineProperty(self, 'sum', {
				get: function() { return +self.panel.getFormTextfieldSum().getText(); },
				set: function(value) { self.panel.getFormTextfieldSum().setText(value +""); },
			});
			(function () {
				var years = [ ], months =  [ ];
				Object.defineProperty(self, 'years', {
					get: function() { return years; },
					set: function(list) {
						self.combo.year.removeAllItems();
						list.forEach(function(year) self.combo.year.addItem(year +''));
						years = list;
					},
				});
				Object.defineProperty(self, 'months', {
					get: function() { return months; },
					set: function(list) {
						self.combo.month.removeAllItems();
						list.forEach(function(month) self.combo.month.addItem(month +''));
						months = list;
					},
				});
			})();
			(function() {
				var year, month;
				Object.defineProperty(self, 'year', {
					get: function() { return +year; },
					set: function(value) {
						year = +value;
						year != null && (self.months = self.calender.getMonths(year));
					},
				});
				Object.defineProperty(self, 'month', {
					get: function() { return +month; },
					set: function(value) { month = +value; year != null && month != null && self.calender.select(year, month); },
				});
			})();


			self.list = (function() {
				var list = [];
				var _update = function() self.table.setList(list.reduce(function(list, x, index) (list.add(index), list), new ArrayList()));
				return {
					init: function(array) {
						list = array.slice();
						_update();
					},
					clear: function() {
						list = [];
						_update();
					},
					add: function(entry) {
						list.push(entry);
						_update();
					},
					update: function(entry) {
						for (var i = 0; i < list.length; i++) {
							if (list[i].id === entry.id) {
								list[i] = entry;
								_update();
								return;
							}
						}
					},
					remove: function(index /*or entry*/) {
						for (var i = 0; +index != index && i < list.length; i++) {
							if (list[i].id === index.id) {
								index = i;
							}
						}
						if (delete list[index]) {
							self.table.removeEntry(index);
						}
					},
					get: function(index) {
						return list[index];
					},
				};
			})();

			self.calender = (function() {
				var list = [];
				var selected;
				return {
					find: function(query) {
						for (var i = 0; i < list.length; i++) {
							if (Object.keys(query).every(function(key) query[key] == list[i][key])) {
								return list[i];
							}
						}
					},
					refresh: function() {
						list.sort(function(a, b) a.year - b.year || a.month - b.month);

						self.years = list.reduce(function(list, item) ((list.indexOf(item.year) == -1 && list.push(item.year)), list), []);
						self.months = this.getMonths(self.combo.year.getSelectedItem());
					},
					init: function(array) {
						list = array.slice();
						!list.length && list.push({ id: 0, year: (new Date().getYear() + 1900), month: (new Date().getMonth() + 1), budget: 0, sum: 0 });
						this.refresh();
					},
					clear: function() {
						list = [];
						this.refresh();
					},
					getMonths: function(year) {
						return list.reduce(function(list, item) ((item.year == year && list.indexOf(item.month) == -1 && list.push(item.month)), list), []);
					},
					add: function(entry) {
						if (this.find({ year: entry.year, month: entry.month, })) {
							throw new Exception("month already exists");
						} else {
							var index;
							if (!self.years.some(function(year) +year === +entry.year)) {
								self.years.some(function(y, i) (print(y, i), +y > +entry.year && (index = i)));
								self.combo.year.insertItemAt(entry.year +'', index || self.years.length);
								self.years.splice(index || self.years.length, 0, entry.year +'');
							}
							else if (+self.year === +entry.year && !self.months.some(function(month) +month === +entry.month)) {
								self.months.some(function(m, i) (print(m, i), +m > +entry.month && (index = i)));
								self.combo.month.insertItemAt(entry.month +'', index || self.months.length);
								self.months.splice(index || self.months.length, 0, entry.month +'');
							}
							list.push(entry);
						}
					},
					remove: function(year, month) {
						var item;
						if ((item = this.find({ year: year, month: month, }))) {
							list.splice(list.indexOf(item), 1);
							this.refresh();
						} else {
							throw new Exception("month doesn't exsist");
						}
					},
					get: function(year, month) {
						this.find({ year: year, month: month, });
					},
					select: function(year, month) {
						var item;
						if ((item = this.find({ year: year, month: month, }))) {
							selected = item;
							self.list.init([ { id: 0, desc: 'Pending ...', amount: Infinity, date: System.currentTimeMillis(), }, ]);
							self.budget = self.sum = self.diff = '...';

							JsonRequest("get", self.baseUrl +"/months/"+ year +"/"+ month, null, 2000)
							.then(function(month) {
								Validate(Types.month, month);
								self.calender.update(month);
							}).catch(Logger(__LINE__));

							JsonRequest("get", self.baseUrl +"/payments/"+ year +"/"+ month, null, 2000)
							.catch(function() (Logger(__LINE__), [ ]))
							.then(function(payments) {
								payments.forEach(function(payment) Validate(Types.payment, payment));
								if (year != selected.year || month != selected.month) { return; }
								self.list.init(payments);
							}).catch(Logger(__LINE__));
						}
					},
					update: function(entry) {
						var item = this.find({ year: entry.year, month: entry.month, });
						if (!item) { return this.add(entry); }
						Object.keys(entry).forEach(function(key) item[key] = entry[key]);
						if (item == selected) {
							self.budget = (+item.budget).toFixed(2).replace('.', ',');
							self.sum = (+item.sum).toFixed(2).replace('.', ',');
							self.diff = ((item.sum - item.budget) / item.budget * 100).toFixed(2).replace('.', ',');
						}
					},
					setBudget: function(year, month, budget) {
						self.budget = Infinity;

						JsonRequest("post", self.baseUrl +"/months/"+ year +"/"+ month, { budget: budget, })
						.then(function(month) {
							Validate(Types.month, month);
							self.calender.update(month);
						}).catch(Logger(__LINE__));
					}
				};
			})();


			self.list.init([ { id: 0, desc: 'Pending ...', amount: Infinity, date: System.currentTimeMillis(), }, ]);

			JsonRequest("get", self.baseUrl +"/months", null, 2000)
			.then(function(months) {
				months.forEach(function(month) Validate(Types.month, month));
				self.calender.init(months);
			}).catch(Logger(__LINE__));

		}),
		yearComboboxChanged: makeAsync(function(year) {
			print("yearComboboxChanged: ", year);
			if (year != null) {
				self.year = +year;
			}
		}),
		monthComboboxChanged: makeAsync(function(month) {
			print("monthComboboxChanged: ", month);
			if (month != null) {
				self.month = +month;
			}
		}),
		budgetChanged: makeAsync(function(budget) {
			print("budgetChanged: ", budget);
			self.calender.setBudget(self.year, self.month, +(budget.replace(/\./g, "").replace(",", ".")));
		}),
		buttonAddClicked: makeAsync(function() {
			print("buttonAddClicked");
			Modal({
				dateString: "1."+ self.month +"."+ self.year,
				desc: "",
				amount: 0,
			}).then(function(entry) {
				entry.desc = entry.desc +"";
				entry.id = -1;
				return JsonRequest("put", self.baseUrl +"/payments", entry);
			}).then(function(pair) {
				var month = Validate(Types.month, pair[1]);
				self.calender.update(month);
				var entry = Validate(Types.payment, pair[0]);
				if (month.year == self.year && month.month == self.month) {
					self.list.add(entry);
				}
			}).catch(Logger(__LINE__));
		}),
		buttonModifyClicked: makeAsync(function() {
			print("buttonModifyClicked");
			var old = self.list.get(self.table.getObject(self.rows.getSelectedRow()));
			var entry;
			Modal(
				old
			).then(function(now) {
				entry = now;
				return JsonRequest("post", self.baseUrl +"/payments", [ old, now, ]);
			}).then(function(month) {
				Validate(Types.month, month);
				self.calender.update(month);
				if (month.year == self.year && month.month == self.month) {
					self.list.update(entry);
				}
			}).catch(Logger(__LINE__));
		}),
		buttonDeleteClicked: makeAsync(function() {
			print("buttonDeleteClicked");
			var entry = self.list.get(self.table.getObject(self.rows.getSelectedRow()));
			JsonRequest("delete", self.baseUrl +"/payments", entry)
			.then(function(month) {
				Validate(Types.month, month);
				self.calender.update(month);
				if (month.year == self.year && month.month == self.month) {
					self.list.remove(entry);
				}
			}).catch(Logger(__LINE__));
		}),
		mainWindowClosed: function() {
			print("mainWindowClosed");
			System.exit(0);
		},
		getBookingDescriptionFromObject: function(index) {
			return self.list.get(index).desc;
		},
		getBookingDateFromObject: function(index) {
			return new Long(self.list.get(index).date);
		},
		getBookingAmountFromObject: function(index) {
			return new Double(self.list.get(index).amount);
		},
	}));
}).call(this);
