// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference types="webrtc" />
/* util.ts

	Purpose:

	Description:

	History:
		Tue Sep 30 09:02:06     2008, Created by tomyeh

Copyright (C) 2008 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 2.1 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
declare global {
	interface Screen {
		deviceXDPI: number;
		logicalXDPI: number;
	}
}
var _decs = {lt: '<', gt: '>', amp: '&', quot: '"'},
	_encs: Partial<Record<keyof typeof _decs, string>> = {};
for (var v in _decs)
	_encs[_decs[v] as string] = v;

function _pathname(url: string): string {
	var j = url.indexOf('//');
	if (j > 0) {
		j = url.indexOf('/', j + 2);
		if (j > 0) return url.substring(j);
	}
	return '';
}

function _frames(ary: Window[], w: Window): void {
	//Note: the access of frames is allowed for any window (even if it connects other website)
	ary.push(w);
	for (var fs = w.frames, j = 0, l = fs.length; j < l; ++j)
		_frames(ary, fs[j]);
}

// The following escape map implementation is referred from Underscore.js 1.8.3
// which is under MIT license
// List of HTML entities for escaping.
var escapeMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		'`': '&#x60;'
	},
	// Functions for escaping and unescaping strings to/from HTML interpolation.
	escaper = function (match: string): string {
		return escapeMap[match] as string;
	},
	// Regexes for identifying a key that needs to be escaped
	sourceAttr = '(?:"|\'|`)',
	source = '(?:&|<|>|"|\'|`)',
	testAttrRegexp = RegExp(sourceAttr),
	testRegexp = RegExp(source),
	replaceAttrRegexp = RegExp(sourceAttr, 'g'),
	replaceRegexp = RegExp(source, 'g');

function _encodeXMLAttr0(string: string): string {
	return testAttrRegexp.test(string) ? string.replace(replaceAttrRegexp, escaper) : string;
}
function _encodeXML0(string: string): string {
	return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
}

/**
 * @returns the onSize target of the given widget.
 * The following code is dirty since it checks _hflexsz (which is implementation)
 * FUTRE: consider to have zk.Widget.beforeSize to clean up _hflexsz and
 * this method considers only if _hflex is min
 * @internal
 */
function _onSizeTarget(wgt: zk.Widget): zk.Widget {
	var r1 = wgt, p1: zk.Widget | undefined = r1,
		j1 = -1;
	for (; p1 && p1._hflex == 'min'; p1 = p1.parent) {
		delete p1._hflexsz;
		r1 = p1;
		++j1;
		if (p1.ignoreFlexSize_('w')) //p1 will not affect its parent's flex size
			break;
	}

	var r2 = wgt, p2: zk.Widget | undefined = r2,
		j2 = -1;
	for (; p2 && p2._vflex == 'min'; p2 = p2.parent) {
		delete p2._vflexsz;
		r2 = p2;
		++j2;
		if (p2.ignoreFlexSize_('h')) //p2 will not affect its parent's flex size
			break;
	}
	return j1 > 0 || j2 > 0 ? j1 > j2 ? r1 : r2 : wgt;
}

export interface IsCharOptions {
	digit: boolean | number;
	upper: boolean | number;
	lower: boolean | number;
	whitespace: boolean | number;
	[char: string]: boolean | number | undefined;
}

export interface EncodeXmlOptions {
	pre?: boolean;
	multiline?: boolean;
	maxlength?: number;
}

export interface ProgressboxOptions {
	busy: boolean;
}

export interface GoOptions {
	target: string;
	overwrite: boolean;
}

