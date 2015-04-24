package de.tuhh.vs;

import java.util.Date;

import de.tuhh.vs.lab.common.ui.AbstractTableEntryAdapter;
import de.tuhh.vs.lab.common.ui.BookingOverviewPanelHandlerInterface;
import de.tuhh.vs.lab.common.ui.BookingOverviewWindow;

/**
 * Hello world!
 *
 */
public class App 
{
    public static void main( String[] args )
    {
    	
    	
        System.out.println( "Hello World!" );
        BookingOverviewPanelHandlerInterface h = new BookingOverviewPanelHandlerInterface() {

			@Override
			public void yearComboboxChanged(Object newValue) {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void monthComboboxChanged(Object newValue) {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void budgetChanged(String value) {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void buttonAddClicked() {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void buttonDeleteClicked() {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void buttonModifyClicked() {
				// TODO Auto-generated method stub
				
			}

			@Override
			public void mainWindowClosed() {
				// TODO Auto-generated method stub
				
			}
        	
		};
		
        BookingOverviewWindow window = new BookingOverviewWindow(
        		"Bookings - Overview",
				true,
				true,
				a,
				h
        	);
    }
}
