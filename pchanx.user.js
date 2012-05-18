// ==UserScript==
// @namespace     milky
// @name          Ponychan X
// @description   Adds various bloat.
// @author        milky
// @include       http://www.ponychan.net/chan/*/res/*
// @version       0.1
// @icon          http://i.imgur.com/12a0D.jpg
// ==/UserScript==

function ponychanx()
{
	$jq = jQuery.noConflict();
	var us = document.URL.split("/");
	var bid = us[4];
	var tid = us[6].split(".html")[0];
	
	var Main = {
		init: function() {
			QR.init();
			Html.init();
			Css.init();
		},
	};
	
	var QR = {
		init: function() {
			QR.addhandles();
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
			qr.innerHTML = '<div class="qrtop"><a href="javascript:;">X</a></div>\
			<input type="text" name="name" placeholder="Name" size="28" maxlength="75" accesskey="n">\
			<input type="text" name="em" placeholder="Email" size="28" maxlength="75" accesskey="e">\
			<input type="text" name="subject" placeholder="Subject" size="35" maxlength="75" accesskey="s">\
			<textarea name="message" id="msg" placeholder="Message" cols="48" rows="6" accesskey="m"></textarea>\
			<input type="file" id="imgfile" name="imagefile" size="35" accesskey="f">\
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
			var i = document.getElementById("imgfile").files[0];
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
						QR.clear();
					} else {
						$jq("#qr > input[type='button']").val("Error");
					}
				}
			}
			QR.storefields();
		},
		clear: function() {
			$jq("#imagelist").html("").css("display", "none");
			$jq("#qr").css("height", "230px");
			$jq("#qr textarea").val("");
			$jq("#qr :input[name='subject']").val("");
			$jq("#qr :input[type='file']").val("");
			$jq("#qr > input[type='button']").val("Reply");
		},
		addhandles: function() {
			$jq(".reflink a:odd").each(function() {
				$jq(this).attr("href", "javascript:;").removeAttr("onclick");
				$jq(this).on("click", function() { QR.quote(this.innerHTML); return false; } );
			});
		},
		thumb: function() {
			var f = document.getElementById("imgfile").files[0];
			if (f == null) return;
			url = window.URL || window.webkitURL;
			fU = url.createObjectURL(f);
			document.getElementById("imagelist").style.backgroundImage = "url(" + fU + ")";
			$jq("#imagelist").fadeIn("fast");
			$jq("#qr").css("height", "316px");
		},
		loadfields: function() {
				var ln = Settings.get("x.name");
				var le = Settings.get("x.email");
			if (ln == null && le == null) {
				var n = $jq("#postform :input[name='name']").val();
				var e = $jq("#postform :input[name='em']").val();
				$jq("#qr :input[name='name']").val(n);
				$jq("#qr :input[name='em']").val(e);
			} else {
				$jq("#qr :input[name='name']").val(ln);
				$jq("#qr :input[name='em']").val(le);
			}
		},
		storefields: function() {
			Settings.set("x.name", $jq("#qr :input[name='name']").val());
			Settings.set("x.email", $jq("#qr :input[name='em']").val());
		}
	};
	
	var Html = {
		init: function() {
			$jq("#postform").css("display", "none");
			var a = document.createElement("a");
			a.innerHTML = "<h2>Quick Reply</h2>";
			a.href = "#";
			a.onclick = function() { QR.show(); };
			$jq(".postarea").prepend(a);
		}
	};
	
	var Css = {
		init: function() {
			var s = document.createElement('style');
			s.innerHTML = "#qr * { margin: 0; padding: 0; } #imagelist { display: none; border: 1px solid darkgray; margin: 2px 0 2px 1px; width: 80px; height: 80px; background-size: 80px 80px; } #qr .qrtop a { padding: 1px 4px 0 2px; color: white; float: right; } #qr .qrtop { background-color: darkgray; height: 20px; cursor: move; } #qr input[type='button'] { width: 90px; height: 23px; float: right; } #qr { padding: 2px; margin-right: 10px; margin-bottom: 10px; padding-top: 2px; padding-left: 2px; display: block; position: fixed; bottom: 0; right: 0; width: 400px; height:230px; background: #eee; border: 1px solid #000; } #qr input[type='text'] { padding: 2px 0 2px 4px; height: 20px; width: 394px; border: 1px solid gray; margin: 1px 0; } #qr textarea { width: 394px; padding: 2px 0 2px 4px; font-family: sans-serif; height: 98px; font-size: small; }";
			document.body.appendChild(s);
		}
	};
	
	var Settings = {
		set: function(n, v) {
			localStorage.setItem(n, v);
		},
		get: function(n) {
			return localStorage.getItem(n);
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