export namespace utl_global {
	/** @class zUtl
	 * @import zk.Widget
	 * @import zk.xml.Utl
	 * The basic utilities.
	 * <p>For more utilities, refer to {@link Utl}.
	 */
	export class zUtl { //static methods
		//Character
		/**
		 * @returns whether the character is according to its opts.
		 * @param cc - the character
		 * @param opts - the options.
		 * <table border="1" cellspacing="0" width="100%">
		 * <caption> Allowed Options
		 * </caption>
		 * <tr>
		 * <th> Name
		 * </th><th> Allowed Values
		 * </th><th> Description
		 * </th></tr>
		 * <tr>
		 * <td> digit
		 * </td><td> true, false
		 * </td><td> Specifies the character is digit only.
		 * </td></tr>
		 * <tr>
		 * <td> upper
		 * </td><td> true, false
		 * </td><td> Specifies the character is upper case only.
		 * </td></tr>
		 * <tr>
		 * <td> lower
		 * </td><td> true, false
		 * </td><td> Specifies the character is lower case only.
		 * </td></tr>
		 * <tr>
		 * <td> whitespace
		 * </td><td> true, false
		 * </td><td> Specifies the character is whitespace only.
		 * </td></tr>
		 * <tr>
		 * <td> opts[cc]
		 * </td><td> true, false
		 * </td><td> Specifies the character is allowed only.
		 * </td></tr>
		 * </table>
		 */
		static isChar(cc: string, opts: Partial<IsCharOptions>): boolean {
			return !!((opts.digit && cc >= '0' && cc <= '9')
				|| (opts.upper && cc >= 'A' && cc <= 'Z')
				|| (opts.lower && cc >= 'a' && cc <= 'z')
				|| (opts.whitespace && (cc == ' ' || cc == '\t' || cc == '\n' || cc == '\r'))
				|| opts[cc]);
		}

		//HTML/XML
		/**
		 * Parses the specifie text into a map.
		 * For example
		 * ```ts
		 * zUtl.parseMap("a=b,c=d");
		 * zUtl.parseMap("a='b c',c=de", ',', "'\"");
		 * ```
		* @param text - the text to parse
		* @param separator - the separator. If omitted, `','`
		* is assumed
		* @param quote - the quote to handle. Ignored if omitted.
		* @returns the map
		*/
		static parseMap(text: string, separator?: string, quote?: string): Record<string, string> {
			var map = {};
			if (text) {
				var ps = text.split(separator || ',');
				if (quote) {
					var tmp: string[] = [],
						re = new RegExp(quote, 'g'),
						key = '', t, pair: RegExpMatchArray | null; // eslint-disable-line zk/noNull
					while ((t = ps.shift()) !== undefined) {
						if ((pair = (key += t).match(re)) && pair.length != 1) {
							if (key)
								tmp.push(key);
							key = '';
						} else
							key += separator;
					}
					ps = tmp;
				}
				for (var len = ps.length; len--;) {
					var key = ps[len].trim(),
						index = key.indexOf('=');
					if (index != -1)
						map[key.substring(0, index)] = key.substring(index + 1, key.length).trim();
				}
			}
			return map;
		}

		/**
		 * Encodes the string to a valid URL string.
		 * @param url - the url to encode
		 * @since 10.0.0
		 */
		static encodeURL(url: string): string {
			// eslint-disable-next-line @microsoft/sdl/no-insecure-url
			if (url.startsWith('https://') || url.startsWith('http://')) {
				return new URL(url).href;
			} else {
				const [baseUrl, queryString] = url.split('?');
				if (!queryString) {
					return baseUrl;
				}

				const encodedParams = queryString.split('&').map(param => {
					const [key, value] = param.split('=');
					return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
				}).join('&');

				return `${baseUrl}?${encodedParams}`;
			}
		}

