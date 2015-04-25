(function() {
	'use strict';
	var self;
	var System = Java.type('java.lang.System');
	var Exception = Java.type('java.lang.Exception');
	var Thread = Java.type('java.lang.Thread');
	var ArrayList = Java.type('java.util.ArrayList');
	var Date = Java.type('java.util.Date');
	var Dialog = Java.type('de.tuhh.vs.lab.common.ui.BookingEntryDialog');

	function Modal(old) {
		return new Promise(function(resolve, reject) {
			var dialog = new Dialog((old.id && old.id != -1 ? "edit" : "create") +" entry", false);

			var date = new Date(old.date || 0);
			dialog.setBookingDateString(old.dateString || (date.getDate() +"."+ (date.getMonth()- -1) +"."+ (date.getYear()- -1900)));
			dialog.setDescriptionString(old.desc || "");
			dialog.setAmountString((old.amount === 0 || old.amount) ? old.amount : 0);

			dialog.setVisible(true);
			new Thread(function() {
				try {
					if (dialog.getAction() == 0x01/*OK*/) {
						var date = dialog.getBookingDateString().match(/^([0-9][0-9]?)\.([0-9][0-9]?)\.([0-9][0-9]([0-9][0-9])?)$/);
						if (date == null) {
							throw "bad date format";
						}
						resolve({
							id: old.id || -1,
							desc: dialog.getDescriptionString() +"",
							amount: +dialog.getAmountString(),
							date: new Date(((date[4] ? date[3] : "20"+ date[3]) - 1900), (date[2] - 1), +date[1]).getTime(),
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

	return self = ({
		init: function(port) {
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
			Object.defineProperty(self, 'years', {
				set: function(list) { self.combo.year.removeAllItems(); list.forEach(function(year) self.combo.year.addItem(year +'')); },
			});
			Object.defineProperty(self, 'months', {
				set: function(list) { self.combo.month.removeAllItems(); list.forEach(function(month) self.combo.month.addItem(month +'')); },
			});
			(function() {
				var year, month;
				Object.defineProperty(self, 'year', {
					get: function() { return +year; },
					set: function(value) {
						year = +value;
						year != null && month != null && self.calender.select(year, month);
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
				return {
					add: function(entry) {
						list.push(entry);
						self.table.setList(list.reduce(function(list, x, index) (list.add(index), list), new ArrayList()));
					},
					update: function(entry) {
						for (var i = 0; i < list.length; i++) {
							if (list[i].id === entry.id) {
								list[i] = entry;
								self.table.setList(list.reduce(function(list, x, index) (list.add(index), list), new ArrayList()));
								return;
							}
						}
					},
					remove: function(index /*or entry*/) {
						for (var i = 0; +index != index && i < list.length; i++) {
							if (list[i].id === entry.id) {
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
					getMonths: function(year) {
						return list.reduce(function(list, item) ((item.year == year && list.indexOf(item.month) == -1 && list.push(item.month)), list), []);
					},
					add: function(entry) {
						if (this.find({ year: entry.year, month: entry.month, })) {
							throw new Exception("month already excists");
						} else {
							list.push(entry);
							this.refresh();
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
							self.budget = (+selected.budget).toFixed(2).replace('.', ',');
							self.sum = (+selected.sum).toFixed(2).replace('.', ',');
							self.diff = ((selected.sum - selected.budget) / selected.budget * 100).toFixed(2).replace('.', ',');
						}
					},
					update: function(year, month, change) {
						var item = this.find({ year: year, month: month, });
						Object.keys(change).forEach(function(key) item[key] = change[key]);
						if (item == selected) { this.select(year, month); }
					},
				};
			})();


			print("init list");
			[
				{ id: 0, desc: 'Toast', amount: 0.60, date: System.currentTimeMillis(), },
				{ id: 1, desc: 'Butter', amount: 0.80, date: System.currentTimeMillis(), },
				{ id: 2, desc: 'Klopse', amount: 1.60, date: System.currentTimeMillis(), },
			].forEach(function(item) self.list.add(item));

			print("init calender");
			[
				{ year: 2012, month: 1, budget: 201, sum: 201 - 100, },
				{ year: 2012, month: 5, budget: 205, sum: 205 - 100, },
				{ year: 2013, month: 1, budget: 301, sum: 301 - 100, },
				{ year: 2013, month: 7, budget: 307, sum: 307 - 100, },
				{ year: 2014, month: 1, budget: 401, sum: 401 - 100, },
				{ year: 2014, month: 9, budget: 409, sum: 409 - 100, },
				{ year: 2015, month: 5, budget: 505, sum: 505 - 100, },
				{ year: 2015, month: 9, budget: 509, sum: 509 - 100, },
				{ year: 2015, month: 12, budget: 512, sum: 512 - 100, },
			].forEach(function(item) self.calender.add(item)); 


		},
		yearComboboxChanged: function(year) {
			print("yearComboboxChanged: ", year);
			if (year != null) {
				self.year = +year;
			}
		},
		monthComboboxChanged: function(month) {
			print("monthComboboxChanged: ", month);
			if (month != null) {
				self.month = +month;
			}

		},
		budgetChanged: function(budget) {
			print("budgetChanged: ", budget);
			self.calender.update(self.year, self.month, { budget: +budget.replace(/\./g, "").replace(",", "."), });
		},
		buttonAddClicked: function() {
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
				print("bum:");
				var month = pair[1];
				self.calender.update(month.year, month.month, month);
				var entry = pair[0];
				if (entry.year == self.year && entry.month == self.month) {
					self.list.update(entry);
				}
			}).catch(function(error) {
				print(error);
				e.printStackTrace && e.printStackTrace();
			});
		},
		buttonModifyClicked: function() {
			print("buttonModifyClicked");
			var old = self.list.get(self.table.getObject(self.rows.getSelectedRow()));
			var entry;
			Modal(
				old
			).then(function(now) {
				entry = now;
				return JsonRequest("post", self.baseUrl +"/payments", [ old, now, ]);
			}).then(function(month) {
				self.calender.update(month.year, month.month, month);
				if (entry.year == self.year && entry.month == self.month) {
					self.list.update(entry);
				}
			}).catch(function(error) {
				print(error);
			});
		},
		buttonDeleteClicked: function() {
			print("buttonDeleteClicked");
			var entry = self.list.get(self.table.getObject(self.rows.getSelectedRow()));
			JsonRequest("delete", self.baseUrl +"/payments", entry)
			.then(function(month) {
				self.calender.update(month.year, month.month, month);
				if (entry.year == self.year && entry.month == self.month) {
					self.list.remove(entry);
				}
			}).catch(function(error) {
				print(error);
			});
		},
		mainWindowClosed: function() {
			print("mainWindowClosed");
			System.exit(0);
		},
		getBookingDescriptionFromObject: function(index) {
			print("getBookingDescriptionFromObject: ", index);
			return self.list.get(index).desc;
		},
		getBookingDateFromObject: function(index) {
			print("getBookingDateFromObject: ", index);
			return self.list.get(index).date;
		},
		getBookingAmountFromObject: function(index) {
			print("getBookingAmountFromObject: ", index);
			return self.list.get(index).amount;
		},
	});
}).call(this);