package controllers;

import com.crumbfeathers.catpaws.Action;
import com.crumbfeathers.catpaws.Player;
import com.crumbfeathers.catpaws.PlayerCommandParser;
import play.Logger;
import play.libs.F;
import play.mvc.Http;
import play.mvc.WebSocketController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Comms extends WebSocketController {
	private static List<Http.Outbound> outboundSockets = new ArrayList<Http.Outbound>();
	private static Map<String,Player> playersMap = PlayersMap.getInstance();
	private PlayerCommandParser parser = new PlayerCommandParser();
	public static void stream() {
		String playerId = null;
		while(inbound.isOpen()) {
			boolean running = false;
			Http.WebSocketEvent e = await(inbound.nextEvent());

			Logger.info("inbound = " + inbound);

			for(String quit: Http.WebSocketEvent.TextFrame.and(F.Matcher.Equals("quit")).match(e)) {
				outbound.send("Bye!");
				outboundSockets.remove(outbound);
				if (playerId != null)
					playersMap.remove(playerId);
				disconnect();
			}

			Action action = null;
			ActionReport actionReport = new ActionReport();
			for(String message: Http.WebSocketEvent.TextFrame.match(e)) {
//				if (message.startsWith("join")) {
//					String name = message.split(":")[1];
//					Logger.info("New player");
//					final Player player = new Player(name);
//					playersMap.put(player.getId(), player);
//					action = Action.JOIN;
//					actionReport = new ActionReport();
//					actionReport.setAction(action);
//					actionReport.setPlayerName(name);
//				}
//				else
				if (message.startsWith("playerId")) {
					String id = getIdFromMessage(message);
					playerId = id;
					final Player player = playersMap.get(id);
					if (player == null) {
						Logger.warn("no player for id " + id);
					} else {
						String messageAction = getActionFromMessage(message);
						action = Action.valueOf(messageAction);
						Logger.info(messageAction);
						if (Action.TALK == action) {
							Logger.info("Got talk message:" + message);
							String says = getPlayerMessageFromMessage(message);
							setupActionReport(action, actionReport, player);
							actionReport.setPlayerMessage(says);
						}
						if (Action.JOIN == action) {
							setupActionReport(action,actionReport,player);
						}
						if (Action.MOVE == action) {
							double x = getXPositionFromMoveMessage(message);
							double y = getYPositionFromMoveMessage(message);
							player.setX(x);
							player.setY(y);
							setupActionReport(action,actionReport,player);
						}
						if (!outboundSockets.contains(outbound)) {
							outboundSockets.add(outbound);
							Logger.info("added outbound" + outbound);
							Logger.info("now have " + outboundSockets.size());
						}
					}
				}
			}

			actionReport.setPositions(playersMap.values());
			Logger.info("action report " + actionReport.toString());
			if (action != null) {
				for (Http.Outbound outboundSocket : outboundSockets) {
					Logger.info("outbound is " + outboundSocket.toString());
					outboundSocket.sendJson(actionReport);
				}
			}

			for(Http.WebSocketClose closed: Http.WebSocketEvent.SocketClosed.match(e)) {
				Logger.info("Socket closed!, player id is " + playerId);
				if (playerId != null) {
					Logger.info("Removing " + playerId);
					playersMap.remove(playerId);
				} else {
					Logger.info("Cannot remove because it's null");
				}
				outboundSockets.remove(outbound);
				disconnect();
			}
		}
	}

	private static double getYPositionFromMoveMessage(String message) {
		if (message != null && message.split(":").length == 5) {
			return Double.valueOf(message.split(":")[4]);
		}
		return 0;
	}

	private static double getXPositionFromMoveMessage(String message) {
		if (message != null && message.split(":").length == 5) {
			return Double.valueOf(message.split(":")[3]);
		}
		return 0;
	}

	private static void setupActionReport(Action action, ActionReport actionReport, Player player) {
		actionReport.setAction(action);
		actionReport.setPlayerName(player.getName());
		actionReport.setPlayerColor(player.getColor());
		actionReport.setPlayerId(player.getId());
	}

	private static String getPlayerMessageFromMessage(String message) {
		if (message.split(":").length == 4) {
			return message.split(":")[3];
		}
		return "error";
	}

	private static String getActionFromMessage(String message) {
		return message.split(":")[2];
	}

	private static String getIdFromMessage(String message) {
		return message.split(":")[1];
	}
}