		/**
		 * Encodes the string to a valid XML attribute string.
		 * Refer to {@link Utl} for more XML utilities.
		 * @param txt - the text to encode
		 * @returns the encoded text.
		 * @since 8.0.0
		 */
		static encodeXMLAttribute(txt: string): string {
			txt = txt != null ? String(txt) : '';
			return _encodeXMLAttr0(txt);
		}
		/**
		 * Encodes the string to a valid XML string.
		 * Refer to {@link Utl} for more XML utilities.
		 * @param txt - the text to encode
		 * @param opts - the options. Allowd value:
		 * <ul>
		 * <li>pre - whether to replace whitespace with `&nbsp;`</li>
		 * <li>multiline - whether to replace linefeed with `<br>`</li>
		 * <li>maxlength - the maximal allowed length of the text</li>
		 * </ul>
		 * @returns the encoded text.
		 */
		// eslint-disable-next-line zk/noNull
		static encodeXML(txt: string | null, opts?: EncodeXmlOptions): string {
			txt = txt != null ? String(txt) : '';

			if (!opts) // speed up the replacement.
				return _encodeXML0(txt);

			var tl = txt.length,
				pre = opts && opts.pre,
				multiline = pre || (opts && opts.multiline),
				maxlength = opts ? opts.maxlength : 0;

			if (!multiline && maxlength && tl > maxlength) {
				var j = maxlength;
				while (j > 0 && txt.charAt(j - 1) == ' ')
					--j;
				opts.maxlength = 0; //no limit
				return zUtl.encodeXML(txt.substring(0, j) + '...', opts);
			}

			var out = '', k = 0, enc;
			if (multiline || pre) {
				for (let j = 0; j < tl; ++j) {
					var cc = txt.charAt(j);
					if (enc = _encs[cc] as undefined | string) {
						out += txt.substring(k, j) + '&' + enc + ';';
						k = j + 1;
					} else if (multiline && cc == '\n') {
						/*safe*/ out += /*safe*/ txt.substring(k, j) + '<br/>\n';
						k = j + 1;
					} else if (pre && (cc == ' ' || cc == '\t')) {
						out += txt.substring(k, j) + '&nbsp;';
						if (cc == '\t')
							out += '&nbsp;&nbsp;&nbsp;';
						k = j + 1;
					}
				}
			} else {
				// fixed B65-ZK-1836 that opt may be an empty object.
				return _encodeXML0(txt);
			}

			if (!k) return txt;
			if (k < tl)
				out += txt.substring(k);
			return out;
		}
		/**
		 * Decodes the XML string into a normal string.
		 * For example, `&lt;` is convert to `<`
		 * @param txt - the text to decode
		 * @returns the decoded string
		 */
		static decodeXML(txt: string): string {
			var out = '';
			if (!txt) return out;

			var k = 0, tl = txt.length;
			for (var j = 0; j < tl; ++j) {
				var cc = txt.charAt(j);
				if (cc == '&') {
					var l = txt.indexOf(';', j + 1);
					if (l >= 0) {
						var dec = txt.charAt(j + 1) == '#' ?
							String.fromCharCode(txt.charAt(j + 2).toLowerCase() == 'x' ?
								parseInt(txt.substring(j + 3, l), 16) :
								parseInt(txt.substring(j + 2, l), 10)) :
							_decs[txt.substring(j + 1, l)] as never;
						if (dec) {
							out += txt.substring(k, j) + dec;
							k = (j = l) + 1;
						}
					}
				}
			}
			return !k ? txt :
				k < tl ? out + txt.substring(k) : out;
		}

