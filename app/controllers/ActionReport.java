package controllers;

import com.crumbfeathers.catpaws.Action;
import com.crumbfeathers.catpaws.Player;

import java.util.Collection;
import java.util.List;

public class ActionReport {
	private Action action;
	private String playerName;
	private String playerColor;
	private String playerMessage;
	private String playerId;
	private Collection<Player> positions;

	public void setAction(Action action) {
		this.action = action;
	}

	public Action getAction() {
		return action;
	}

	public void setPlayerName(String playerName) {
		this.playerName = playerName;
	}

	public String getPlayerName() {
		return playerName;
	}

	public void setPlayerColor(String playerColor) {
		this.playerColor = playerColor;
	}

	public String getPlayerColor() {
		return playerColor;
	}

	public void setPlayerMessage(String playerMessage) {
		this.playerMessage = playerMessage;
	}

	public String getPlayerMessage() {
		return playerMessage;
	}

	public Collection<Player> getPositions() {
		return positions;
	}

	public void setPositions(Collection<Player> positions) {
		this.positions = positions;
	}

	public void setPlayerId(String playerId) {
		this.playerId = playerId;
	}

	public String getPlayerId() {
		return playerId;
	}

	@Override
	public String toString() {
		String positionString = "";
		for (Player position : positions) {
			positionString += "\n" + position.toString();
		}
		return "ActionReport{" +
				"action=" + action +
				", playerName='" + playerName + '\'' +
				", playerColor='" + playerColor + '\'' +
				", playerMessage='" + playerMessage + '\'' +
				", playerId='" + playerId + '\'' +
				", positions=" + positionString +
				'}';
	}
}
