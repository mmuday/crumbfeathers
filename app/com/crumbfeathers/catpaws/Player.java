package com.crumbfeathers.catpaws;

import java.util.Random;
import java.util.UUID;

public class Player {
	private final String name;
	private String id;
	private String color;
	private String icon;
	private double x;
	private double y;
	private static Random random = new Random();
	static int colorIndex;

	public Player(final String name) {
		this.name = name;
		x = random.nextDouble()*500;
		y = random.nextDouble()*500;
		String[] colors = new String[] {"435772","2DA4A8","FEAA3A","FD6041"};
		String[] icons = new String[] {"eggHead.png","flowerTop.png","helmlok.png","skully.png"};
		color = colors[colorIndex % colors.length];
		icon = icons[colorIndex % colors.length];
		colorIndex++;
		id = UUID.randomUUID().toString();
	}

	public double getX() {
		return x;
	}

	public void setX(double x) {
		this.x = x;
	}

	public double getY() {
		return y;
	}

	public void setY(double y) {
		this.y = y;
	}

	public static Random getRandom() {
		return random;
	}

	public static void setRandom(Random random) {
		Player.random = random;
	}

	public String getId() {
		return id;
	}

	public String getColor() {
		return color;
	}

	public String getName() {
		return name;
	}

	public String getIcon() {
		return icon;
	}
}
