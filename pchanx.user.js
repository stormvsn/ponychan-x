// ==UserScript==
// @namespace     milky
// @name          Ponychan X
// @description   Adds various bloat.
// @author        milky
// @include       http://www.ponychan.net/chan/*/res/*
// @version       0.4
// @icon          http://i.imgur.com/12a0D.jpg
// @updateURL     https://github.com/milkytiptoe/ponychan-x/raw/master/pchanx.user.js
// ==/UserScript==

function ponychanx() {
	$jq = jQuery.noConflict();
	var durl = document.URL.split("#")[0];
	var us = durl.split("/");
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
			if (Settings.gets("Enable filter")=="true") Filter.init();
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
			xhr.open("GET", durl+"?"+new Date().getTime());
			xhr.setRequestHeader("If-Modified-Since", Updater.last);
			xhr.setRequestHeader("Accept", "*/*");
			xhr.send();
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					Updater.last = xhr.getResponseHeader("Last-Modified");
					setTimeout(function() { Updater.get(); }, Updater.tmr);
					switch (xhr.status) {
						case 200:
							var f, l;
							if ($jq(".thread table").length == 0) {
								l = "";
								f = true;
							} else {
								l = $jq($jq("table:not(.postform):not(.userdelete) > tbody > tr > td[id] > a[name]").get().reverse())[0].name;
								f = false;
							}
							$jq("table:not(.postform):not(.userdelete)", xhr.responseText).each(function() {
								if (f) {
									$jq(".thread table:last").after(this);
									Posts.newhandle(this);
									Posts.fixhover(this);
									Posts.fixdate(this);
									Notifier.newhandle(this);
									Filter.newhandle(this);
								}
								if (!f && $jq("tbody tr td.reply[id] a[name]", this)[0].name == l)
									f = true;
							});
							if (!f) $jq(".qrtop span").html("Error updating. Try refreshing.");
						break;
						case 404:
							document.title = Html.title + "(404)";
						break;
					}
				}
			}
		}
	};
	
	var QR = {
		cooldown: 15,
		init: function() {
			if (Settings.gets("Quick reply key shortcuts")=="true") QR.keys();
			Html.hidepostform();
			if (Settings.get("x.show")=="true") QR.show();
		},
		quote: function(h) {
			QR.show();
			var v = $jq("#qr textarea").val();
			var qs = "";
			var s = window.getSelection().toString();
			if (s != "") { qs = ">"+s+"\n"; }
			$jq("#qr textarea").val(v + ">>" + h + "\n" + qs).focus();
			var vv = $jq("#qr textarea").val().length;
			document.getElementById("msg").setSelectionRange(vv,vv);
		},
		show: function() {
			Settings.set("x.show", "true");
			$jq("#qr").css("display", "block");
			if ($jq("#qr").length) return;
			var qr = document.createElement("div");
			qr.setAttribute("id", "qr");
			qr.innerHTML = '<div class="qrtop"><span></span></div><div class="close"><a href="javascript:;">X</a></div>\
			<input type="text" name="name" placeholder="Name" size="28" maxlength="75" accesskey="n">\
			<input type="text" name="em" placeholder="Email" size="28" maxlength="75" accesskey="e">\
			<input type="text" name="subject" placeholder="Subject" size="35" maxlength="75" accesskey="s">\
			<textarea name="message" id="msg" placeholder="Message" cols="48" rows="6" accesskey="m"></textarea>\
			<input type="file" id="imgfile" name="imagefile" size="35" multiple="" accept="image/*" accesskey="f">\
			<input type="button" value="Reply" accesskey="z">\
			<div class="postopts"><input type="checkbox" name="spoiler" /> Spoiler <label>Auto <input type="checkbox" name="auto" /></label></div>\
			<div id="imagelist"></div>';
			$jq("#qr .close a").live("click", function() { QR.hide(); });
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
			var sp = $jq("#qr .postopts :input[name='spoiler']").is(":checked");
			var pp = $jq("#postform :input[name='postpassword']").val();
			var fid = parseInt($jq("#thumbselected").attr("name"));
			var i = document.getElementById("imgfile").files[fid];
			var d = new FormData();
			d.append("board", bid);
			d.append("replythread", tid);
			d.append("quickreply", "");
			d.append("name", n);
			d.append("em", e);
			d.append("subject", s);
			d.append("postpassword", pp);
			if (sp) d.append("spoiler", sp);
			d.append("message", m);
			d.append("imagefile", i);
			var xhr = new XMLHttpRequest();
			xhr.upload.addEventListener("progress", function(evt) {
				if (evt.lengthComputable) {
					var percentComplete = Math.round(evt.loaded * 100 / evt.total);
					$jq("#qr > input[type='button']").val(percentComplete.toString() + '%');
				}
			}, false);
			xhr.open("POST", "http://www.ponychan.net/chan/board.php");  
			xhr.send(d);
			xhr.onreadystatechange = function() {
				if (xhr.readyState == 4) {
					if (xhr.status == 200) {
						if (xhr.responseText.indexOf("<title>Ponychan</title>") > -1) {
							$jq(".qrtop span").html(xhr.responseText.match(/.*<h2.*>([\s\S]*)<\/h2>.*/)[1]);
							$jq("#qr > input[type='button']").val("Retry");
						}
						else
							QR.clear(fid);
					} else {
						$jq(".qrtop span").html("An error occured while posting.");
						$jq("#qr > input[type='button']").val("Error");
					}
				}
			}
			QR.storefields();
		},
		cooldowntimer: function() {
			$jq("#qr > input[type='button']").attr("disabled", "disabled").val(QR.cooldown);
			if (QR.cooldown > 0) {
				setTimeout(function() { QR.cooldowntimer(); }, 1000);
				var a = $jq("#qr .postopts :input[name='auto']")[0].checked ? "Auto " : "";
				$jq("#qr > input[type='button']").val(a+QR.cooldown);
				QR.cooldown--;
			} else {
				$jq("#qr > input[type='button']").removeAttr("disabled").val("Reply");
				QR.cooldown = 15;
				if ($jq("#qr .postopts :input[name='auto']").is(":checked") && $jq(".listthumb").length > 0)
					QR.send();
			}
		},
		clear: function(fid) {
			$jq(".qrtop span").html("");
			$jq(".listthumb[name='"+fid+"']").remove();
			QR.thumbreset();
			$jq("#qr textarea").val("");
			$jq("#qr :input[name='subject']").val("");
			$jq("#qr .postopts :input[name='spoiler']")[0].checked = false;
			if (Settings.gets("Hide quick reply after posting")=="true" && $jq("#qr .postopts :input[name='auto']")[0].checked == false)
				QR.hide();
			QR.cooldowntimer();
		},
		thumbreset: function() {
			if ($jq("#thumbselected").length < 1) {
				if ($jq(".listthumb").length > 0) {
					$jq($jq(".listthumb")[0]).attr("id", "thumbselected")
					document.getElementById("imagelist").scrollTop = 0;
				} else {
					$jq("#qr").css("height", "230px");
					$jq("#imagelist, .postopts").css("display", "none");
					$jq("#qr input[type='file']").val("");
					$jq("#qr .postopts :input[name='auto']")[0].checked = false
				}
			}
		},
		thumb: function() {
			var f = document.getElementById("imgfile").files;
			if (f[0] == null) {
				$jq("#imagelist, .postopts").css("display", "none");
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
						url.revokeObjectURL(fU);
					}
				});
				$jq(thumb).attr("class", "listthumb");
				$jq(thumb).attr("name", i);
				$jq(thumb).attr("title", f[i].name + " (middle click to remove)");
				if ($jq("#thumbselected").length < 1) $jq(thumb).attr("id", "thumbselected");
				$jq(thumb).css("background-image", "url(" + fU + ")");
			}
			$jq("#imagelist, .postopts").fadeIn("fast");
			$jq("#qr").css("height", "327px");
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
		keys: function() {
			var isCtrl = false;
			$jq(document).keyup(function (e) {
				if(e.which == 17) isCtrl = false;
			}).keydown(function (e) {
				var t = null;
				if(e.which == 17) isCtrl = true;
				switch (e.which) {
					case 83: t = "?"; break;
					case 66: t = "b"; break;
					case 73: t = "i"; break;
					case 81: QR.show(); return false; break;
				}
				if (t != null && isCtrl) {
					e.preventDefault();
					var v = $jq("#qr textarea").val();
					$jq("#qr textarea").val(v + "["+t+"][/"+t+"]");
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
		addhide: function(hp) {
			var c = hp.closest("table");
			if ($jq(hp).html() == "[ - ]") {
				hp.html("[ + ]");
				$jq(".reply", c).addClass("hidden");
			} else {
				hp.html("[ - ]");
				$jq(".reply", c).removeClass("hidden");
			}
		},
		newhandle: function(p) {
			// Rewrite this entire block before 1.0
			// Less setting checks, less event changes, stricter selectors
			var ql = $jq($jq(".reflink a:odd", p)[0]);
			if (Settings.gets("Enable quick reply")=="true")
				ql.attr("href", "javascript:;").removeAttr("onclick").on("click", function() { QR.quote(this.innerHTML); return false; } );
			var toq = ql.html();
			var hp = $jq("<a>[ - ]</a>").attr("href","javascript:;").on("click", function() {
				Posts.addhide(hp);
			});
			$jq(".doubledash", p).css("display", "block").html("").append(hp);
			var eb = (Settings.gets("Enable backlinks") == "true");
			var ei = (Settings.gets("Enable inline replies") == "true");
			if (eb || ei) {
				$jq("blockquote a[class]", p).each(function() {
					var tto, to, from;
					if (this.className.substr(0, 4) == "ref|") {
						to = this.innerHTML.substr(8, this.innerHTML.length);
						from = $jq(this).parent().parent().find("a[name]").attr("name");
						try {
							// why does ponychan include post content inside quote anchor...
							tto = $jq("a[name='"+to+"']");
						} catch(e) { return true; }
						ffrom = $jq("a[name='"+from+"']");
					}
					if (!$jq(this).closest("td").hasClass("inline")) {
						if (tto != null) {
							if (eb)	{
								var bl = $jq("<a href='javascript:;' onclick='return clickReflinkNum(event, "+from+");' class='ref|"+bid+"|"+tid+"|"+from+"'>>>"+from+"</a> ")
								.on("mouseover", addreflinkpreview)
								.on("mouseout", delreflinkpreview);
								if (Settings.gets("Enable quick reply")=="true") {
									$jq(bl).attr("onclick","").unbind("click").removeAttr("onclick");
									bl.on("click", function() {
										QR.quote(this.innerHTML.substring(8,this.innerHTML.length));
										return false;
									});
								}
								$jq(tto.parent().find(".extrabtns")[0]).append(bl);								
							}
							if (ei) $jq(this).attr("onclick","").unbind("click").removeAttr("onclick");
						}
					}
					if (ei && tto != null) {
						$jq(this).on("click", function() {
							var n = $jq(this).next();
							if (n.hasClass("inline"))
								n.remove();
							else {
								var c = tto.parent().clone().addClass("inline").removeAttr("id").insertAfter(this);
								$jq(c).find("a[name]").remove();
								Posts.fixhover(c);
								Posts.newhandle(c);
							}
							return false;
						});
					}
				});
				$jq(".extrabtns > a[class]", p).each(function() {
					$jq(this).attr("onclick","").unbind("click").removeAttr("onclick");
					if (Settings.gets("Enable quick reply")=="true") {
						$jq(this).on("click", function() {
							QR.quote(this.innerHTML.substring(8,this.innerHTML.length));
							return false;
						});
					} else {
						$jq(this).on("click", function() {
							clickReflinkNum(event, this.innerHTML.substring(8,this.innerHTML.length));
							return false;
						});
					}
				});
			}
			if (Settings.gets("Enable quick reply")=="true") {
					$jq($jq(".postfooter > a", p)[0]).attr("onclick","").unbind("click").removeAttr("onclick");
					$jq(".postfooter > a", p)[0].onclick = function() { QR.quote(toq); return false; };
			} else {
					$jq(".postfooter > a", p)[0].onclick = function() { clickReflinkNum(event, toq); return false; };
			}
		},
		fixhover: function(p) {
			$jq("blockquote a[class], .extrabtns a[class]", p).each(function() {
				if (this.className.substr(0, 4) == "ref|") {
					this.addEventListener("mouseover", addreflinkpreview, false);
					this.addEventListener("mouseout", delreflinkpreview, false);
				}
			});
		},
		fixdate: function(p) {
			var timezone = getCookie('timezone');
			timezone = timezone === '' ? -8 : parseInt(timezone, 10);
			var twelvehour = true;
			var timeFormat = 'ddd, MMM d, yyyy ' + (twelvehour !== '0' ? 'h:mm tt' : 'H:mm');
			$jq(".posttime",p).html(Date.parse($jq(".posttime",p).text()).addHours(8 + timezone).toString(timeFormat)
				.replace(/([AP]M)$/, '<span style="font-size:0.75em">$1</span>'));
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
			$jq(".adminbar").prepend($jq('<a class="adminbaritem" href="javascript:;">Ponychan X</a>').bind("click", function() {
				$jq("#pxoptions").css("display") == "block" ? $jq("#pxoptions").css("display", "none") : $jq("#pxoptions").css("display", "block");
			}));
			var opt = $jq("<div id='pxoptions'><strong>Settings</strong><br /></div");
			for (s in Settings.settings) {
				opt.append("<input name='"+s+"' type='checkbox' "+(Settings.gets(s) == "true" ? "checked" : "")+" /> "+s+"<br />");
			}
			$jq('#pxoptions input[type="checkbox"]').live("click", function() { Settings.sets($jq(this).attr("name"), String($jq(this).is(":checked"))); });
			var s = Settings.get("x.updatetimer");
			if (s == null) s = "10";
			opt.append("Update every <input type='text' id='updatetimer' value='"+s+"'> seconds<br />");
			$jq("#updatetimer").live("change", function() { if (isNaN(parseInt($jq(this).val()))) return; Settings.set("x.updatetimer", $jq(this).val()); });
			if (Settings.gets("Enable filter")=="true") {
				opt.append("<br /><strong>Filter</strong><br />Seperate items with ;<br />");
				opt.append("Names<br /><input id='n' name='nlist' type='text' value='' style='width: 99%'>");
				opt.append("Tripcodes<br /><input id='t' name='tlist' type='text' value='' style='width: 99%'>");
				opt.append("Posts<br /><input id='p' name='plist' type='text' value='' style='width: 99%'><br />");
			}
			opt.append("<br /><a href='' style='text-decoration: underline;'>Apply changes</a> (refreshes the page)");
			opt.insertAfter(".adminbar");
			$jq('#pxoptions > input[id][name]').keyup(function() { Filter.save(); }).change(function() { Filter.save(); });
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
			s.innerHTML = "td.reply { margin-left: 25px; } .hidden { height: 10px; opacity: 0.1; } #updatetimer { width: 30px; }\
			#pxoptions { box-shadow: 3px 3px 8px #666; display: none; font-size: medium; padding: 10px; position: absolute; background-color: gray; top: 32px; right: 192px; border: 1px solid black; }\
			#qr * { margin: 0; padding: 0; }\
			.postopts { clear: both; display: none; font-size: small; margin-left: 2px !important; }\
			.postopts label { float: right; margin: 1px 2px 0 0 !important; }\
			#thumbselected { opacity: 1 !important; border: 1px solid black; }\
			.listthumb { opacity: 0.6; display: inline-block; margin-right: 2px !important; border: 1px solid darkgray; width: 71px; height: 71px; background-size: cover; }\
			#imagelist { height: 73px; overflow-y: scroll; margin: 2px; display: none; background-size: cover; }\
			#qr .close a { font-weight:bold; width: 16px; height: 19px; padding: 1px 0 0 5px; color: white; float: right; background-color: black; }\
			#qr .qrtop { float: left; width: 374px; font-size: small; color: white; padding-left: 5px; background-color: #123555; height: 20px; cursor: move; }\
			#qr input[type='button'] { width: 90px; height: 23px; float: right; }\
			#qr { padding: 2px; margin-right: 10px; margin-bottom: 10px; padding-top: 2px; padding-left: 2px; display: block; position: fixed; bottom: 0; right: 0; width: 400px; height:230px; background: #eee; border: 1px solid #000; }\
			#qr input[type='text'] { padding: 2px 0 2px 4px; height: 20px; width: 394px; border: 1px solid gray; margin: 1px 0; }\
			#qr textarea { width: 394px; padding: 2px 0 2px 4px; font-family: sans-serif; height: 98px; font-size: small; }\
			.extrabtns { vertical-align: top; }";
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
			"Enable filter": { def: "false" },
			"Enable inline replies": { def: "true" },
			"Quick reply key shortcuts": { def: "true" },
			"Hide quick reply after posting": { def: "true" },
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
				$jq('#pxoptions input[type="text"][name="nlist"]').val(n);
			}
			var t = Settings.get("x.filter.tlist");
			if (t != null && t != "undefined") {
				Filter.tlist = t;
				$jq('#pxoptions input[type="text"][name="tlist"]').val(t);
			}
			var p = Settings.get("x.filter.plist");
			if (p != null && p != "undefined") {
				Filter.plist = p;
				$jq('#pxoptions input[type="text"][name="plist"]').val(p);
			}
		},
		save: function() {
			Filter.nlist = $jq('#pxoptions input[name="nlist"]').val();
			Settings.set("x.filter.nlist", Filter.nlist);
			Filter.tlist = $jq('#pxoptions > input[name="tlist"]').val();
			Settings.set("x.filter.tlist", Filter.tlist);
			Filter.plist = $jq('#pxoptions > input[name="plist"]').val();
			Settings.set("x.filter.plist", Filter.plist);
		},
		filter: function(p) {
			$jq(p).css("display", "none");
		},
		newhandle: function(p) {
			if (Settings.gets("Enable filter") != "true") return;
			if (Filter.filtered(0, $jq.trim($jq("span.postername", p).text()))) {
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