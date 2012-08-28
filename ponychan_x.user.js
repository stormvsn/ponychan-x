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

var AutoUpdate, Favicon, Filter, Keybinds, Main, Ponychan, QR, Settings, ThreadUpdater, WatchedUpdater;
var Set = {};

AutoUpdate = {
	init: function() {
	
	}
};

Favicon = {
	read: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAphJREFUeNpkU89LVFEUPvfHPGfMYKqpCUH8gSiOZERRGliSzNLIEDcVuIgiaBBy0yb69QcE1aJNtiiIwKAirDAowo2YC0GyTCKoibIoNObNzJv37u07NoMzeOHj3XvuPed83znnCft8hkqrIIgMrVtnqiwNT1QFI/eq/WzE0uRfQXIgp3P9riL9MBKQwittibo9RdV2XZCBQFDrDl8mo4ZGVyR111gKWgvyNV/qBxGfwnDKIbsF+rKK8qIiwCKuD0WsqFck6k9n1PftRiYbfFEXSLqrN+CWA/Dy19M/AISZ3btQ0LO3IE2npzpwbEaSU6sMyl/LtS1zuABchE26wiKAifZnQ0eR5AskncTd7YoA7OyuUY8AKTZz9rmQpZ2oz2ZDS8ichP1DyUeXp8wIWzq6wE3YejOCXlYRxVp8mfIEbYN9D7qyGmBZVkpogHsU3x7gFnAZuMpNafJlGzqT4vBwDs+FDM2B2rTjk0YGprkpIIpvDUQMb64Bn4FH7Bz6H3we+/NQ0gbnp9drCk6OyFMwysGs1tDWjkeOJ2xpBDrKpRVL8wSMO5elPe4RJdD0FoeoRg+46kpSybq0tLPPwkH7D2UNmNRjKjvhNAtki7GafAxUoqD2x0zwptmX8S5PJUTuxcwnTGIjV3tBGzPtGDnoah4qA9MUHI8AS8A+x9LER23cKcfcP5HRB0Etz504DP2jaM9bVFo2+pIWteHR5rsuoBY4B4xD38Z5beK9eTVsBK3AZ4gZlOSehdYbrBdZLqHyXxHhN1i8gikNltU/pTVpZeRuT31DS3cxs/I2RktTAH3j2E8Xz/yvjSDwll/STrb4agy1qC2ye1weYAw4Bqc/+L4vswc8F/yfsDy09Q6k9OG4wJf/BBgA+8b4itdkXQIAAAAASUVORK5CYII=",
	unread: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3ZJREFUeNpMU32IVFUUv19v5r03X29mZ32us+VOzjpu07bGkCu7TuCmwmpCiRZF/wZB9UdB9EdgiVAQEUGBEUZgEEaFkhaStn+ItmhYbEW06uyO627pfOx87cy8mbnv3s7VFTrw4xzuOb9zzz3nXCzPXEH3pIsREqu2dzRtgRricwdfY+Vtj+f6vzh9hRpzE9bJHyo8UovrfxfA32DfGi6iYDGJUKZDkQlaG01DKmQA+kVjKOPynnC4Mbg9ZX9Pp2u7nuu6ZhESnAH/IvvK4EgHkgMUCdg7soWAwwSsBWzE+oIrmxsR69j6Co8Mj7HsbV6dZKh2yEYb3vqI+YCsEijhd5W+Sh4W5e2TSHqIqu5XJ2k1Sk9IqxJPyI5t8N7TNxhClKH/CbmrDCTpALz9Jbe451GCMG5iif6gOnuquLWX0+U2in0+xe77+GuIrd9JcGTTmOLeaQUgILtR2y1PjCAgq9v/1CQagf5ESL0jN708g32zJyBuHlChv73/mSJ6ASFAjyof00ZQNhP9GEs/j/54G+s3G4l6Msill2J9cYEEZr6DuNl7FXjUrVOVfaO2yzakltNbZfzdc1rizU+Q1KCIbqxv5eEJnt8TU62iPOCAUlATx6wh/Hau9eCgQHiLLlgSlXYcEOY1l8aOHgfyVQj6i/h/r5K1x23q9Nnt3lNZ7gbDPloLgs+lB183M/PNR3YbrPxQCDvxUHGHLcych1gXrkHAP+qdAA2RboTk96dvEq9+gxCUdVJ+IT2SHt733qeRZnzcJ7B1uZW2wq31voBW6EraWIfoShNTpwMJoqI6lhGlySEP7lBuXdJN7veZ5fH7cfunqQrhoZDq9lXmyl88Ej/dZLBUUiIjt6wNvnEEG1lNVEd34tkPRuY0x70VPZ8fL24OIukt00NvL1pCag+4MOs17Yh3BbaxpWxBsMvDJrHO593Ck9v4wqtD2DXYBY3RVC0Z9HluteTAh0exrKAMlLjLXXrhGXfxxUH1CUrrvsxFaamBMZ8nPWevd2ZOvkKFhxaIkEtU4rSot9Hw82ex999jaoyqWRHZ6d27utFoTWA6S6yf1aYtIOH10+ipAYJk3Be+KJPZwynuWl6yvLNN+44tqQRVwHUgnBCVx9Yj4jjYyH0DZxcBeUTaJou/o7YuBnNLdIOXn5X1zQNYK0zDWeE/AQYANzdmxC01H5wAAAAASUVORK5CYII=",
	init: function() {
		
	}
};

