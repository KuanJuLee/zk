/* Upload.ts

	Purpose:

	Description:

	History:
		Fri Jul 17 16:44:50     2009, Created by tomyeh

Copyright (C) 2009 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 2.1 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
(function () {

	function _cancel(o, sid, finish) {
		var key = o.getKey(sid),
			uplder = o.uploaders[key];
		if (uplder)
			uplder.destroy(finish);
		delete o.uploaders[key];
	}
	function _initUploader(o, form, val) {
		var key = o.getKey(o.sid),
			uplder = new zul.Uploader(o, key, form, val);
		if (zul.Upload.start(uplder))
			o.uploaders[key] = uplder;
	}
	function _start(o, form, val) { //start upload
		// delete old upload temp file, if it's not uploaded yet.
		let oldKey = o.getKey(o.sid - 1),
			oldUploader = o.uploaders[oldKey];

		if (oldUploader && oldUploader.isStart && !zk.processing) {
			// delete the old file
			_cancel(o, o.sid - 1, false);
		}


		//B50-ZK-255: FileUploadBase$SizeLimitExceededException
		//will not warning in browser
		_initUploader(o, form, val);
		o.sid++;
		o.initContent();
	}
	function _onchange(evt) {
		var n = this,
			upload = n._ctrl,
			form = n.form,
			// we don't use jq().remove() in this case, because we have to use its reference.
			p = form.parentNode;
		p.parentNode.removeChild(p);
		upload._formDetached = true;
		var fileName = !n.files || n.files.length == 1 ? n.value : (function (files) {
			var fns = [];
			for (var len = files.length; len--;)
				fns.unshift(files[len].name);
			return fns.join(',');
		})(n.files);
		_start(n._ctrl, form, fileName);
	}

	if (zk.opera) { //opera only
		var _syncQue = [], _syncId,
			_syncNow = function () {
				for (var j = _syncQue.length; j--;)
					_syncQue[j].sync();
			},
			_addSyncQue = function (upld) {
				if (!_syncQue.length)
					_syncId = setInterval(_syncNow, 1500);
				_syncQue.push(upld);
			},
			_rmSyncQue = function (upld) {
				_syncQue.$remove(upld);
				if (_syncId && !_syncQue.length) {
					clearInterval(_syncId);
					_syncId = null;
				}
			};
	}

/** Helper class for implementing the fileupload.
 */
