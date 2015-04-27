package de.tuhh.vs;

import java.util.Date;

import de.tuhh.vs.lab.common.ui.AbstractTableEntryAdapter;
import de.tuhh.vs.lab.common.ui.BookingOverviewPanelHandlerInterface;
import jdk.nashorn.api.scripting.*;

@SuppressWarnings("restriction")
public class HandlerJsWrapper extends AbstractTableEntryAdapter implements BookingOverviewPanelHandlerInterface {
	
	ScriptObjectMirror self;
	
	HandlerJsWrapper(ScriptObjectMirror self) {
		this.self = self;
	}

	public void yearComboboxChanged(Object newValue) {
		self.callMember("yearComboboxChanged", newValue);
	}
	public void monthComboboxChanged(Object newValue) {
		self.callMember("monthComboboxChanged", newValue);
	}
	public void budgetChanged(String newValue) {
		self.callMember("budgetChanged", newValue);
	}
	public void buttonAddClicked() {
		self.callMember("buttonAddClicked");
	}
	public void buttonDeleteClicked() {
		self.callMember("buttonDeleteClicked");
	}
	public void buttonModifyClicked() {
		self.callMember("buttonModifyClicked");
	}
	public void mainWindowClosed() {
		self.callMember("mainWindowClosed");
	}
	public String getBookingDescriptionFromObject(Object obj) {
		return self.callMember("getBookingDescriptionFromObject", obj).toString();
	}
	public Date getBookingDateFromObject(Object obj) {
		return new Date((Long) self.callMember("getBookingDateFromObject", obj));
	}
	public Double getBookingAmountFromObject(Object obj) {
		return ((Double) self.callMember("getBookingAmountFromObject", obj));
	}

}
