/* Bandbox.js

	Purpose:

	Description:

	History:
		Tue Mar 31 14:17:28     2009, Created by tomyeh

Copyright (C) 2009 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 2.1 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
/**
 * A band box. A bank box consists of an input box ({@link Textbox} and
 * a popup window {@link Bandpopup}.
 * It is similar to {@link Combobox} except the popup window could have
 * any kind of children. For example, you could place a textbox in
 * the popup to let user search particular items.
 *
 * <p>Default {@link #getZclass}: z-bandbox.
 */
zul.inp.Bandbox = zk.$extends(zul.inp.ComboWidget, {
	_iconSclass: 'z-icon-search',
	//super
	getPopupSize_: function (pp) {
		var bp = this.firstChild, //bandpopup
			w, h;
		if (bp) {
			w = bp._hflex == 'min' && bp._hflexsz ? jq.px0(bp._hflexsz + zk(pp).padBorderWidth()) : bp.getWidth();
			h = bp._vflex == 'min' && bp._vflexsz ? jq.px0(bp._vflexsz + zk(pp).padBorderHeight()) : bp.getHeight();
		}
		return [w || 'auto', h || 'auto'];
	},
	getCaveNode: function () {
		return this.$n('pp') || this.$n();
	},
	redrawpp_: function (out) {
		var fc = this.firstChild;
		out.push('<div id="', this.uuid, '-pp" class="', this.$s('popup'),
		// tabindex=0 to prevent a11y scrollable popup issue, see https://dequeuniversity.com/rules/axe/3.5/scrollable-region-focusable?application=AxeChrome
		'" style="display:none" role="dialog" aria-labelledby="' + (fc ? fc.uuid : '') + '" tabindex="0">');

		for (var w = fc; w; w = w.nextSibling)
			w.redraw(out);

		out.push('</div>');
	},
	open: function (opts) {
		if (!this.firstChild) {
			// ignore when <bandpopup> is absent, but event is still fired
			if (opts && opts.sendOnOpen)
				this.fire('onOpen', {open: true, value: this.getInputNode().value}, {rtags: {onOpen: 1}});
			return;
		}
		this.$supers('open', arguments);
	},
	presize_: function () {
		var bp = this.firstChild;
		if (bp && (bp._hflex == 'min' || bp._vflex == 'min')) {
			zWatch.fireDown('onFitSize', bp, {reverse: true});
			return true;
		}
	},
	enterPressed_: function (evt) {
		//bug 3280506: do not close when children press enter.
		if (evt.domTarget == this.getInputNode())
			this.$supers('enterPressed_', arguments);
	},
	doKeyUp_: function (evt) {
		//bug 3287082: do not fire onChanging when children typing.
		if (evt.domTarget == this.getInputNode())
			this.$supers('doKeyUp_', arguments);
	},
	_fixsz: function (ppofs) {
		this.$supers('_fixsz', arguments);
		var pp = this.getPopupNode_(),
			zkpp = zk(pp),
			ppfc = pp.firstChild;
		if (ppofs[0].endsWith('%') || this.getPopupWidth()) {
			ppfc.style.width = '100%';
		} else if (ppofs[0] != 'auto') {
			pp.style.width = zkpp.revisedWidth(ppfc.offsetWidth + zkpp.padBorderWidth()) + 'px';
		}
	},
	doFocus_: function (evt) {
		var target = evt.domTarget;
		if (!(target != this.getInputNode() && target != this.$n('btn'))) this.$supers('doFocus_', arguments);
	}
});