		/**
		 * A shortcut of `' cellpadding="0" cellspacing="0" border="0"'`.
		 */
		static cellps0 = ' cellpadding="0" cellspacing="0" border="0"';
		/**
		 * A shortcut of `'<img style="height:0;width:0"/>'`.
		 */
		static img0 = '<img style="height:0;width:0" aria-hidden="true"/>';
		/**
		 * A shortcut of `'<i style="height:0;width:0"/>'`.
		 */
		static i0 = '<i style="height:0;width:0"></i>';
		/**
		 * @returns today.
		 * @param full - if true, returns the full time, else only returns year, month, and day.
		 * If omitted, false is assumed
		 */
		static today(full: boolean, tz?: string): DateImpl
		/**
		 * @returns today.
		 * @param fmt - the time format, such as HH:mm:ss.SSS
		 * If a time element such as seconds not specified in the format, it will
		 * be considered as 0. For example, if the format is "HH:mm", then
		 * the returned object will be today, this hour and this minute, but
		 * the second and milliseconds will be zero.
		 * @since 5.0.6
		 */
		static today(fmt: string, tz?: string): DateImpl
		static today(fmt: boolean | string, tz?: string): DateImpl {
			var d = window.Dates.newInstance().tz(tz), hr = 0, min = 0, sec = 0, msec = 0;
			if (typeof fmt == 'string') {
				var fmt0 = fmt.toLowerCase();
				if (fmt0.includes('h') || fmt0.includes('k')) hr = d.getHours();
				if (fmt.includes('m')) min = d.getMinutes();
				if (fmt.includes('s')) sec = d.getSeconds();
				if (fmt.includes('S')) msec = d.getMilliseconds();
			} else if (fmt)
				return d;
			return window.Dates.newInstance([d.getFullYear(), d.getMonth(), d.getDate(),
				hr, min, sec, msec], tz);
		}
		/**
		 * @returns if one is ancestor of the other.
		 * It assumes the object has either a method called `getParent`
		 * or a field called `parent`.
		 * A typical example is used to test the widgets ({@link Widget}).
		 *
		 * <p>Notice that, if you want to test DOM elements, please use
		 * {@link jq.isAncestor} instead.
		 *
		 * @param p - the parent. This method return true if p is null or p is the same as c
		 * @param c - the child
		 * @see {@link jq.isAncestor}
		 */
		static isAncestor(p?: zk.Object, c?: zk.Object & {getParent?(): zk.Widget}): boolean
		static isAncestor(p?: zk.Widget, c?: zk.Widget & {getParent?(): zk.Widget}): boolean {
			if (!p) return true;
			for (; c; c = c.getParent ? c.getParent() : c.parent)
				if (p == c)
					return true;
			return false;
		}

		//progress//
		/**
		 * Creates a message box to indicate something is being processed
		 * @param id - the ID of the DOM element being created
		 * @param msg - the message to shown
		 * @param mask - whether to show sem-transparent mask to prevent
		 * the user from accessing it.
		 * @param icon - the CSS class used to shown an icon in the box.
		 * Ignored if not specified.
		 * @see {@link destroyProgressbox}
		 */
		static progressbox(id: string, msg: string, mask?: boolean, icon?: string, opts?: Partial<ProgressboxOptions>): void {
			if (mask && zk.Page.contained.length) {
				for (var c = zk.Page.contained.length, e = zk.Page.contained[--c]; e; e = zk.Page.contained[--c]) {
					if (!e._applyMask)
						e._applyMask = new zk.eff.Mask({
							id: e.uuid + '-mask',
							message: msg,
							anchor: e.$n()
						});
				}
				return;
			}

			if (opts?.busy) {
				zk.busy++;
				jq.focusOut(); //Bug 2912533
			}

			var x = jq.innerX(), y = jq.innerY(),
				style = ' style="left:' + x + 'px;top:' + y + 'px"',
				idtxt = id + '-t',
				idmsk = id + '-m',
				html = '<div id="' + /*safe*/ id + '" role="alert"';
			if (mask)
				html += '><div id="' + /*safe*/ idmsk + '" class="z-modal-mask"' + /*safe*/ style + '></div';
			html += '><div id="' + /*safe*/ idtxt + '" class="z-loading"' + /*safe*/ style
				+ '><div class="z-loading-indicator"><span class="z-loading-icon"></span> '
				+ DOMPurify.sanitize(msg) + '</div></div>';
			if (icon)
				html += '<div class="' + /*safe*/ icon + '"></div>';
			jq(document.body).append(/*safe*/ html + '</div>');

			var $n = jq(id, zk),
				n: HTMLElement & {z_mask?} = $n[0],
				$txt = jq(idtxt, zk),
				txt = $txt[0],
				st = txt.style;
			if (mask) {
				// old IE will get the auto value by default.
				var zIndex: string | number = $txt.css('z-index');
				if (zIndex == 'auto')
					zIndex = 1;
				n.z_mask = new zk.eff.FullMask({
					mask: jq(idmsk, zk)[0],
					zIndex: (zIndex as number) - 1
				});
				jq('html').on('keydown', zk.$void);
			}

			if (mask && $txt.length) { //center
				st.left = jq.px((jq.innerWidth() - txt.offsetWidth) / 2 + x);
				st.top = jq.px((jq.innerHeight() - txt.offsetHeight) / 2 + y);
			} else {
				var pos = zk.progPos;
				if (pos) {
					var left: number,
						top: number,
						width = jq.innerWidth(),
						height = jq.innerHeight(),
						wdgap = width - zk(txt).offsetWidth(),
						hghgap = height - zk(txt).offsetHeight();

					if (pos.includes('mouse')) {
						var offset = zk.currentPointer;
						left = offset[0] + 10;
						top = offset[1] + 10;
					} else {
						if (pos.includes('left')) left = x;
						else if (pos.includes('right'))	left = x + wdgap - 1;
						else if (pos.includes('center')) left = x + wdgap / 2;
						else left = 0;

						if (pos.includes('top')) top = y;
						else if (pos.includes('bottom')) top = y + hghgap - 1;
						else if (pos.includes('center')) top = y + hghgap / 2;
						else top = 0;

						left = left < x ? x : left;
						top = top < y ? y : top;
					}
					st.left = jq.px(left);
					st.top = jq.px(top);
				}
			}

			$n.zk.cleanVisibility();
		}
		/**
		 * Removes the message box created by {@link progressbox}.
		 * @param id - the ID of the DOM element of the message box
		 */
		static destroyProgressbox(id: string, opts?: Partial<ProgressboxOptions>): void {
			if (opts?.busy && --zk.busy < 0)
				zk.busy = 0;
			var $n = jq(id, zk), n: HTMLElement & {z_mask?: zk.eff.Effect} | zk.eff.Effect;
			if ($n.length) {
				if (n = ($n[0] as {z_mask?: zk.eff.Effect}).z_mask as never) {
					(n as zk.eff.Effect).destroy();
				}
				$n.remove();
				jq('html').off('keydown', zk.$void);
			}

			for (var c = zk.Page.contained.length, e = zk.Page.contained[--c]; e; e = zk.Page.contained[--c])
				if (e._applyMask) {
					e._applyMask.destroy();
					e._applyMask = undefined;
				}
		}