zul.Upload = zk.$extends(zk.Object, {
	sid: 0,
	/** Constructor
	 * @param zk.Widget wgt the widget belongs to the file upload
	 * @param DOMElement parent the element representing where the upload element
	 * 		is appended
	 * @param String option the upload option.
	 *      It contains upload options like maxsize, multiple, and so on.
	 *      It specifies the widget class name of the fileupload.
	 */
	$init: function (wgt, parent, option) {
		this.uploaders = {};
		this.suppressedErrors = [];

		var cls;

		for (var attrs = option.split(','), i = 0, len = attrs.length; i < len; i++) {
			var attr = attrs[i].trim();
			if (attr.startsWith('maxsize='))
				this.maxsize = attr.match(new RegExp(/maxsize=([^,]*)/))[1];
			else if (attr.startsWith('multiple='))
				this.multiple = attr.match(new RegExp(/multiple=([^,]*)/))[1];
			else if (attr.startsWith('accept='))
				this.accept = attr.match(new RegExp(/accept=([^,]*)/))[1];
			else if (attr.startsWith('suppressedErrors='))
				this.suppressedErrors = attr.match(new RegExp(/suppressedErrors=([^,]*)/))[1].split('|');
			else if (attr == 'native')
				this.isNative = true;
			else if (attr != 'true')
				cls = attr;
		}

		this._clsnm = cls || '';

		this._wgt = wgt;

		this._parent = parent;
		if (wgt._tooltiptext) // ZK-751
			this._tooltiptext = wgt._tooltiptext;

		this.initContent();
	},
	/**
	 * Synchronizes the visual states of the element with fileupload
	 */
	sync: function () {
		if (!this._formDetached) {
			var wgt = this._wgt,
				ref = wgt.$n(),
				parent = this._parent,
				outer = parent ? parent.lastChild : ref.nextSibling,
				inp = outer.firstChild.firstChild,
				refof = zk(ref).revisedOffset(),
				outerof = jq(outer).css({top: '0', left: '0'}).zk.revisedOffset(),
				st = outer.style,
				shouldHack = zk.ie < 11; // ZK-4589: hidden file upload input obstructing other widgets
			st.top = (refof[1] - outerof[1]) + 'px';
			st.left = (refof[0] - outerof[0]) + 'px';

			inp.style.height = (shouldHack ? ref.offsetHeight : '0') + 'px';
			inp.style.width = (shouldHack ? ref.offsetWidth : '0') + 'px'; // ZK-4222: Replace deprecated CSS property clip:rect(...)
		}
	},
	initContent: function () {
		var wgt = this._wgt,
			parent = this._parent,
			ref = wgt.$n(),
			html = '<span class="z-upload"'
				 + (this._tooltiptext ? ' title="' + zUtl.encodeXML(this._tooltiptext) + '"' : '') // ZK-751
				 + '><form enctype="multipart/form-data" method="POST">'
				 + '<input name="file" type="file"'
				// multiple="" for Firefox, multiple for Chrome
				 + (this.multiple == 'true' ? ' multiple="" multiple' : '')
				 + (this.accept ? ' accept="' + this.accept.replace(new RegExp('\\|', 'g'), ',') + '"' : '')
				 + ' hidefocus="true" tabindex="-1" style="height:'
				 + ref.offsetHeight + 'px"/></form></span>';

		if (parent)
			jq(parent).append(html);
		else
			jq(wgt).after(html);
		delete this._formDetached;

		//B50-3304877: autodisable and Upload
		if (!wgt._autodisable_self) {
			var self = this;
			//B65-ZK-2111: Sync later to prevent the external style change button offset height/width.
			setTimeout(function () {
				self.sync();
			}, 50);
		}

		var outer = this._outer = parent ? parent.lastChild : ref.nextSibling,
			inp = outer.firstChild.firstChild;

		this._inp = inp;

		if (zk.opera) { //in opera, relative not correct (test2/B50-ZK-363.zul)
			outer.style.position = 'absolute';
			_addSyncQue(this);
		}

		inp.z$proxy = ref;
		inp._ctrl = this;

		jq(inp).change(_onchange);

		//ZK-2471 refix
		if (zk.ie <= 10) {
			jq(inp).hover(function () {
				jq(wgt).addClass('z-upload-hover');
			}, function () {
				jq(wgt).removeClass('z-upload-hover');
			});
		}
	},
	/**
	 * trigger file input's click to open file dialog
	 */
	openFileDialog: function () {
		jq(this._inp).click();
	},
	/**
	 * Destroys the fileupload. You cannot use this object any more.
	 */
	destroy: function () {
		if (zk.opera)
			_rmSyncQue(this);

		jq(this._outer).remove();
		this._inp = null;
		this._wgt = this._parent = null;
		for (var v in this.uploaders) {
			var uplder = this.uploaders[v];
			if (uplder) {
				delete this.uploaders[v];
				uplder.destroy();
			}
		}
	},
	/**
	 * Returns the uuid of the uploader with its sequential number
	 * @return String the key of the uploader
	 */
	getKey: function (sid) {
		return (this._wgt ? this._wgt.uuid : '') + '_uplder_' + sid;
	},
	/**
	 * Cancels the fileupload if the fileupload is progressing.
	 * @param int sid the sequential number of the uploader
	 */
	cancel: function (sid) { //cancel upload
		_cancel(this, sid);
	},
	/**
	 * Finishes the fileupload if the fileupload is done.
	 * @param int sid the sequential number of the uploader
	 */
	finish: function (sid) {
		_cancel(this, sid, true);
	},
	getFile: function () {
		let uploader = this.uploaders[this.getKey(this.sid - 1)];
		if (uploader) {
			return uploader.getFile();
		}
		return null;
	}
}, {
	/**
	 * Shows the error message of the fileupload
	 * @param String msg the error message
	 * @param String uuid the ID of the widget
	 * @param int sid the sequential number of the uploader
	 */
	error: function (msg, uuid, sid) {
		var wgt = zk.Widget.$(uuid);
		if (wgt) {
			var errorType,
				matched = msg.match('^([\\w-]+?):'),
				uploader = wgt._uplder,
				suppressedErrors = uploader ? uploader.suppressedErrors : [];
			if (matched) {
				msg = msg.replace(matched[0], '');
				errorType = matched[1];
			}
			if (!errorType || suppressedErrors.indexOf(errorType) === -1) {
				jq.alert(msg, {desktop: wgt.desktop, icon: 'ERROR'});
			}
			zul.Upload.close(uuid, sid);
		}
	},

	/**
	 * Closes the fileupload
	 * @param String uuid the ID of the widget
	 * @param int sid the sequential number of the uploader
	 */
	close: function (uuid, sid) {
		var wgt = zk.Widget.$(uuid);
		if (!wgt || !wgt._uplder) return;
		wgt._uplder.cancel(sid);
	},
	/**
	 * Sends the upload result to server.
	 * @param String uuid the ID of the widget
	 * @param String contentId the ID of the content being uploaded
	 * @param int sid the sequential number of the uploader
	 */
	sendResult: function (uuid, contentId, sid) {
		var wgt = zk.Widget.$(uuid);
		if (!wgt || !wgt._uplder) return;
		wgt._uplder.finish(sid);
		zAu.send(new zk.Event(wgt.desktop, 'updateResult', {
			contentId: contentId,
			wid: wgt.uuid,
			sid: sid
		}));
	},
	/**
	 * Returns the fileupload of the widget whether is finish or not.
	 * @param zk.Widget wgt the widget
	 * @return boolean
	 */
	isFinish: function (wgt) {
		for (var key = (typeof wgt == 'string' ? wgt : wgt.uuid) + '_uplder_',
				f = zul.Upload.files, i = f.length; i--;)
			if (f[0].id.startsWith(key))
				return false;
		return true;
	},
	/**
	 * Starts the uploader to upload a file.
	 * @param Object uplder the uploader
	 * @return boolean
	 */
	start: function (uplder) {
		var files = zul.Upload.files;
		if (uplder)
			files.push(uplder);
		if (files[0] && !files[0].isStart) {
			files[0].isStart = true;
			return files[0].start();
		}
		return true;
	},
	/**
	 * Destroys the uploader to upload
	 * @param Object uplder
	 */
	destroy: function (uplder) {
		for (var files = zul.Upload.files, i = files.length; i--;)
			if (files[i].id == uplder.id) {
				files.splice(i, 1);
				break;
			}
		zul.Upload.start();
	},
	files: []
});
/**
 * Default file uploader for the upload widget.
 * <p> One upload widget can have multi-instance of uploader to upload multiple
 * files at the same time.
 */