Filter = {
	init: function() {
	
	}
};

Keybinds = {
	init: function() {
		
	}
};

Main = {
	namespace: "pX.",
	version: 1.0,
	board: null,
	thread: null,
	init: function() {
		Settings.init();
		Title.init();
		if (Set["Enable thread autoupdate"])
			ThreadUpdater.init();
		if (Set["Enable watched threads autoupdate"])
			WatchedUpdater.init();
		if (Set["Enable quick reply"])
			QR.init();
		if (Set["Enable filter"])
			Filter.init();
		if (Set["Enable read and unread favicons"])
			Favicon.init();
		if (Set["Enable keybinds"])
			Keybinds.init();
		if (Set["Automatically check for updates"])
			AutoUpdate.init();
	}
};

Ponychan = {
	
};

QR = {
	init: function() {
		
	}
};

Settings = {
	init: function() {
		var ss = Settings.settings;
		for (cat in ss) {
			for (set in ss[cat]) {
				var sset = Settings.get(set);
				Set[set] = typeof sset != null && sset == "true" ? true : ss[cat][set];
			}
		}
	},
	get: function(n) {
		return localStorage.getItem(Main.namespace + n);
	},
	set: function(n, v) {
		localStorage.setItem(Main.namespace + n, v);
	},
	settings: {
		Updating: {
			"Enable thread autoupdate": true,
			"Enable watched threads autoupdate": true
		},
		Images: {
			"Show image on hover": true,
			"Show spoilered images": true,
			"Animate gif thumbnails": true
		},
		Monitoring: {
			"Enable read and unread favicons": true,
			"Show unread post count in title": true,
			"Show thread subject in title": true
		},
		Posting: {
			"Enable quick reply": true,
			"Hide quick reply after posting": false
		},
		Posts: {
			"Enable backlinks": true,
			"Enable inline posts": true,
			"Show reply link": true,
			"Show report link": true,
			"Show google image link": true,
			"Show save image link": true
		},
		Filter: {
			"Enable filter": false
		},
		Other: {
			"Enable keybinds": true,
			"Automatically check for updates": true
		}
	}
};

Title = {
	init: function() {
	
	}
};

ThreadUpdater = {
	init: function() {
		
	}
};

WatchedUpdater = {
	init: function() {
	
	}
};

Main.init();