		//HTTP//
		/**
		 * Navigates to the specified URL.
		 * @param url - the URL to go to
		 * @param opts - the options. Allowed values:
		 * <ul>
		 * <li>target - the name of the target browser window. The same browswer
		 * window is assumed if omitted. You can use any value allowed in
		 * the target attribute of the HTML FORM tag, such as _self, _blank,
		 * _parent and _top.</li>
		 * <li>overwrite - whether load a new page in the current browser window.
		 * If true, the new page replaces the previous page's position in the history list.</li>
		 * </ul>
		 */
		static go(url: string, opts?: Partial<GoOptions>): void {
			opts = opts || {};
			if (opts.target) {
				open(url, opts.target);
			} else if (opts.overwrite) {
				location.replace(url ? url : location.href);
			} else {
				if (url) {
					location.href = zUtl.encodeURL(url);

					var j = url.indexOf('#');
					//bug 3363687, only if '#" exist, has to reload()
					if (j < 0)
						return;

					var	un = j >= 0 ? url.substring(0, j) : url,
						pn = _pathname(location.href);

					j = pn.indexOf('#');
					if (j >= 0) pn = pn.substring(0, j);
					if (pn != un)
						return;
					//fall thru (bug 2882149)
				}
				location.reload();
			}
		}

		/**
		 * @returns all descendant frames of the given window.
		 * <p>To retrieve all, invoke `zUtl.frames(top)`.
		 * Notice: w is included in the returned array.
		 * If you want to exclude it, invoke `zUtl.frames(w).$remove(w)`.
		 * @param w - the browser window
		 * @since 5.0.4
		 */
		static frames(w: Window): Window[] {
			var ary: Window[] = [];
			_frames(ary, w);
			return ary;
		}

