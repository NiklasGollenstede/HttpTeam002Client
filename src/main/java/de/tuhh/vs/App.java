package de.tuhh.vs;

import java.io.FileNotFoundException;
import java.io.FileReader;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import jdk.nashorn.api.scripting.*;
import de.tuhh.vs.lab.common.ui.BookingOverviewWindow;

public class App 
{
    @SuppressWarnings("restriction")
	public static void main( String[] args )
    {
		
        
        ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
        try {
        	// prepare JS environment
        	engine.eval(new FileReader("setTimeout.js"));
			// engine.eval("setTimeout(print, 0, 'blob', 'blub');");
			engine.eval(new FileReader("Promise.js"));
			engine.eval(new FileReader("JsonRequest.js"));
			// engine.eval(new FileReader("test.js"));

			// load mainScript and wrap it
			ScriptObjectMirror script = (ScriptObjectMirror) engine.eval(new FileReader("mainScript.js"));
			HandlerJsWrapper handler = new HandlerJsWrapper(script);
			
			// create the main window, pass it to the script and init the script
			engine.put("window", new BookingOverviewWindow("Bookings - Overview", true, true, handler, handler));
			script.callMember("init", 8081);
	        
		} catch (ScriptException | FileNotFoundException e) {
			e.printStackTrace();
		}
    }
}
