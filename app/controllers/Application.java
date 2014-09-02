package controllers;

import com.crumbfeathers.catpaws.Player;
import play.Logger;
import play.mvc.Controller;

import java.util.HashMap;

public class Application extends Controller {

    public static void index() {
        render();
    }

	public static void join(String userName) {
		Player player = new Player(userName);
		PlayersMap.getInstance().put(player.getId(),player);
		Logger.info("Player joined: " + userName);
		Logger.info("id is : " + player.getId());
		HashMap<String,String> result = new HashMap<String, String>();
		result.put("id",player.getId());
		renderJSON(result);
	}

	public static void motionTest() {
		render();
	}
}