		/**
		 * Converts an integer array to a string.
		 * @param ary - the integer array to convert.
		 * If null, an empty string is returned.
		 * @see {@link stringToInts}
		 * @deprecated Use `[].join()` instead.
		 */
		static intsToString(ary: number[] | undefined): string {
			if (!ary) return '';
			return ary.join();
		}
		/**
		 * Converts a string separated by comma to an array of integers.
		 * @see {@link intsToString}
		 * @param text - the string to convert.
		 * If null, null is returned.
		 * @param defaultValue - the default value used if the value
		 * is not specified. For example, zUtl.stringToInts("1,,3", 2) returns [1, 2, 3].
		 */
		static stringToInts(text: string | undefined, defaultValue: number): number[] | undefined {
			if (text == null)
				return undefined;

			var list: number[] = [];
			for (var j = 0; ;) {
				var k = text.indexOf(',', j),
					s = (k >= 0 ? text.substring(j, k) : text.substring(j)).trim();
				if (s.length == 0) {
					if (k < 0) break;
					list.push(defaultValue);
				} else
					list.push(zk.parseInt(s));

				if (k < 0) break;
				j = k + 1;
			}
			return list;
		}
		/**
		 * Converts a map to a string
		 * @see {@link intsToString}
		 * @param map - the map to convert
		 * @param assign - the symbol for assignment. If omitted, '=' is assumed.
		 * @param separator - the symbol for separator. If omitted, ',' is assumed.
		 */
		static mapToString(map: Record<string, string>, assign?: string, separator?: string): string {
			assign = assign || '=';
			separator = separator || ' ';
			var output: string[] = [];
			for (var v in map)
				output.push(separator, v, assign, map[v]);
			output[0] = '';
			return output.join('');
		}
		/**
		 * Appends an attribute.
		 * Notice that the attribute won't be appended if val is empty or false.
		 * In other words, it is equivalent to<br/>
		 * `val ? ' ' + nm + '="' + val + '"': ""`.
		 * <p>If you want to generate the attribute no matter what val is, use
		 * {@link (appendAttr:ARGS_3)}.
		 * @param nm - the name of the attribute
		 * @param val - the value of the attribute
		 * @since 5.0.3
		 *
		 * {@label ARGS_2}
		 */
		static appendAttr(nm: string, val: unknown): string
		/**
		 * Appends an attribute.
		 * Notice that the attribute won't be appended.
		 * @param nm - the name of the attribute
		 * @param val - the value of the attribute
		 * @param force - whether to append attribute no matter what value it is.
		 * If false (or omitted), it is the same as {@link (appendAttr:ARGS_2)}.
		 * @since 5.0.3
		 *
		 * {@label ARGS_3}
		 */
		static appendAttr(nm: string, val: unknown, force: boolean): string
		static appendAttr(nm: string, val: unknown, force?: boolean): string {
			return val || force ? ' ' + nm + '="' + val + '"' : '';
		}
		/**
		 * Fires beforeSize, onFitSize, onSize and afterSize
		 * @param wgt - the widget which the zWatch event will be fired against.
		 * @param bfsz - the beforeSize mode:
		 * <ul>
		 * <li>0 (null/undefined/false): beforeSize sent normally.</li>
		 * <li>-1: beforeSize won't be sent.</li>
		 * <li>1: beforeSize will be sent with an additional cleanup option,
		 * which will clean up the cached minimal size (if flex=min).</li>
		 * </ul>
		 * @since 5.0.8
		 */
		static fireSized(wgt: zk.Widget, bfsz?: number): void {
			// ignore delayed rerendering case, like Bug ZK-2281
			if (wgt.desktop) {
				if (zk.clientinfo) { // Fix ZK-5017, not to use setTimeout here
					zk.afterAuResponse(() => this.fireSized(wgt, bfsz));
					return;
				} else if (zUtl.isImageLoading()) {
					setTimeout(() => {
						return this.fireSized(wgt, bfsz);
					}, 20);
					return;
				}
				wgt = _onSizeTarget(wgt);
				if (!(bfsz && bfsz < 0)) { //don't use >= (because bfsz might be undefined)
					zWatch.fireDown('_beforeSizeForRead', wgt);
					zWatch.fireDown('beforeSize', wgt, undefined, bfsz && bfsz > 0);
				}
				zWatch.fireDown('onFitSize', wgt, {reverse: true});
				zWatch.fireDown('onSize', wgt);
				zWatch.fireDown('afterSize', wgt);
			}
		}
		/**
		 * Fires beforeSize, onShow, onFitSize, onSize and afterSize
		 * @param wgt - the widget which the zWatch event will be fired against.
		 * @param bfsz - the beforeSize mode:
		 * <ul>
		 * <li>0 (null/undefined/false): beforeSize sent normally.</li>
		 * <li>-1: beforeSize won't be sent.</li>
		 * <li>1: beforeSize will be sent with an additional cleanup option,
		 * which will clean up the cached minimal size (if flex=min).</li>
		 * </ul>
		 * @since 5.0.8
		 */
		static fireShown(wgt: zk.Widget, bfsz?: number): void {
			zWatch.fireDown('onShow', wgt);
			zUtl.fireSized(wgt, bfsz);
		}
		/**
		 * Loads an image before ZK client engine to calculate the widget's layout.
		 * @param url - the loading image's localation
		 * @since 6.0.0
		 */
		static loadImage(url: string): void {
			if (!_imgMap[url]) {
				_imgMap[url] = true;
				_loadImage(url);
			}
		}
		/**
		 * Checks whether all the loading images are finish.
		 * @see {@link loadImage}
		 * @since 6.0.0
		 */
		static isImageLoading(): boolean {
			for (var _n in _imgMap)
				return true;
			return false;
		}
		/**
		 * Get week numbers of year for a specific date
		 * @since 8.5.1
		 */
		static getWeekOfYear(year: number, month: number, date: number, firstDayOfWeek: number,
					minimalDaysInFirstWeek: number): number {
			var d = window.Dates.newInstance([year, month, date, 0, 0, 0, 0], 'UTC'),
				day = d.getDay();
			d.setDate(date - minimalDaysInFirstWeek + firstDayOfWeek - (firstDayOfWeek > day ? day : day - 7));
			var yearStart = window.Dates.newInstance([d.getFullYear(), 0, 1], 'UTC');
			return Math.ceil(((d.valueOf() - yearStart.valueOf()) / 86400000 + 1) / 7);
		}
		/**
		 * Converts the dataURL to Blob object.
		 * This function is not supported in IE9 and below.
		 */
		static convertDataURLtoBlob(dataURL: string): Blob {
			var byteString = window.atob(dataURL.split(',')[1]),
				mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0],
				len = byteString.length,
				arrayBuffer = new ArrayBuffer(len),
				uint8Array = new Uint8Array(arrayBuffer);

