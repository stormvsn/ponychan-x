// ==UserScript==
// @namespace     milky
// @name          Ponychan X
// @description   Adds various bloat.
// @author        milky
// @include       http://www.ponychan.net/chan/*/res/*
// @version       0.3
// @icon          http://i.imgur.com/12a0D.jpg
// @updateURL     https://github.com/milkytiptoe/ponychan-x/raw/master/pchanx.user.js
// ==/UserScript==

function ponychanx()
{
	$jq = jQuery.noConflict();
	var us = document.URL.split("/");
	var bid = us[4];
	var tid = us[6].split(".html")[0];
	
	var Main = {
		init: function() {
			if (Settings.gets("Enable quick reply")=="true") QR.init();
			Html.init();
			Css.init();
			if (Settings.gets("Enable autoupdate")=="true") Updater.init();
			if (Settings.gets("Show new post count in title")=="true") Notifier.init();
			Posts.init();
		},
	};
	
	Updater = {
		tmr: 10000,
		last: "",
		init: function() {
			var stmr = Settings.get("x.updatetimer");
			if (stmr != null) Updater.tmr = parseInt(stmr)*1000;
			setTimeout(function() { Updater.get(); }, Updater.tmr);
		},
		get: function() {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", document.URL);
			xhr.setRequestHeader("If-Modified-Since", Updater.last);
			xhr.setRequestHeader("Accept", "*/*");
			xhr.send();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					Updater.last = xhr.getResponseHeader("Last-Modified");
					switch (xhr.status) {
						case 200:
							var l = $jq($jq("table:not(.postform):not(.userdelete) tbody tr td.reply[id] a[name]").get().reverse())[0].name;
							var f = false;
							$jq("table:not(.postform):not(.userdelete)", xhr.responseText).each(function() {
								if (f) {
									$jq(".thread").append(this);
									Posts.newhandle(this);
									Posts.fixhover(this);
									Notifier.newhandle(this);
								}
								if ($jq("tbody tr td.reply[id] a[name]", this)[0].name == l)
									f = true;
							});
						break;
						case 404:
							document.title = Html.title + "(404)";
						break;
					}
					setTimeout(function() { Updater.get(); }, Updater.tmr);
				}
			}
		}
	};
	
	var QR = {
		init: function() {
			QR.keybinds();
			Html.hidepostform();
			if (Settings.get("x.show")=="true") QR.show();
		},
		quote: function(h) {
			QR.show();
			var v = $jq("#qr textarea").val();
			$jq("#qr textarea").val(v + ">>" + h + "\n").focus();
			var vv = $jq("#qr textarea").val().length;
			document.getElementById("msg").setSelectionRange(vv,vv);
		},
		show: function() {
			Settings.set("x.show", "true");
			$jq("#qr").css("display", "block");
			if ($jq("#qr").length) return;
			var qr = document.createElement("div");
			qr.setAttribute("id", "qr");
			qr.innerHTML = '<div class="qrtop"><span></span><a href="javascript:;">X</a></div>\
			<input type="text" name="name" placeholder="Name" size="28" maxlength="75" accesskey="n">\
			<input type="text" name="em" placeholder="Email" size="28" maxlength="75" accesskey="e">\
			<input type="text" name="subject" placeholder="Subject" size="35" maxlength="75" accesskey="s">\
			<textarea name="message" id="msg" placeholder="Message" cols="48" rows="6" accesskey="m"></textarea>\
			<input type="file" id="imgfile" name="imagefile" size="35" multiple="" accesskey="f">\
			<input type="button" value="Reply" accesskey="z">\
			<div id="imagelist"></div>';
			$jq("#qr .qrtop a").live("click", function() { QR.hide(); });
			$jq("#qr > input[type='button']").live("click", function() { QR.send(); } );
			$jq("body").append(qr);
			QR.loadfields();
			document.getElementById("imgfile").onchange = function() { QR.thumb(); };
			var x = Settings.get("x.qrpos_x");
			var y = Settings.get("x.qrpos_y");
			if (x!=null) $jq("#qr").css("left", x)
			if (y!=null) $jq("#qr").css("top", y)
			$jq("#qr .qrtop").mousedown(function(e) {
				e.originalEvent.preventDefault();
				$jq("#qr").css("opacity", "0.8");
				$jq(window).bind("mousemove", function(e) {
					$jq("#qr").css("top", e.clientY-10);
					$jq("#qr").css("left", e.clientX-200);
				}).bind('mouseup', function(e) {
					$jq(this).unbind("mousemove");
					$jq(this).unbind("mouseup");
					$jq("#qr").css("opacity", "1");
					$jq("#qr").css("top", e.clientY-10);
					$jq("#qr").css("left", e.clientX-200);
					if (e.clientY < 33) $jq("#qr").css("top", "33px");
					Settings.set("x.qrpos_x", $jq("#qr").css("left"));
					Settings.set("x.qrpos_y", $jq("#qr").css("top"));
				});
			});
		},
		hide: function() {
			Settings.set("x.show", "false");
			$jq("#qr").css("display", "none");
		},
		send: function() {
			if (!$jq("#qr").length) return;
			$jq("#qr > input[type='button']").val("...");
			var n = $jq("#qr :input[name='name']").val();
			var e = $jq("#qr :input[name='em']").val();
			var s = $jq("#qr :input[name='subject']").val();
			var m = $jq("#qr :input[name='message']").val();
			var fid = parseInt($jq("#thumbselected").attr("name"));
			var i = document.getElementById("imgfile").files[fid];
			var d = new FormData();
			d.append("board", bid);
			d.append("replythread", tid);
			d.append("quickreply", "");
			d.append("name", n);
			d.append("em", e);
			d.append("subject", s);
			d.append("message", m);
			d.append("imagefile", i);
			var xhr = new XMLHttpRequest();
			xhr.open("POST", "http://www.ponychan.net/chan/board.php");  
			xhr.send(d);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						if (xhr.responseText.indexOf("<title>Ponychan</title>") > -1) {
							$jq(".qrtop span").html("<span>You are posting too quickly. Try again.");
							$jq("#qr > input[type='button']").val("Retry");
						}
						else
							QR.clear(fid);
					} else {
						$jq("#qr > input[type='button']").val("Error");
					}
				}
			}
			QR.storefields();
		},
		clear: function(fid) {
			$jq(".qrtop span").html("");
			$jq(".listthumb[name='"+fid+"']").remove();
			QR.thumbreset();
			$jq("#qr textarea").val("");
			$jq("#qr :input[name='subject']").val("");
			$jq("#qr > input[type='button']").val("Reply");
		},
		thumbreset: function() {
			if ($jq("#thumbselected").length < 1) {
				if ($jq(".listthumb").length > 0) {
					$jq($jq(".listthumb")[0]).attr("id", "thumbselected")
					document.getElementById("imagelist").scrollTop = 0;
				} else {
					$jq("#qr").css("height", "230px");
					$jq("#imagelist").html("").css("display", "none");
					$jq("#qr input[type='file']").val("");
				}
			}
		},
		thumb: function() {
			var f = document.getElementById("imgfile").files;
			if (f[0] == null) {
				$jq("#imagelist").html("").css("display", "none");
				$jq("#qr").css("height", "230px");
				return;
			}
			$jq("#imagelist").html("");
			var url = window.URL || window.webkitURL;
			for (var i = 0, len = f.length; i < len; i++)
			{
				var fU = url.createObjectURL(f[i]);
				var thumb = document.createElement("div");
				$jq("#imagelist").append(thumb);
				$jq(thumb).on("mousedown", function(e) {
					if (e.which == 1) {
						$jq("#thumbselected").removeAttr("id");
						this.id = "thumbselected";
					} else if (e.which == 2) {
						$jq(this).remove();
						QR.thumbreset();
					}
				});
				$jq(thumb).attr("class", "listthumb");
				$jq(thumb).attr("name", i);
				$jq(thumb).attr("title", f[i].name + " (middle click to remove)");
				if ($jq("#thumbselected").length < 1) $jq(thumb).attr("id", "thumbselected");
				$jq(thumb).css("background-image", "url(" + fU + ")")
			}
			$jq("#imagelist").fadeIn("fast");
			$jq("#qr").css("height", "308px");
		},
		loadfields: function() {
			var ln = Settings.get("x.name");
			var le = Settings.get("x.email");
			if (ln == null && le == null) {
				$jq("#qr :input[name='name']").val($jq("#postform :input[name='name']").val());
				$jq("#qr :input[name='em']").val($jq("#postform :input[name='em']").val());
			} else {
				$jq("#qr :input[name='name']").val(ln);
				$jq("#qr :input[name='em']").val(le);
			}
		},
		storefields: function() {
			Settings.set("x.name", $jq("#qr :input[name='name']").val());
			Settings.set("x.email", $jq("#qr :input[name='em']").val());
		},
		keybinds: function() {
			var isCtrl = false;
			$jq(document).keyup(function (e) {
				if(e.which == 17) isCtrl = false;
			}).keydown(function (e) {
				if(e.which == 17) isCtrl = true;
				if(e.which == 83 && isCtrl == true) {
					var v = $jq("#qr textarea").val();
					$jq("#qr textarea").val(v + "[?][/?]");
					var vv = $jq("#qr textarea").val().length-4;
					document.getElementById("msg").setSelectionRange(vv,vv);
					return false;
				}
			});
		}
	};
	
	var Posts = {
		init: function() {
			Posts.addhandles();
		},
		addhandles: function() {
			$jq("table:not(.postform):not(.userdelete)").each(function() {
				Posts.newhandle(this);
			});
		},
		newhandle: function(p) {
			if (Settings.gets("Enable quick reply") == "true") {
				$jq(".reflink a:odd", p).attr("href", "javascript:;").removeAttr("onclick").on("click", function() { QR.quote(this.innerHTML); return false; } );
				var hp = $jq("<a>[ - ]</a>").attr("href","javascript:;").on("click", function() {
					var c = hp.closest("table");
					if ($jq(hp).html() == "[ - ]") {
						hp.html("[ + ]");
						$jq(".reply", c).css("height", "10px").css("opacity","0.1");
					} else {
						hp.html("[ - ]");
						$jq(".reply", c).css("height", "auto").css("opacity","1");
					}
				});
			}
			if (Settings.gets("Enable backlinks") == "true") {
				$jq(".doubledash", p).css("display", "block").html("").append(hp);
				$jq("blockquote a[class]", p).each(function() {
					if (this.className.substr(0, 4) == "ref|") {
						var to = this.innerHTML.substr(8, this.innerHTML.length);
						var from = $jq(this).parent().parent().find("a[name]").attr("name");
						var tto = $jq("a[name='"+to+"']");
						if (tto != null) {
							tto.parent().find(".reflink").addClass("ref|"+bid+"|"+tid+"|"+from).append("<a onclick='return highlight("+from+");' href='#"+from+"'>>>"+from+"</a> ");
						}
					}
				});
			}
		},
		fixhover: function(p) {
			$jq("blockquote a[class]", p).each(function() {
				if (this.className.substr(0, 4) == "ref|") {
					this.addEventListener("mouseover", addreflinkpreview, false);
					this.addEventListener("mouseout", delreflinkpreview, false);
				}
			});
		}
	}
	
	var Html = {
		title: document.title,
		init: function() {
			Html.addoptions();
		},
		hidepostform: function() {
			$jq("#postform").css("display", "none");
			var a = document.createElement("a");
			a.innerHTML = "<h2>Quick Reply</h2>";
			a.href = "#";
			a.onclick = function() { QR.show(); };
			$jq(".postarea").prepend(a);
		},
		addoptions: function() {
			$jq(".adminbar").prepend('<a class="adminbaritem" href="javascript:;">Ponychan X</a>').bind("click", function() {
				$jq("#pxoptions").css("display") == "block" ? $jq("#pxoptions").css("display", "none") : $jq("#pxoptions").css("display", "block");
			});
			var opt = $jq("<div id='pxoptions'><strong>Settings</strong><br /></div");
			for (s in Settings.settings) {
				opt.append("<input name='"+s+"' type='checkbox' "+(Settings.gets(s) == "true" ? "checked" : "")+" /> "+s+"<br />");
			}
			$jq('#pxoptions input[type="checkbox"]').live("click", function() { Settings.sets($jq(this).attr("name"), String($jq(this).is(":checked"))); });
			opt.append("Update every <select id='updatetimer' value='"+Settings.get("x.updatetimer")+"'><option value='10'>10</option><option value='15'>15</option><option value='30'>30</option></select> seconds<br />");
			$jq("#updatetimer").live("change", function() { Settings.set("x.updatetimer", String($jq(this).val())); });
			opt.append("<br /><a href='' style='text-decoration: underline;'>Apply changes</a> (refreshes the page)");
			opt.insertAfter(".adminbar");
		}
	};
	
	var Notifier = {
		_new: 0,
		_focus: true,
		init: function() {
			$jq(window).bind("focus", function() {
				Notifier._new = 0;
				Notifier._focus = true;
				setTimeout(function() {
					document.title = ".";
					document.title = Html.title;
				}, 500);
			});
			$jq(window).bind("blur", function() {
				Notifier._focus = false;
			});
		},
		newhandle: function(e) {
			if (Notifier._focus) return;
			++Notifier._new;
			document.title = Html.title + " ("+Notifier._new+")";
		},
	}
	
	var Css = {
		init: function() {
			var s = document.createElement('style');
			s.innerHTML = "#pxoptions { box-shadow: 3px 3px 8px #666; display: none; font-size: medium; padding: 10px; position: absolute; background-color: gray; top: 32px; right: 192px; border: 1px solid black; } #qr * { margin: 0; padding: 0; } #thumbselected { opacity: 1 !important; border: 1px solid black; } .listthumb { opacity: 0.6; display: inline-block; margin-right: 2px !important; border: 1px solid darkgray; width: 71px; height: 71px; background-size: cover; } #imagelist { height: 73px; overflow-y: scroll; margin: 2px; display: none; background-size: cover; } #qr .qrtop a { padding: 1px 4px 0 2px; color: white; float: right; } #qr .qrtop { font-size: small; color: white; padding-left: 5px; background-color: darkgray; height: 20px; cursor: move; } #qr input[type='button'] { width: 90px; height: 23px; float: right; } #qr { padding: 2px; margin-right: 10px; margin-bottom: 10px; padding-top: 2px; padding-left: 2px; display: block; position: fixed; bottom: 0; right: 0; width: 400px; height:230px; background: #eee; border: 1px solid #000; } #qr input[type='text'] { padding: 2px 0 2px 4px; height: 20px; width: 394px; border: 1px solid gray; margin: 1px 0; } #qr textarea { width: 394px; padding: 2px 0 2px 4px; font-family: sans-serif; height: 98px; font-size: small; }";
			document.body.appendChild(s);
		}
	};
	
	var Settings = {
		init: function() {
		
		},
		set: function(n, v) {
			localStorage.setItem(n, v);
		},
		get: function(n) {
			return localStorage.getItem(n);
		},
		sets: function(n, v) {
			localStorage.setItem("x.opt."+n, v);
		},
		gets: function(n) {
			var v = Settings.get("x.opt."+n);
			if (v != null) return v;
			return Settings.settings[n].def;
		},
		settings: {
			"Enable quick reply": {def: "true" },
			"Enable backlinks": {def: "true" },
			"Enable autoupdate": { def: "true" },
			"Show new post count in title": { def: "true" },
		}
	};
	
	$jq(document).ready(function() {
		Main.init();
	});
}

function loadjQ(s)
{
	var script = document.createElement("script");
	script.setAttribute("src", "http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js");
	script.addEventListener('load', function() {
	var script = document.createElement("script");
	script.textContent = "(" + s.toString() + ")();";
	document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}

loadjQ(ponychanx);