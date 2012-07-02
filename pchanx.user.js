// ==UserScript==
// @name          Ponychan X
// @namespace     milky
// @description   Adds new features to ponychan
// @author        milky
// @contributor   Storm Vision
// @contributor   onekopaka
// @contributor   Guardian
// @include       http://www.ponychan.net/chan/*
// @exclude       http://www.ponychan.net/chan/board.php
// @version       0.28
// @icon          http://i.imgur.com/3MFtd.png
// @updateURL     https://github.com/milkytiptoe/ponychan-x/raw/master/pchanx.user.js
// @homepage      http://www.ponychan.net/chan/meta/res/115168+50.html
// ==/UserScript==

function ponychanx() {
	$jq = jQuery.noConflict();
	
	var Main = {
		ver: 28,
		bid: null,
		tid: null,
		durl: document.URL.split("#")[0],
		init: function() {
			if ($jq("h1").length && $jq("h1").html() == "404 Not Found") {
				if (/\+50/.test(Main.durl)) return window.location = Main.durl.replace("+50", "");
				return;
			}
			var pf = $jq("#postform");
			Main.tid = $jq(":input[name='replythread']", pf).val();
			Main.bid = $jq(":input[name='board']", pf).val();
			if (Settings.gets("Enable quick reply") && pf.length) QR.init();
			if (Settings.gets("Show new post count in title")) Notifier.init();
			if (Settings.gets("Enable filter")) Filter.init();
			if (Settings.gets("Autoupdate watched threads list")) setTimeout(function() { Updater.getwatched(); }, 10000);
			if (Main.tid != "0" && pf.length) {
				if (Settings.gets("Enable autoupdate")) Updater.init();	
				if (Settings.gets("Show autoupdate countdown dialog") && Settings.gets("Enable autoupdate")) Dialog.init();
			}
			Html.init();
			Posts.init();
			Main.update();
		},
		update: function() {
			var d = Date.now();
			var lu = Settings.get("x.update.lastcheck");
			var lv = Settings.get("x.update.latestversion");
			if (lu == null) {
				lu = d;
				Settings.set("x.update.lastcheck", lu);
			}
			if (lv == null) lv = Main.ver;
			if (d > parseInt(lu)+86400000 && lv <= Main.ver) {
				$jq.ajax({
					url: "http://nassign.heliohost.org/s/latest.php"
				}).done(function(lv) {
					Settings.set("x.update.latestversion", lv);
					Settings.set("x.update.lastcheck", d);
				});
			}
			if (lv > Main.ver) {
				$jq("#pxbtn").append(" (Update)");
				$jq("#pxoptions").prepend("<strong>Update</strong><br />A new update for Ponychan X is available.<br />\
				Update applies on your next refresh.<br />\
				<a href='javascript:;' onclick='window.location = \"https://github.com/milkytiptoe/ponychan-x/raw/master/pchanx.user.js\"'>Click here to install the update</a>.<br /><br />");
			}
		}
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
			$jq.ajax({
				headers: {"If-Modified-Since": Updater.last},
				url: Main.durl+"?"+Date.now(),
			}).done(function(rt, s, xhr) {
				setTimeout(function() { Updater.get(); }, Updater.tmr);
				if (Settings.gets("Show autoupdate countdown dialog")) Dialog.countdown();
				switch (xhr.status) {
					case 200:
						Updater.last = xhr.getResponseHeader("Last-Modified");
						$jq("#postform :input[name='how_much_pony_can_you_handle']").val($jq("#postform :input[name='how_much_pony_can_you_handle']", rt).val());
						var tl = $jq(".thread table:last");
						var f = !tl.length;
						var l = f ? -1 : parseInt($jq("a[name]", tl).attr("name"));
						var sat = parseInt($jq(window).scrollTop()) + parseInt($jq(window).height()) > parseInt($jq(document).height()) - 100;
						$jq(".thread table", rt).each(function() {
							var fne = $jq("a[name]", this);
							if (!f && fne != null && parseInt(fne.attr("name")) > l) f = true;
							if (f) {
								var ntl = $jq(".thread table:last");
								ntl.length ? ntl.after(this) : $jq(".thread .op").after(this);
								Posts.newhandle(this);
								Posts.addhover(this);
								Posts.newpostupdate(this);
								Notifier.newhandle(this);
								Filter.newhandle(this);
								if (sat && Settings.gets("Scroll on new post"))	window.scrollTo(0, document.body.scrollHeight);
							}
						});
					break;
					case 404:
						document.title = "(404) " + Html.title;
						QR.settitle("(404)");
						$jq("#qr > input[type='button']").attr("disabled", "disabled");
					break;
				}
			});
		},
		getwatched: function() {
			if (getCookie("showwatchedthreads") == "1") {
				getwatchedthreads("0", Main.bid);
				setTimeout(function() { Updater.getwatched(); }, 30000);
			}
		}
	};
	
	var QR = {
		cooldown: 15,
		ajax: null,
		action: "",
		init: function() {
			Html.hidepostform();
			if (Settings.get("x.show") == "true") QR.show();
			QR.action = $jq("#postform").attr("action");
			var rto = document.URL.split("#i")[1];
			if (rto != null) QR.quote(rto);
			if (Settings.gets("Enable keybinds")) QR.keys();
		},
		quote: function(h) {
			QR.show();
			var qs = "";
			if (Settings.gets("Quote selected text on quick reply")) {
				var s = $jq.trim(window.getSelection().toString());
				if (s.trim() != "")
					qs = ">"+s+"\n";
			}
			h = ">>" + h + "\n" + qs;
			var ta = $jq("#qr textarea")[0];
			var cp = ta.selectionStart;
			ta.value = ta.value.slice(0, cp) + h + ta.value.slice(ta.selectionEnd);
			ta.focus();
			var r = cp + h.length;
			ta.setSelectionRange(r, r);
		},
		settitle: function(t) {
			$jq(".qrtop span").html(t);
		},
		show: function() {
			Settings.set("x.show", "true");
			$jq("#qr").css("display", "block");
			if ($jq("#qr").length) return;
			var qr = document.createElement("div");
			qr.setAttribute("id", "qr");
			qr.innerHTML = '<div class="qrtop"><span></span></div><div class="top"><a href="#" title="Top">\u25b2</a><a href="javascript:;" onclick="javascript:window.scrollTo(0, document.body.scrollHeight);" title="Bottom">&#9660;</a></div><div class="close"><a href="javascript:;" title="Close">X</a></div>\
			<input type="text" name="name" placeholder="Name" size="28" maxlength="75" />\
			<input type="text" name="em" placeholder="Email" size="28" maxlength="75" />\
			<input type="text" name="subject" placeholder="Subject" size="35" maxlength="75" />';
			if ($jq("input[name='embed']", "#postform").length) {
				qr.innerHTML += '<div class="embedwrap"><input type="text" name="embed" id="embed" placeholder="Embed" size="28" maxlength="75" />\
				<select name="embedtype"><option value="youtube">Youtube</option><option value="google">Google</option><option value="vimeo">Vimeo</option><option value="blimp">Blimp</option></select></div>';
			}
			qr.innerHTML +=	'<textarea name="message" id="msg" placeholder="Message" cols="48" rows="6" ></textarea>\
			<input type="file" id="imgfile" name="imagefile" size="25" multiple="" accept="image/*" >';
			if ($jq("#nofile").length) qr.innerHTML += '<label><input type="checkbox" name="nofile" /> No File</label>';
			qr.innerHTML += '<input type="button" value="Reply">\
			<div class="postopts"><label><input type="checkbox" name="spoiler" /> Spoiler</label> \
			' + ($jq("#nsfw").length ? '<label><input type="checkbox" name="nsfw" /> NSFW</label> ' : '') + '\
			' + (Main.tid != "0" ? '<label class="auto"><span id="imgnum">(0)</span> Auto <input type="checkbox" name="auto" /></label>' : '') + '\
			</div><div id="imagelist"></div>';
			if (checkMod()) {
				qr.innerHTML += '<div id="modpanel">\
				<input name="modpassword" placeholder="Mod Password" size="28" maxlength="75" type="text" /> \
				<label title="Display staff status (Mod/Admin)"><input name="displaystaffstatus" type="checkbox" checked /> Display Status</label> \
				<label title="Lock this thread"><input name="lockonpost" type="checkbox" /> Lock</label> \
				<label title="Sticky this thread"><input name="stickyonpost" type="checkbox" /> Sticky</label> \
				<label title="Post with raw HTML"><input name="rawhtml" type="checkbox" /> Raw HTML</label> \
				<label title="Name"><input name="usestaffname" type="checkbox" /> Name</label> \
				</div>';
			}
			$jq("body").append(qr);
			$jq("#qr .close a").on("click", function() { QR.hide(); });
			$jq(window).resize(function() {
				if ($jq("#qr").position().left+410 > document.documentElement.clientWidth) {
					$jq("#qr").css("left", document.documentElement.clientWidth-410);
					Settings.set("x.qrpos_x", $jq("#qr").css("left"));
				}
			});
			if (Settings.gets("Hide quick reply when top button clicked")) $jq("#qr .top a:first").on("click", function() { QR.hide(); });
			var btn = $jq("#qr > input[type='button']");
			if (Main.tid == "0") btn.val("Thread"); 
			btn.on("click", function() { QR.send(); });
			if (Settings.gets("Sync original post form and quick reply")) {
				$jq("#qr > input[name], #qr textarea").on("input", function() {
					$jq("#postform").find("[name='"+this.name+"']").val(this.value);
				});
				$jq("#postform input[name], #postform textarea").on("input", function() {
					$jq("#qr").find("[name='"+this.name+"']").val(this.value);
				});
			}
			
			QR.loadfields();
			document.getElementById("imgfile").onchange = function() { QR.thumb(); };
			var x = Settings.get("x.qrpos_x");
			var y = Settings.get("x.qrpos_y");
			if (x != null) $jq("#qr").css("left", x);
			if (y != null) $jq("#qr").css("top", y);
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
			if (QR.ajax != null) { QR.ajax.abort(); return; }
			var sb = $jq("#qr > input[type='button']");
			var fid = parseInt($jq("#thumbselected").attr("name"));
			var d = new FormData();
			d.append("board", Main.bid);
			d.append("replythread", Main.tid);
			d.append("ponychanx", Main.ver);
			d.append("stats_referrer", "");
			if (!$jq("input[name='nofile']", "#qr").is(":checked"))
				d.append("imagefile", document.getElementById("imgfile").files[fid]);
			d.append("quickreply", $jq("#postform :input[name='quickreply']").val());
			d.append("postpassword", $jq("#postform :input[name='postpassword']").val());
			d.append("how_much_pony_can_you_handle", $jq("#postform :input[name='how_much_pony_can_you_handle']").val());
			$jq(":input:not([type='file'],[type='button'],[name='auto'])", "#qr").each(function() {
				var v = this.getAttribute("type") == "checkbox" ? this.checked == true ? "true" : null : this.value;
				if (v != null) d.append(this.name, v);
			});
			var xhr = QR.ajax = new XMLHttpRequest();
			xhr.upload.addEventListener("progress", function(evt) {
				if (evt.lengthComputable)
					sb.val(Math.round(evt.loaded * 100 / evt.total).toString() + '%');
			}, false);
			xhr.open("POST", QR.action);  
			xhr.send(d);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						Notifier._me = true;
						if (xhr.responseText.indexOf("<title>Ponychan</title>") > -1) {
							QR.settitle(xhr.responseText.match(/.*<h2.*>([\s\S]*)<\/h2>.*/)[1]);
							sb.val("Retry");
						} else {
							if (Main.tid == "0" && $jq("#postform :input[name='quickreply']").val() == "")
								location.reload(true);
							QR.clear(fid);
						}
					} else {
						QR.settitle("(" + xhr.status + ") An error occured while posting");
						sb.val("Retry");
					}
					QR.storefields();
					QR.ajax = null;
				}
			}
			xhr.onabort = function() {
				QR.settitle("Posting aborted");
			}
		},
		cooldowntimer: function() {
			$jq("#qr > input[type='button']").attr("disabled", "disabled").val(QR.cooldown);
			if (QR.cooldown > 0) {
				setTimeout(function() { QR.cooldowntimer(); }, 1000);
				var a = $jq("#qr .postopts :input[name='auto']").is(":checked") ? "Auto " : "";
				$jq("#qr > input[type='button']").val(a+QR.cooldown);
				QR.cooldown--;
			} else {
				$jq("#qr > input[type='button']").removeAttr("disabled").val(Main.tid == "0" ? "Thread" : "Reply");
				QR.cooldown = 15;
				if ($jq("#qr .postopts :input[name='auto']").is(":checked") && $jq(".listthumb").length > 0)
					QR.send();
			}
		},
		clear: function(fid) {
			$jq("#postform :input[name='quickreply']").val("");
			QR.settitle("");
			$jq(".listthumb[name='"+fid+"']").remove();
			QR.thumbreset();
			var ts = $jq("#thumbselected");
			var tsp = ts.length > 0 ? ts.attr("data-post") : "";
			$jq("#qr textarea").val(tsp);
			$jq("#qr input[name='subject']").val("");
			$jq("#qr #modpanel :input[name='lockonpost']").attr("checked", false);
			$jq("#qr #modpanel :input[name='stickyonpost']").attr("checked", false);
			$jq("#qr #modpanel :input[name='rawhtml']").attr("checked", false);
			$jq("#qr .embedwrap :input[name='embed']").val("");
			$jq("#qr .postopts :input[name='spoiler']").attr("checked", false);
			$jq("#qr .postopts :input[name='nsfw']").attr("checked", false);
			if (Settings.gets("Hide quick reply after posting") && !$jq("#qr .postopts :input[name='auto']").is(":checked"))
				QR.hide();
			QR.cooldowntimer();
		},
		thumbreset: function() {
			if ($jq("#thumbselected").length < 1) {
				if ($jq(".listthumb").length > 0) {
					$jq($jq(".listthumb")[0]).attr("id", "thumbselected");
					document.getElementById("imagelist").scrollTop = 0;
					$jq("#qr textarea").val($jq("#thumbselected").attr("data-post"));
				} else {
					$jq("#imagelist, .postopts").css("display", "none");
					$jq("#qr input[type='file']").val("");
					$jq("#qr .postopts :input[name='auto']").attr("checked", false);
				}
			}
			$jq("#imgnum").text("(" + $jq(".listthumb").length + ")");
		},
		thumb: function() {
			var f = document.getElementById("imgfile").files;
			if (f[0] == null) {
				$jq("#imagelist, .postopts").css("display", "none");
				$jq("#imagelist").html("");
				return;
			}
			$jq("#imagelist").html("");
			var url = window.URL || window.webkitURL;
			for (var i = 0, len = f.length; i < len; i++) {
				if (f[i].size > $jq("#postform input[name='MAX_FILE_SIZE']").val()) {
					QR.settitle(f[i].name + " is too large");
					continue;
				}
				if (!/^image/.test(f[i].type)) {
					QR.settitle(f[i].name + " is not an image");
					continue;
				}
				var fU = url.createObjectURL(f[i]);
				var thumb = document.createElement("div");
				$jq("#imagelist").append(thumb);
				$jq(thumb).on("mousedown", function(e) {
					if (e.which == 1) {
						var upc = (Settings.gets("Unique post content per image"));
						if (upc)
							$jq("#thumbselected").attr("data-post", $jq("#qr textarea").val());
						$jq("#thumbselected").removeAttr("id");
						this.id = "thumbselected";
						if (upc)
							$jq("#qr textarea").val(this.getAttribute("data-post"));
					} else if (e.which == 2) {
						$jq(this).remove();
						QR.thumbreset();
						url.revokeObjectURL(fU);
					}
				});
				$jq(thumb).attr("class", "listthumb");
				$jq(thumb).attr("name", i);
				$jq(thumb).attr("title", f[i].name + " (middle click to remove)");
				if ($jq("#thumbselected").length < 1) $jq(thumb).attr("id", "thumbselected");
				$jq(thumb).css("background-image", "url(" + fU + ")");
			}
			if ($jq(".listthumb").length) $jq("#imagelist, .postopts").css("display", "block");
			$jq("#imgnum").text("(" + $jq(".listthumb").length + ")");
		},
		loadfields: function() {
			var ln = getCookie("name");
			var le = getCookie("email");
			$jq("#qr :input[name='name']").val(ln == null ? "" : ln);
			$jq("#qr :input[name='em']").val(le == null ? "" : le);
		},
		storefields: function() {
			set_cookie("name", $jq("#qr :input[name='name']").val(), -1);
			var eu = $jq("#qr :input[name='em']").val();
			if(eu != "sage" && eu != "\u4E0B\u3052")
				set_cookie("email", eu, -1);
		},
		keys: function() {
			$jq(document).bind("keydown", function (e) {
				if (e.ctrlKey) {
					var t = null;
					switch (e.which) {
						case 83: if (Settings.gets("Spoiler tags")) t = "?"; break;
						case 66: if (Settings.gets("Bold tags")) t = "b"; break;
						case 73: if (Settings.gets("Italic tags")) t = "i"; break;
						case 85: if (Settings.gets("Underline tags")) t = "u"; break;
						case 82: if (Settings.gets("Strikethrough tags")) t = "s"; break;
						case 81: if (Settings.gets("Show/hide quick reply")) $jq("#qr").css("display") == "block" ? QR.hide() : QR.show(); return false; break;
					}
					if (t != null) {
						var ins = "["+t+"][/"+t+"]";
						var ta = $jq("#qr textarea")[0];
						var cp = ta.selectionStart;
						ta.value = ta.value.slice(0, cp) + ins + ta.value.slice(ta.selectionEnd);
						ta.focus();
						var r = cp + ins.length - 4;
						ta.setSelectionRange(r, r);
						return e.preventDefault();
					}
				}
			});
		},
		resetpos: function() {
			$jq("#qr").css("top", "46px").css("left", "83px");
			Settings.set("x.qrpos_x", $jq("#qr").css("left"));
			Settings.set("x.qrpos_y", $jq("#qr").css("top"));
		}
	};
	
	var Dialog = {
		left: 0,
		init: function() {
			$jq("body").append($jq("<div id='dialog'><span id='d-countdown'></span><br /><span id='d-update-now'></span></div>"));
			Dialog.left = Updater.tmr/1000;
			Dialog.countdown();
		},
		countdown: function() {
			if (Dialog.left > -1) {
				$jq("#dialog #d-countdown").html("Autoupdate: " + Dialog.left);
				Dialog.left--;
				setTimeout(function() {	Dialog.countdown(); }, 1000);
			} else {
				Dialog.left = Updater.tmr/1000;
				$jq("#dialog #d-countdown").html("Autoupdate: ..");
			}
		}
	};
	
	var Posts = {
		init: function() {
			Posts.addhandles();
		},
		addhandles: function() {
			if (Main.tid != "0" && $jq("#postform").length > 0) {
				var oe = $jq(".thread").contents(":not(table,span:last)");
				var op = $jq("<div class='op'></div>");
				$jq(".thread").prepend(op);
				op.append(oe);
				var bs = $jq("<span class='extrabtns'></span>");
				$jq(".reflink:first").after(bs);
				Posts.newhandle(".op");
			}
			if (Main.tid == "0") {
				if (Settings.gets("Enable quick reply")) {
					$jq(".postfooter > a[title='Quick Reply']").each(function() {
						var to = $jq(this).attr("onclick");
						to = to.replace("javascript:quickreply('", "");
						to = to.replace("');", "");
						$jq(this).attr("href", "javascript:;").removeAttr("onclick");
						$jq(this).on("click", function() {
							QR.show();
							$jq("#qr > input[type='button']").val("Reply");
							QR.settitle("Quick replying to >>"+to)
							$jq("#postform :input[name='quickreply']").val(to);
						});
					});
				}
				$jq(".omittedposts a[title='Expand Thread']").click(function() {
					$jq(document).bind("DOMNodeInserted", function(p) {
						var pt = p.target;
						if (pt.nodeName == "TABLE")
							Posts.newhandle(pt);
					});
				});
			}
			var ts = $jq("#delform");
			ts = ts.length == 0 ? $jq(".thread") : ts;
			$jq("table:not(.postform):not(.userdelete)", ts).each(function() {
				Posts.newhandle(this);
			});			
		},
		hide: function(hp) {
			hp = $jq(hp);
			var c = hp.closest("table");
			var t = $jq(".postertrip", c).html();
			hp.html() == "[ - ]" ? hp.html("[ + ] " + $jq(".postername", c).html() + (t == null ? "" : t)) : hp.html("[ - ]");
			$jq("a[href]", hp).removeAttr("href");
			$jq(".reply", c).toggle();
		},
		getcrossthread: function(anc, pid) {
			var xhr = new XMLHttpRequest();
			xhr.open("GET", anc.href);
			xhr.setRequestHeader("Accept", "*/*");
			xhr.send();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						var f = false;
						$jq("table:not(.postform):not(.userdelete)", xhr.responseText).each(function() {
							if (!f && $jq("tbody tr td.reply[id] a[name]", this)[0].name == pid)
								f = true;
							if (f) {
								var c = $jq("td.reply[id]", this).addClass("inline").insertAfter(anc);
								Posts.newhandle(c);
								Posts.newpostupdate(c);
								c.find("a[name], .postfooter").remove();
								c.find(".reflink a").removeAttr("onclick").unbind("click");
								c.find(".reflink a:not(:first)").removeAttr("href").css("cursor","not-allowed");
								return false;
							}
						});
						if (!f)
							$jq("<td class='reply inline'>Reply not found<br /><a target='_blank' style='font-family: \"Trebuchet MS\";' href='"+anc.href+"'>Open thread in new tab</a></td>").insertAfter(anc);
					} else {
						$jq("<td class='reply inline'>Reply not found ("+xhr.status+")</td>").insertAfter(anc);
					}
				}
			}
		},
		newhandle: function(p) {
			var eq = Settings.gets("Enable quick reply");
			var eb = Settings.gets("Enable backlinks");
			var ei = Settings.gets("Enable inline replies");
			var eh = Settings.gets("Enable hide post buttons");
			var df = $jq("#delform").length > 0;
			var bp = Main.tid == "0";
			if (eh) {
				$jq(".doubledash", p).html("").append($jq("<a>[ - ]</a>").attr("href","javascript:;").on("click", function() {
					Posts.hide(this);
				}));
			}
			var ql = $jq($jq(".reflink a", p)[1]);
			if (eq && !bp && df) {
				ql.attr("href", "javascript:;").removeAttr("onclick").on("click", function() { QR.quote(this.innerHTML); return false; } );
			}
			var from = ql.html();
			var im = $jq("a[href] span[id] img", p)[0];
			Posts.addexpandimg(p);
			if (eb || ei || eq) {
				$jq("blockquote a[class]", p).each(function() {
					var tto, to, ffrom;
					if (this.className.substr(0, 4) == "ref|") {
						to = this.innerHTML.substr(8, this.innerHTML.length);
						try {
							tto = $jq("a[name='"+to+"']");
						} catch(e) { return true; }
						ffrom = $jq("a[name='"+from+"']");
					}
					if (tto != null && eb) {
						var blcl = "ref|"+Main.bid+"|"+Main.tid+"|"+from;
						var blat = tto.parent().find(".extrabtns")[0];
						if ($jq("a[class='"+blcl+"']", blat).length == 0) {
							var bl = $jq("<a href='#"+from+"' onclick='return highlight("+from+", true);' class='"+blcl+"'>>>"+from+"</a> ")
							.on("mouseover", addreflinkpreview)
							.on("mouseout", delreflinkpreview);
							$jq(blat).append(bl);
						}
					}
					if (ei && tto != null && $jq(this).parent().attr("class") != "extrabtns") {
						$jq(this).removeAttr("onclick");
						$jq(this).on("click", function() {
							var n = $jq(this).next();
							if (n.hasClass("inline"))
								n.remove();
							else {
								var ca = this.className.split("|");
								if (($jq("a[name='"+ca[3]+"']").length < 1) && Settings.gets("Enable cross-thread inline replies")) {
									Posts.getcrossthread(this, ca[3]);
								} else {
									var pc = tto.parent();
									if (pc[0].nodeName != "DIV" || Main.tid != "0") {
										var c = pc.clone(true).addClass("inline").removeAttr("id").insertAfter(this);
										$jq("a[name]", c).remove();
										Posts.addhover(c);
										Posts.addexpandimg(c);
									} else {
										return;
									}
								}
							}
							return false;
						});
					}
				});
			}
			var rb = $jq(".postfooter", p);
			if (eq && !bp && df) {
				$jq("a:first", rb).removeAttr("onclick").attr("href", "javascript:;")
				.on("click", function() { QR.quote(from); return false; });
			}
			if (im != null) {
				if (Settings.gets("Add google image shortcut to posts"))
					rb.append(unescape("&nbsp;%u2022&nbsp; <a target='_blank' href='http://www.google.com/searchbyimage?image_url="+im.src+"'>Google</a> "));
				if (Settings.gets("Add download image shortcut to posts"))
					rb.append(unescape(" &nbsp;%u2022&nbsp; <a href='"+im.src+"' target='_blank'>Download</a>"));
			}
		},
		addhover: function(p) {
			$jq("blockquote a[class]", p).each(function() {
				if (this.className.substr(0, 4) == "ref|") {
					this.addEventListener("mouseover", addreflinkpreview, false);
					this.addEventListener("mouseout", delreflinkpreview, false);
				}
			});
		},
		newpostupdate: function(p) {
			var timezone = getCookie('timezone');
			timezone = timezone === '' ? -8 : parseInt(timezone, 10);
			var timeFormat = 'ddd, MMM d, yyyy ' + (getCookie('twelvehour') !== '0' ? 'h:mm tt' : 'H:mm');
			$jq(".posttime",p).html(Date.parse($jq(".posttime",p).text()).addHours(8 + timezone).toString(timeFormat)
				.replace(/([AP]M)$/, '<span style="font-size:0.75em">$1</span>'));
			var tc = $jq(".postertrip", p);
			var rd = $jq(".rd", tc);
			if (rd.length > 0)
				new Rainbow(rd[0],224,true,100,-20);
			else {
				if (tc.html() === "!!PinkiePie")
					tc.html('<img src="/chan/css/images/pinkie-cutie-sm.png" alt="!!" width=12 height=20 style="position:relative;top:3px"><span style="color:#e4a">PinkiePie</span>');
				if (tc.html() === "!!Rarity")
					tc.html('<img src="/chan/css/images/rock-sm.png" alt="!!" width=15 height=20 style="vertical-align:top">Rarity');
			}
			var pn = $jq(".postername", p);
			if ($jq(".mod, .admin", pn).length > 0) return;
			var hn = getCookie("hidenames");
			if (hn == "1") {
				pn.html("Anonpony");
				tc.html("");
			} else if (hn == "3") {
				var hnt = pn.html() + (tc.length > 0 ? tc.html() : "");
				pn.html("<a title='"+hnt+"'>Anonpony</a>");
				tc.html("");
			}
		},
		addexpandimg: function(p) {
			$jq("a[href] span[id] img", p).each(function() {
				var os = this.src;
				var ns = this.src;
				ns = ns.replace("/thumb/", "/src/");
				ns = ns.replace("s.", ".");
				var fs = $jq(this).closest("td").find(".filesize");
				if (Settings.gets("Animate gif thumbnails") && fs.text().indexOf(", spoiler.gif") == -1 && this.src.indexOf("s.gif") > 0) {
					this.src = ns;
					this.removeAttribute("height");
					this.removeAttribute("width");
					this.style.maxWidth = "126px";
					this.style.maxHeight = "126px";
				}
				var imp = $jq(this).parent();
				var fsa = $jq("a:first", fs);
				fsa.attr("href", "javascript:;");
				fsa.removeAttr("onclick").unbind("click");
				fsa.on("click", function() { Posts.expandimg(imp, ns, os); });
				if (Settings.gets("Expand images on hover")) {
					var img = $jq(this).unbind("mouseover").on("mouseover", function(e) {
						var hi = document.createElement("img");
						hi.id = "hoverimg";
						hi.src = ns;
						hi.style.position = "absolute";
						hi.style.left = e.pageX+126+"px";
						hi.style.top = e.pageY-126+"px";
						$jq("body").append(hi);
						hi.style.maxWidth = document.documentElement.clientWidth-300+"px";
						hi.style.maxHeight = document.documentElement.clientHeight-300+"px";
						img.on("mouseout", function(e) {
							$jq("#hoverimg").remove();
							img.unbind("mouseout").unbind("mousemove");
						}).on("mousemove", function(e) {
							hi.style.left = e.pageX+126+"px";
							hi.style.top = e.pageY-126+"px";
						});
					});
				}
			});
		},
		expandimg: function(imp, ns, os) {
			var img = $jq("img", imp)[0];
			var nns = img.src == os ? ns : os;
			var mw = document.documentElement.clientWidth-100+"px";
			imp.html("<img src='"+nns+"' class='thumb' style='max-width: "+mw+";' />");
		},
	}
	
	var Html = {
		title: document.title,
		init: function() {
			Html.options();
			Html.css();
			Html.catalog();
		},
		hidepostform: function() {
			var pf = $jq("#postform");
			if (Settings.gets("Hide original post form") && pf.length > 0) {
				pf.css({"visibility":"hidden", "height":"0"});
				var a = document.createElement("a");
				Main.tid == "0" ? a.innerHTML = "<h2>New Thread</h2>" : a.innerHTML = "<h2>Quick Reply</h2>";
				a.href = "javascript:;";
				a.onclick = function() { QR.show(); };
				var topf = document.createElement("a");
				topf.innerHTML = "<h5>Show/Hide Original Post Form</h5>";
				topf.href = "javascript:;";
				topf.onclick = function() { 
					pf.css("height") == "0px" ? pf.css({"visibility":"visible", "height":"auto"}) : pf.css({"visibility":"hidden", "height":"0"});
				};
				$jq(".postarea").prepend(topf);
				$jq(".postarea").prepend(a);
			}
		},
		options: function() {
			$jq(".adminbar").prepend($jq('<a class="adminbaritem" id="pxbtn" href="javascript:;">Ponychan X</a>').bind("click", function() {
				$jq("#pxoptions").css("display") == "block" ? $jq("#pxoptions").css("display", "none") : $jq("#pxoptions").css("display", "block");
			}));
			var ow = $jq("<div id='pxoptions'></div>");
			var ol = $jq("<div style='float: left;'></div>");
			var or = $jq("<div style='float: right;'></div>");
			ow.append(ol);
			ow.append(or);
			var lc = "";
			var ke = Settings.gets("Enable keybinds");
			for (s in Settings.settings) {
				var c = Settings.settings[s].cat;
				if (c != lc) {
					lc = c;
					ol.append("<strong>"+c+"</strong><br />");
				}
				ol.append("<input name='"+s+"' type='checkbox' "+(Settings.gets(s) ? "checked" : "")+" /> "+s+"<br />");
				if (c == "Keybinds" && !ke) break;
			}
			var s = Settings.get("x.updatetimer");
			ol.append("Update every <input type='text' id='updatetimer' value='"+(s == null ? "10" : s)+"'> seconds<br />");
			$jq("#updatetimer").live("change", function() { if (isNaN(parseInt($jq(this).val()))) return; Settings.set("x.updatetimer", $jq(this).val()); });
			$jq('#pxoptions input[type="checkbox"]').live("click", function() { Settings.sets($jq(this).attr("name"), String($jq(this).is(":checked"))); });
			if (Settings.gets("Enable filter")) {
				or.append("<strong>Filter</strong><br />Insert ; after each item<br />\
				Names<br /><input id='n' name='nlist' type='text' value='' style='width: 99%' />\
				Tripcodes<br /><input id='t' name='tlist' type='text' value='' style='width: 99%' />\
				Posts<br /><input id='p' name='plist' type='text' value='' style='width: 99%' /><br /><br />")
				.on("input", function() { Filter.save(); });
			}
			or.append("<a href='javascript:;' onclick='location.reload(true);'>Apply changes</a> (refreshes the page)\
			<br /><br /><strong>More</strong><br />\
			<a target='_blank' href='http://www.ponychan.net/chan/meta/res/115168+50.html'>View support thread</a>");
			if (ke)
				or.append("<br /><a href='javascript:;' onclick=\"javascript:alert('Ctrl+Q - Show/hide quick reply\\nCtrl+S - [?][/?] - Spoiler tags\\nCtrl+U - [u][/u] - Underline tags\\nCtrl+B - [b][/b] - Bold tags\\nCtrl+R - [s][/s] - Strikethrough tags\\nCtrl+I - [i][/i] - Italic tags');\">View keybinds</a>");
			or.append($jq("<br /><a href='javascript:;'>Reset quick reply</a>").on("click", function() { QR.resetpos(); }));
			ow.insertAfter(".adminbar");
		},
		catalog: function() {
			if ($jq(".catalogtable").length > 0) {
				$jq("#SearchText").on("keyup", function(e) {
					if (e.keyCode == 13) Html.cataloglasts();
				});
				$jq("#SearchBtn").on("click", function() {
					Html.cataloglasts();
				});
			}
		},
		cataloglasts: function() {
			var rt = $jq(".catalogtable").next();
			$jq("div a[href]", rt).each(function() {
				var h = this.href.replace(".html", "+50.html");
				var at = $jq("<a href='"+h+"' style='margin-left: 6px;'>[+50]</a>");
				$jq(this).after(at);
			});
		},
		css: function() {
			var s = document.createElement('style');
			s.innerHTML = "#dialog { position: fixed; bottom: 10px; right: 10px; text-align: right; }\
			#embed { width: 314px !important; }\
			#qr .embedwrap select { padding: 3px 0 2px 0; }\
			#qr .top a { height: 19px; float: left; color: white; background-color: black; padding: 0 0 1px 1px; }\
			.postarea a h2 { padding-bottom: 4px; }\
			.reply.inline, .op.inline { border: 1px solid rgba(0, 0, 0, 0.3) !important; }\
			#updatetimer { width: 30px; }\
			#pxoptions { z-index: 3200; width: 503px; height: 490px; overflow-y: scroll; box-shadow: 3px 3px 8px #666; display: none; font-size: 13px; padding: 10px; position: absolute; background-color: gray; border: 1px solid black; top: 32px; right: 185px; }\
			#pxoptions a { text-decoration: underline; }\
			#qr * { margin: 0; padding: 0; }\
			#imgfile { margin-right: 3px; }\
			.postopts { clear: both; display: none; margin-left: 2px !important; }\
			#qr label, .postopts label { font-size: small; }\
			.postopts .auto { float: right; margin: 1px 2px 0 0 !important; }\
			#thumbselected { opacity: 1 !important; border: 1px solid black; }\
			.listthumb { opacity: 0.6; display: inline-block; margin-right: 2px !important; border: 1px solid darkgray; width: 71px; height: 71px; background-size: cover; }\
			#imagelist { height: 73px; overflow-y: scroll; margin: 2px; display: none; background-size: cover; }\
			#qr .close a { font-weight: bold; width: 16px; height: 19px; padding: 1px 0 0 5px; color: white; float: right; background-color: black; border-radius: 0 4px 0 0; }\
			#qr .qrtop { float: left; width: 340px; font-size: small; color: white; padding-left: 5px; background-color: #000; height: 20px; cursor: move; border-radius: 4px 0 0 0; }\
			#qr input[type='button'] { width: 90px; height: 23px; float: right; }\
			#qr { padding: 2px; padding-top: 2px; padding-left: 2px; display: block; position: fixed; top: 46px; left: 83px; width: 400px; background: #e2e2e2; border-radius: 4px; border: 1px solid #000; }\
			#qr input[type='text'] { padding: 2px 0 2px 4px; height: 20px; width: 394px; border: 1px solid gray; margin: 1px 0; }\
			#qr textarea { width: 394px; padding: 2px 0 2px 4px; font-family: sans-serif; height: 98px; font-size: small; }\
			.extrabtns { vertical-align: top; }\
			#pxbtn { margin-right: -4px; }\
			.postarea a h5 { margin: 0 0 12px 0; }\
			#modpanel { clear: both; font-size: small; }\
			#modpanel label input, #qr label input, .postopts label input { position: relative; top: 2px; }";
			if (Settings.gets("Enable hide post buttons")) s.innerHTML += " td.reply { margin-left: 25px; } .doubledash { white-space: nowrap; display: block !important; }";
			if (Settings.gets("Hide namefields")) s.innerHTML += " input[name='name'] { background-color: black; } input[name='name']:hover { background-color: white; }";
			if (getCookie("vertnavbar") == "1") s.innerHTML += " #pxoptions { top: 28px; right: auto; left: 0; } #pxbtn { height: 9px; } ";
			document.body.appendChild(s);
		}
	};
	
	var Notifier = {
		_new: 0,
		_focus: true,
		_me: false,
		init: function() {
			$jq(window).bind("focus", function() {
				Notifier._new = 0;
				Notifier._focus = true;
				setTimeout(function() {
					document.title = ".";
					document.title = Html.title;
				}, 1000);
			});
			$jq(window).bind("blur", function() {
				Notifier._focus = false;
			});
		},
		newhandle: function(e) {
			if (Notifier._me) { Notifier._me = false; return; }
			if (Notifier._focus) return;
			++Notifier._new;
			document.title = "("+Notifier._new+") "+ Html.title;
		},
	};
	
	var Settings = {
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
			if (v != null) return v == "true";
			return Settings.settings[n].def == "true";
		},
		settings: {
			"Enable quick reply": { def: "true", cat: "Quick reply" },
			"Hide quick reply after posting": { def: "true", cat: "Quick reply" },
			"Quote selected text on quick reply": { def: "false", cat: "Quick reply" },
			"Hide quick reply when top button clicked": { def: "false", cat: "Quick reply" },
			"Unique post content per image": { def: "false", cat: "Quick reply" },
			"Enable autoupdate": { def: "true", cat: "Autoupdate" },
			"Show autoupdate countdown dialog": { def: "true", cat: "Autoupdate" },
			"Show new post count in title": { def: "true", cat: "Autoupdate" },
			"Autoupdate watched threads list": { def: "false", cat: "Autoupdate" },
			"Expand images on hover": { def: "false", cat: "Posts" },
			"Enable inline replies": { def: "true", cat: "Posts" },
			"Enable backlinks": {def: "true", cat: "Posts" },
			"Enable hide post buttons": { def: "true", cat: "Posts" },
			"Enable cross-thread inline replies": { def: "true", cat: "Posts" },
			"Animate gif thumbnails": { def: "true", cat: "Posts" },
			"Add google image shortcut to posts": { def: "true", cat: "Posts" },
			"Add download image shortcut to posts": { def: "true", cat: "Posts" },
			"Enable filter": { def: "false", cat: "Other" },
			"Hide original post form": { def: "true", cat: "Other" },
			"Sync original post form and quick reply": { def: "false", cat: "Other" },
			"Scroll on new post": { def: "false", cat: "Other" },
			"Hide namefields": { def: "false", cat: "Other" },
			"Enable keybinds": { def: "true", cat: "Keybinds" },
			"Show/hide quick reply": { def: "true", cat: "Keybinds" },
			"Spoiler tags": { def: "true", cat: "Keybinds" },
			"Underline tags": { def: "true", cat: "Keybinds" },
			"Bold tags": { def: "true", cat: "Keybinds" },
			"Strikethrough tags": { def: "true", cat: "Keybinds" },
			"Italic tags": { def: "true", cat: "Keybinds" }
		}
	};
	
	var Filter = {
		nlist: "",
		tlist: "",
		plist: "",
		init: function() {
			Filter.load();
			Filter.addhandles();
		},
		addhandles: function() {
			$jq("table:not(.postform):not(.userdelete)").each(function() {
				Filter.newhandle($jq(this));
			});
		},
		load: function() {
			var n = Settings.get("x.filter.nlist");
			if (n != null && n != "undefined") {
				Filter.nlist = n;
				$jq('#pxoptions > div input[name="nlist"]').val(n);
			}
			var t = Settings.get("x.filter.tlist");
			if (t != null && t != "undefined") {
				Filter.tlist = t;
				$jq('#pxoptions > div input[name="tlist"]').val(t);
			}
			var p = Settings.get("x.filter.plist");
			if (p != null && p != "undefined") {
				Filter.plist = p;
				$jq('#pxoptions > div input[name="plist"]').val(p);
			}
		},
		save: function() {
			Filter.nlist = $jq('#pxoptions > div input[name="nlist"]').val();
			Settings.set("x.filter.nlist", Filter.nlist);
			Filter.tlist = $jq('#pxoptions > div input[name="tlist"]').val();
			Settings.set("x.filter.tlist", Filter.tlist);
			Filter.plist = $jq('#pxoptions > div input[name="plist"]').val();
			Settings.set("x.filter.plist", Filter.plist);
		},
		filter: function(p) {
			$jq(p).css("display", "none");
		},
		newhandle: function(p) {
			if (!Settings.gets("Enable filter") || $jq("span.mod, span.admin", p).length > 0) return;
			if (Filter.filtered(0, $jq.trim($jq("span.postername", p).text()))) {
				Filter.filter(p);
				return;
			}
			if (Filter.filtered(0, $jq.trim($jq("span.postername a", p).text()))) {
				Filter.filter(p);
				return;
			}
			if (Filter.filtered(1, $jq("span.postertrip", p).text())) {
				Filter.filter(p);
				return;
			}
			if (Filter.filtered(2, $jq("blockquote", p).html())) {
				Filter.filter(p);
				return;
			}
		},
		filtered: function(t, s) {
			if (s == "") return false;
			switch (t) {
				case 0:
					if (Filter.nlist.indexOf(s+";") > -1) return true;
				break;
				case 1:
					if (Filter.tlist.indexOf(s+";") > -1) return true;
				break;
				case 2:
					if (Filter.plist.length <= 1) return false;
					var sp = Filter.plist.split(";");
					if (sp.length-1 == 0) return false;
					for (var i = 0, len = sp.length -1; i < len; i++) {
						if (s.indexOf(sp[i]) > -1)
							return true;
					}
				break;
			}
			return false;
		}
	};
	
	Main.init();
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