			for (var i = 0; i < len; i++) {
				uint8Array[i] = byteString.charCodeAt(i);
			}

			return new Blob([arrayBuffer], {type: mimeString});
		}
		/**
		 * @returns the ratio of the resolution in physical pixels to the resolution in CSS pixels for the current display device.
		 * For more information, please visit https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
		 * @since 8.6.0
		 */
		static getDevicePixelRatio(): number {
			return window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI;
		}
		/**
		 * @returns the Promise whose fulfillment handler receives a MediaStream object when the requested media has successfully been obtained.
		 * Note: this function may returns a Promise that is rejected, if this browser not support getUserMedia.
		 * For more information, please visit https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
		 *
		 * @param constraints - a constraints object specifying the types of media to request
		 * @since 8.6.1
		 */
		static getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
			var polyfillGUM = function (constraints: MediaStreamConstraints, success?, error?): Promise<MediaStream> {
				var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
					navigator.mozGetUserMedia || navigator.msGetUserMedia;
				if (!getUserMedia)
					return Promise.reject(new Error('Cannot polyfill getUserMedia'));
				return new Promise(function (success, error) {
					getUserMedia.call(navigator, constraints, success, error);
				});
			};

			// @ts-expect-error: assign to read only property(mediaDevices) for polyfill
			if (navigator.mediaDevices === undefined) navigator.mediaDevices = {};
			if (navigator.mediaDevices.getUserMedia === undefined) navigator.mediaDevices.getUserMedia = polyfillGUM;
			return navigator.mediaDevices.getUserMedia(constraints);
		}
		/**
		 * Creates and returns a new, throttled version of the passed function, that,
		 * when invoked repeatedly, will only actually call the original function at most once per every wait milliseconds.
		 * Useful for rate-limiting events that occur faster than you can keep up with.
		 *
		 * Copied from underscore.js, MIT license.
		 *
		 * @param func - the passed function
		 * @param wait - wait milliseconds
		 * @returns a new, throttled version of the passed function
		 * @since 9.6.0
		 */
		static throttle<T, A extends unknown[], R>(func: (this: T, ...args: A) => R, wait: number):
					(this: T, ...args: A) => R {
			var timeout: number | undefined, context, args, result,
				previous = 0,
				later = function (): void {
					previous = Date.now();
					timeout = undefined;
					result = func.call(context as T, ...args as A);
					if (!timeout) context = args = undefined;
				};

			return function (): R {
				var now = Date.now(),
					remaining = wait - (now - previous);
				context = this;
				args = arguments;
				if (remaining <= 0 || remaining > wait) {
					if (timeout) {
						clearTimeout(timeout);
						timeout = undefined;
					}
					previous = now;
					result = func.call(context as T, ...args as A);
					if (!timeout) context = args = undefined;
				} else if (!timeout) {
					timeout = window.setTimeout(later, remaining);
				}
				return result as R;
			};
		}
		/**
		 * Creates and returns a new debounced version of the passed function
		 * which will postpone its execution until after wait milliseconds have elapsed since the last time it was invoked.
		 * Useful for implementing behavior that should only happen after the input has stopped arriving.
		 *
		 * Copied from debounce, MIT license.
		 *
		 * @param func - the passed function
		 * @param wait - wait milliseconds
		 * @param immediate - trigger the function on the leading instead of the trailing edge of the wait interval
		 * @returns a new debounced version of the passed function
		 * @since 9.6.0
		 */
		static debounce<T, A extends unknown[], R>(func: (this: T, ...args: A) => R, wait: number,
										immediate?: boolean): (this: T, ...args: A) => R {
			var timeout, args, context, timestamp, result;
			if (null == wait) wait = 100;

			function later (): void {
				var last = Date.now() - timestamp;

				if (last < wait && last >= 0) {
					timeout = setTimeout(later, wait - last);
				} else {
					timeout = undefined;
					if (!immediate) {
						result = func.call(context as T, ...args as A);
						context = args = undefined;
					}
				}
			}

			var debounced = function (this): R {
				context = this as T;
				args = arguments;
				timestamp = Date.now();
				var callNow = immediate && !timeout;
				if (!timeout) timeout = setTimeout(later, wait);
				if (callNow) {
					result = func.call(context as T, ...args as A);
					context = args = undefined;
				}
				return result as R;
			};

			return debounced;
		}
		/**
		 * Check if the two objects has the same value
		 * ref: undersore isEqual
		 * @param a - object
		 * @param b - object
		 * @returns the two object is the same or not
		 * @since 10.0.0
		 */
		static isEqualObject(a: unknown, b: unknown): boolean {
			// Identical objects are equal. `0 === -0`, but they aren't identical.
			// See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
			if (a === b) return a !== 0 || 1 / (a as number) === 1 / (b as number);
			// `null` or `undefined` only equal to itself (strict comparison).
			if (a == null || b == null) return false;
			// `NaN`s are equivalent, but non-reflexive.
			if (a !== a) return b !== b;
			// Exhaust primitive checks
			const typeA = typeof a,
				typeB = typeof b;
			if (typeA !== 'function' && typeA !== 'object' && typeB != 'object') return false;

			if (typeA == 'function' && typeB == 'function') return true; //ignore functions

			const keys = Object.keys(a as Record<string, unknown>);
			if (Object.keys(b as Record<string, unknown>).length !== keys.length) {
				return false;
			}
			for (const key of keys) {
				if (!Object.prototype.propertyIsEnumerable.call(b, key) ||
					!zUtl.isEqualObject((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
					return false;
				}
			}
			return true;
		}
	}
}

var _imgMap = {};
function _loadImage(url: string): void {
	var img = new Image(),
		f = function (): void {
			delete _imgMap[url];
		};
	img.onerror = img.onload = f;
	img.src = url;
}
zk.copy(window, utl_global);