zul.Uploader = zk.$extends(zk.Object, {
	/** Constructor
	 * @param zul.Upload upload the upload object belong to the file uploader
	 * @param String id the ID of the uploader
	 * @param DOMElement form the element representing where the uploader element
	 * 		is appended
	 * @param String flnm the name of the file to be uploaded
	 */
	$init: function (upload, id, form, flnm) {
		this.id = id;
		this.flnm = flnm;
		this._upload = upload;
		this._form = form;
		this._parent = form.parentNode;
		this._sid = upload.sid;
		this._wgt = upload._wgt;

		var viewer, self = this;
		if (!upload._clsnm) viewer = new zul.UploadViewer(this, flnm);
		else
			zk.$import(upload._clsnm, function (cls) {
				viewer = new cls(self, flnm);
			});
		this.viewer = viewer;
	},
	getFile: function () {
		return this._form ? this._form[0].files : null;
	},
	/**
	 * Returns the widget which the uploader belongs to.
	 * @return zk.Widget
	 */
	getWidget: function () {
		return this._wgt;
	},
	/**
	 * Destroys the uploader to upload.
	 * @param boolean finish if true, the upload is finish.
	 */
	destroy: function (finish) {
		this.end(finish);
		if (this._form) {
			jq(this._form.parentNode).remove();
			jq('#' + this.id + '_ifm').remove();
		}
		this._form = this._upload = this._wgt = null;
	},
	/**
	 * Starts the uploader to upload
	 */
	start: function () {
		var wgt = this._wgt;

		if (this._passSizeCheck()) {
			wgt.fire('onUpload', {file: this._form[0].files}, {
				uploadCallback: {
					onprogress: this._onprogress(),
					onload: this._onload()
				}
			});
			//B50-3304877: autodisable and Upload
			zul.wgt.ADBS.autodisable(wgt);
			return true;
		}
		return false;
	},
	_passSizeCheck: function () {
		var uploadMaxsize = this._upload.maxsize,
			maxBytes = uploadMaxsize > 0 ? uploadMaxsize * 1024 : -1;

		if (maxBytes != -1) {
			var files = this._form[0].files,
				sizeBytes = 0;
			for (var i = 0; i < files.length; i++) {
				sizeBytes += files[i].size;
			}
			if (sizeBytes > maxBytes) {
				this._showMaxsizeErrorAndDestroy(sizeBytes, maxBytes);
				return false;
			}
		}
		return true;
	},
	_showMaxsizeErrorAndDestroy: function (sizeBytes, maxBytes) {
		var uploader = this;
		zk.load('zk.fmt', function () {
			var kb = ' ' + msgzk.KBYTES,
				mb = ' ' + msgzk.MBYTES,
				sizeKB = Math.round(sizeBytes / 1024),
				maxKB = Math.round(maxBytes / 1024),
				sizeMB = Math.round(sizeKB / 1024),
				maxMB = Math.round(maxKB / 1024),
				formatFileSize = zk.fmt.Text.formatFileSize,
				errorMessage = zk.fmt.Text.format(msgzul.UPLOAD_ERROR_EXCEED_MAXSIZE,
					formatFileSize(sizeBytes), formatFileSize(maxBytes), sizeBytes, maxBytes,
					sizeKB + kb, maxKB + kb, sizeMB + mb, maxMB + mb);
			zul.Upload.error('size-limit-exceeded:' + errorMessage, uploader._wgt.uuid, uploader._sid);
			uploader.destroy();
		});
	},
	_onprogress: function () {
		var viewer = this.viewer,
			wgt = this._wgt;
		return function (event) {
			wgt._uploading = true;
			var total = event.total,
				percentage = event.loaded / total * 100;
			viewer.update(percentage, total);
		};
	},
	_onload: function () {
		var uploader = this,
			wgt = this._wgt;
		return function (event) {
			if (this.readyState === 4) {
				wgt._uploading = false;
				if (this.status === 200) {
					wgt._uplder.finish(uploader._sid);
				} else {
					zul.Upload.error('server-out-of-service:' + this.statusText);
				}
			}
		};
	},
	/**
	 * Cancels the uploader to upload.
	 */
	cancel: function () {
		zul.Uploader.clearInterval(this.id);
		if (this._upload)
			this._upload.cancel(this._sid);
	},
	/**
	 * Updates the status of the file being uploaded.
	 * @param int sent how many percentage being sent
	 * @param int total the size of the file
	 * @return boolean
	 */
	update: function (sent, total) {
		var wgt = this.getWidget();
		if (!wgt || total <= 0) {
			if (this._echo)
				this.end();
			else
				return true; // B50-3309632: server may not even see the file yet, keep asking
		} else if (zul.Uploader._tmupload) {
			this._echo = true;
			if (sent >= 0 && sent <= 100)
				this.viewer.update(sent, total);
			return sent >= 0 && sent < 100;
		}
		return false;
	},
	/**
	 * Ends the uploader to upload.
	 * @param boolean finish whether the file is finish.
	 */
	end: function (finish) {
		this.viewer.destroy(finish);
		zul.Upload.destroy(this);
		this._echo = true;

		//B50-3304877: autodisable and Upload
		var wgt, upload, aded, parent;
		if ((wgt = this._wgt) && (upload = this._upload)
			&& (aded = upload._aded)) {
			wgt._uplder = null; // prevent destory during onResponse(sync disabled status by rerender will destory _uplder)
			aded.onResponse();
			upload._aded = null;

			//restore uploader
			wgt._uplder.destroy();
			if ((parent = upload._parent) && !jq(parent).parents('html').length) {
				upload._parent = wgt._getUploadRef();
				upload.initContent();
			}
			wgt._uplder = upload;
			wgt._uplder.sync();
			delete wgt._autodisable_self;
		}
	}
});

