package controllers;

import com.crumbfeathers.catpaws.Player;

import java.util.HashMap;

public class PlayersMap {
	private static HashMap<String,Player> instance = new HashMap<String, Player>();
	public static HashMap<String,Player> getInstance() {
		return instance;
	}
}
