package de.tuhh.vs;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

import jdk.nashorn.api.scripting.*;

public class Request {
	
	@SuppressWarnings("restriction")
	public Request(ScriptObjectMirror options) throws MalformedURLException, IOException {
		
		// parse option
		if (!options.getClassName().equals("Object")) {
			throw new RuntimeException("options must be an object");
		}
		String method = options.containsKey("method") ? (String) options.get("method") : "GET";
		String url = (String) options.get("url");
		ScriptObjectMirror onload = (ScriptObjectMirror) options.get("onload");
		ScriptObjectMirror onerror = (ScriptObjectMirror) options.get("onerror");
		if (!onload.isFunction() || !onerror.isFunction()) {
			throw new RuntimeException("options[onload && onerror] must be functions");
		}
		String data = options.containsKey("data") ? (String) options.get("data") : null;
		

		HttpURLConnection connection = (HttpURLConnection) (new URL(url)).openConnection();
		
		// header
		connection.setRequestMethod(method);
		connection.setRequestProperty("content-type", "application/json");
		connection.setRequestProperty("accept", "application/json");
		connection.setRequestProperty("user-agent", connection.getRequestProperty("user-agent") +"HttpTeam002Client");
		connection.setUseCaches(false);
		connection.setDoInput(true);
		connection.setDoOutput(true);
		

		// body
		if (data != null) {
			try (
				DataOutputStream out = new DataOutputStream(connection.getOutputStream());
			) {
				out.write(data.getBytes());
				out.flush();
				out.close();
			}
		}
		
		// send
		connection.connect();

		// get response
		new Thread(() -> {
			try {
				if (connection.getResponseCode() == 200) {
					try (
						BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
					) {
						String line;
						final StringBuffer response = new StringBuffer();
						while ((line = reader.readLine()) != null) {
							response.append(line);
						}
						System.out.println("got response: "+ response.toString());
						onload.call(this, response.toString());
					}
				} else {
					try (
						InputStream stream = connection.getErrorStream();
					) {
						if (stream != null) {
							try (
								BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getErrorStream()));
							) {
								String line;
								final StringBuffer response = new StringBuffer();
								while ((line = reader.readLine()) != null) {
									response.append(line);
								}
								System.out.println("got error: "+ response.toString());
								onerror.call(this, response.toString());
							}
						} else {
							onerror.call(this, "{ 'status': "+ connection.getResponseCode() +", }");
						}
					}
				}
			} catch (Exception e) {
				e.printStackTrace();
				onerror.call(this, e);
			}
		}).start();
	}
}