// default UploadViewer
	function _addUM(uplder, flnm) {
		var wgt = uplder.getWidget(),
			flman = zul.UploadViewer.flman;
		if (!wgt)
			return;
		if (!flman || !flman.desktop) {
			if (flman) flman.detach();
			zul.UploadViewer.flman = flman = new zul.UploadManager();
			wgt.getPage().appendChild(flman);
		}
		flman.removeFile(uplder);
		flman.addFile(uplder);
	}
	function _initUM(uplder, flnm) {
		if (zul.UploadManager)
			return _addUM(uplder, flnm);

		zk.load('zul.wgt,zul.box', function () {
			/**
			 * Default file upload manager to manage the uploading files in a panel.
			 * Users can add/delete the file upon the panel.
			 */
			zul.UploadManager = zk.$extends(zul.wgt.Popup, {
				$init: function () {
					this.$supers('$init', arguments);
					this._files = {};
					this.setSclass('z-fileupload-manager');
				},
				onFloatUp: function (ctl) {
					if (!this.isVisible())
						return;
					this.setTopmost();
				},
				/**
				 * Returns the file item.
				 * @param String id the ID of the file or the ID of upload widget
				 * @return zul.wgt.Div the file item widget.
				 */
				getFileItem: function (id) {
					return this._files[id] || zk.Widget.$(id);
				},
				/**
				 * Adds the file item to upload.
				 * @param zul.Uploader uplder
				 * @return zul.wgt.Div the file item widget
				 */
				addFile: function (uplder) {
					var id = uplder.id,
						flnm = uplder.flnm,
						prog = this.getFileItem(id);
					if (!prog) {
						prog = new zul.wgt.Div({
							uuid: id,
							children: [new zul.wgt.Label({
								value: flnm + ':'
							}), new zul.box.Box({
								mold: 'horizontal',
								children: [new zul.wgt.Progressmeter({
									id: id,
									sclass: 'z-fileupload-progress'
								}),
								new zul.wgt.Div({
									sclass: 'z-fileupload-remove z-icon-times',
									listeners: {
										onClick: function () {
											uplder.cancel();
										}
									}
								})]
							}), new zul.wgt.Label({id: id + '_total'}), new zul.wgt.Separator()]
						});
						// Bug 2987059: IE may cause JS error in the appendChild()
						try {
							this.appendChild(prog);
						} catch (e) {
							zk.debugLog(e.message || e);
						}
						this._files[id] = prog;
					}
					return prog;
				},
				/**
				 * Updates the status of the file item.
				 * @param zul.Uploader uplder
				 * @param int val how many percentage being uploaded
				 * @param int total the size of the file
				 */
				updateFile: function (uplder, val, total) {
					var id = uplder.id,
						prog = this.getFileItem(id);
					if (!prog) return;
					prog.$f(id).setValue(val);
					prog.$f(id + '_total').setValue(total);
				},
				/**
				 * Removes the file item.
				 * @param zul.Uploader uplder
				 */
				removeFile: function (uplder) {
					var id = uplder.id,
						prog = this.getFileItem(id);
					if (prog)
						prog.detach();
					delete this._files[id];
					var close = Object.keys(this._files).length === 0;
					if (close)
						this.close();
				},
				/**
				 * Opens the file manager to show.
				 * @param zk.Widget wgt the wgt where the file manager is shown
				 * @param String position the position where the file manager is located
				 */
				open: function (wgt, position) {
					this.$super('open', wgt, null, position || 'after_start', {
						sendOnOpen: false,
						disableMask: true
					});
				}
			});
			_addUM(uplder, flnm);
		});
	}
/**
 * Default file viewer to see the upload status.
 */
zul.UploadViewer = zk.$extends(zk.Object, {
	/** Constructor
	 * @param zul.Uploader uplder
	 * @param String flnm the name of the file to be uploaded
	 */
	$init: function (uplder, flnm) {
		this._uplder = uplder;
		_initUM(uplder, flnm);
	},
	/**
	 * Updates the status of the file being uploaded.
	 * @param int sent how many percentage being sent
	 * @param int total the size of the file
	 */
	update: function (sent, total) {
		var flman = zul.UploadViewer.flman;
		if (flman) {
			if (!flman.isOpen())
					flman.open(this._uplder.getWidget());
			flman.updateFile(this._uplder, sent, msgzk.FILE_SIZE + Math.round(total / 1024) + msgzk.KBYTES);
		}
	},
	/**
	 * Destroys the upload viewer.
	 */
	destroy: function () {
		var flman = zul.UploadViewer.flman;
		if (flman)
			flman.removeFile(this._uplder);
	}
});

})();
