package de.tuhh.vs;

import java.util.Date;

import de.tuhh.vs.lab.common.ui.AbstractTableEntryAdapter;
import de.tuhh.vs.samples.common.db.PersistentObject;

public class Booking extends PersistentObject {
	private static final long serialVersionUID = 158803217403953213L;
	
	private int id;
	private String purpose;
	private double amount;
	private long timestamp;

	public Booking(String purpose, double amount) {
		this(0, purpose, amount, System.currentTimeMillis());
	}
	public Booking(int i, String purpose, double amount) {
		this(i, purpose, amount, System.currentTimeMillis());
	}
	public Booking(int id, String purpose, double amount, long timestamp) {
		this.id = id;
		this.purpose = purpose;
		while (this.purpose.getBytes().length % 8 != 0) {
			this.purpose += " ";
		}
		this.amount = amount;
		this.timestamp = timestamp;
	}
	
	// ^= (this, that) -> Booking.@@members.every(member -> this[member].equals(that[member]))
	public boolean equals(Booking that) {
		return this.id == that.id
			&& this.purpose.equals(that.purpose)
			&& this.amount == that.amount
			&& this.timestamp == that.timestamp;
	}

	// PersistentObject
	public void setKey(final int key) { this.id = key; }
	public int getKey() { return id; }
	
	public String toString() {
		return "Booking{ "
				+"id: "+ this.id +", "
				+"purpose: \""+ this.purpose +"\"("+ this.purpose.length() +"), "
				+"amount: "+ this.amount +", "
				+"timestamp: "+ this.timestamp +", "
			+"}";
	}
	
	public static final AbstractTableEntryAdapter handler = new AbstractTableEntryAdapter() {

		@Override
		public String getBookingDescriptionFromObject(Object obj) {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public Date getBookingDateFromObject(Object obj) {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public Double getBookingAmountFromObject(Object obj) {
			// TODO Auto-generated method stub
			return null;
		}
    	
	};
}
