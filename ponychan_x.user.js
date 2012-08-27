// ==UserScript==
// @name          Ponychan X
// @version       1.0
// @description   Adds new features to ponychan
// @namespace     milky
// @author        milky
// @include       http://www.ponychan.net/chan/*
// @exclude       http://www.ponychan.net/chan/board.php
// @icon          http://www.milkyis.me/ponychanx/icon.png
// ==/UserScript==

// Inspired by 4chan X
// http://mayhemydg.github.com/4chan-x/

var AutoUpdate, Favicon, Filter, Keybinds, Main, Ponychan, QR, Settings, Updater;

AutoUpdate = {
	init: function() {
	
	}
};

Favicon = {

};

Filter = {

};

Keybinds = {

};

Main = {
	init: function() {
		
	}
};

Ponychan = {
	
};

QR = {
	init: function() {
		
	}
};

Settings = {
	settings: {
		Updater: {
			"Enable thread autoupdate": true,
			"Enabled watched threads autoupdate": true
		},
		Images: {
			"Show image on hover": true,
			"Show spoilered images": true,
			"Animate gif thumbnails": true
		},
		Monitoring: {
			"Enable read and unread favicons": true,
			"Show unread post count in title": true
		},
		Posting: {
			"Enable quick reply": true
		},
		Posts: {
			"Enable backlinks": true,
			"Enable inline posts": true,
			"Show reply link": true,
			"Show report link": true,
			"Show google image link": true,
			"Show save image link": true
		},
		Other: {
			"Automatically check for updates": true
		}
	}
};

Updater = {
	init: function() {
	
	}
};

Main.init();