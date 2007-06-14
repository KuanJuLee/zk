/* DesktopImpl.java

{{IS_NOTE
	Purpose:
		
	Description:
		
	History:
		Wed Jun 22 09:50:57     2005, Created by tomyeh
}}IS_NOTE

Copyright (C) 2005 Potix Corporation. All Rights Reserved.

{{IS_RIGHT
	This program is distributed under GPL Version 2.0 in the hope that
	it will be useful, but WITHOUT ANY WARRANTY.
}}IS_RIGHT
*/
package org.zkoss.zk.ui.impl;

import java.util.Collection;
import java.util.Iterator;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;

import org.zkoss.lang.D;
import org.zkoss.lang.Strings;
import org.zkoss.util.CacheMap;
import org.zkoss.util.logging.Log;
import org.zkoss.util.media.Media;
import org.zkoss.io.Serializables;

import org.zkoss.zk.mesg.MZk;
import org.zkoss.zk.ui.WebApp;
import org.zkoss.zk.ui.Desktop;
import org.zkoss.zk.ui.Page;
import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.Session;
import org.zkoss.zk.ui.Sessions;
import org.zkoss.zk.ui.Execution;
import org.zkoss.zk.ui.UiException;
import org.zkoss.zk.ui.ComponentNotFoundException;
import org.zkoss.zk.ui.metainfo.LanguageDefinition;
import org.zkoss.zk.ui.util.Configuration;
import org.zkoss.zk.ui.util.Monitor;
import org.zkoss.zk.ui.util.DesktopSerializationListener;
import org.zkoss.zk.ui.ext.render.DynamicMedia;
import org.zkoss.zk.ui.sys.PageCtrl;
import org.zkoss.zk.ui.sys.SessionCtrl;
import org.zkoss.zk.ui.sys.ExecutionCtrl;
import org.zkoss.zk.ui.sys.ComponentCtrl;
import org.zkoss.zk.ui.sys.ComponentsCtrl;
import org.zkoss.zk.ui.sys.RequestQueue;
import org.zkoss.zk.ui.sys.DesktopCache;
import org.zkoss.zk.ui.sys.WebAppCtrl;
import org.zkoss.zk.ui.sys.DesktopCtrl;
import org.zkoss.zk.ui.sys.EventProcessingThread;
import org.zkoss.zk.au.AuBookmark;
import org.zkoss.zk.device.Device;
import org.zkoss.zk.device.Devices;
import org.zkoss.zk.device.DeviceNotFoundException;

/**
 * The implementation of {@link Desktop}.
 *
 * <p>Note: though {@link DesktopImpl} is serializable, it is designed
 * to work with Web container to enable the serialization of sessions.
 * It is not suggested to serialize and desrialize it directly since
 * many fields might be lost.
 *
 * <p>On the other hand, it is OK to serialize and deserialize
 * {@link Component}.
 *
 * @author tomyeh
 */
public class DesktopImpl implements Desktop, DesktopCtrl, java.io.Serializable {
	private static final Log log = Log.lookup(DesktopImpl.class);
    private static final long serialVersionUID = 20070416L;

	/** Represents media. It must be distinguishable from component's ID. */
	private static final String MEDIA_PREFIX = "med";

	private transient WebApp _wapp;
	private transient Session _sess;
	private String _id;
	/** The current directory of this desktop. */
	private String _dir;
	/** The URI to access the update engine. */
	private final String _updateURI;
	/** Map(String id, Page page). */
	private final Map _pages = new LinkedHashMap(3);
	/** Map (String uuid, Component comp). */
	private transient Map _comps;
	/** A map of attributes. */
	private transient Map _attrs;
		//don't create it dynamically because PageImp._ip bind it at constructor
	private transient Execution _exec;
	/** Next available key. */
	private int _nextKey;
	/** Next available UUID. */
	private transient int _nextUuid;
	/** A special prefix to UUID generated by this desktop.
	 * It is used to avoid ID conflicts with other desktops in the same
	 * session.
	 * Since UUID is long enough plus this prefix, the chance to conlict
	 * is almost impossible.
	 */
	private String _uuidPrefix;
	/** The request queue. */
	private transient RequestQueue _rque;
	private String _bookmark = "";
	/** The device type. */
	private String _devType;
	/** The device. */
	private Device _dev;
	/** A map of media (String key, Media content). */
	private CacheMap _meds;
	/** ID used to identify what is stored in _meds. */
	private int _medId;

	private static final int MAX_RESPONSE_SEQUENCE = 1024;
	/** The response sequence ID. */
	private int _respSeqId = MAX_RESPONSE_SEQUENCE - 1;
		//so the next value will be 0

	/**
	 * @param updateURI the URI to access the update engine (no expression allowed).
	 * Note: it is NOT encoded yet.
	 * @param dir the current directory.
	 * It is used if a relative URI is specified.
	 * If null or empty is specified, it means no current directory.
	 * @param deviceType the device type.
	 * If null or empty is specified, "ajax" is assumed.
	 */
	public DesktopImpl(WebApp wapp, String updateURI, String dir, String deviceType) {
		if (updateURI == null || wapp == null)
			throw new IllegalArgumentException("null");

		_wapp = wapp;
		_updateURI = updateURI;
		_devType =
			deviceType != null && deviceType.length() != 0 ? deviceType: "ajax";
		setCurrentDirectory(dir);

		init();

		_sess = Sessions.getCurrent(); //must be the current session
		final DesktopCache dc = ((WebAppCtrl)_wapp).getDesktopCache(_sess);
		_id = Strings.encode(
			new StringBuffer(12).append("g"), dc.getNextKey()).toString();
		updateUuidPrefix();

		final Configuration config = _wapp.getConfiguration();
		config.invokeDesktopInits(this); //it might throw exception

		dc.addDesktop(this); //add to cache after invokeDesktopInits

		final Monitor monitor = config.getMonitor();
		if (monitor != null) {
			try {
				monitor.desktopCreated(this);
			} catch (Throwable ex) {
				log.error(ex);
			}
		}
	}
	/** Initialization for contructor and de-serialized. */
	private void init() {
		_rque = newRequestQueue();
		_comps = new HashMap(41);
		_attrs = new HashMap();
	}
	/** Updates _uuidPrefix based on _id. */
	private void updateUuidPrefix() {
		_uuidPrefix = _id.substring(1, _id.length() <= 2 ? 2: 3);
			//the first few chars because of the encode's algorithm
	}

	public String getId() {
		return _id;
	}

	/** Creates the request queue.
	 * It is called when the desktop is initialized.
	 *
	 * <p>You may override it to provide your implementation of
	 * {@link RequestQueue} to control how to optimize the AU requests.
	 *
	 * <p>Default: creates an instance from {@link RequestQueueImpl};
	 *
	 * @since 2.4.0
	 */
	protected RequestQueue newRequestQueue() {
		return new RequestQueueImpl();
	}

	//-- Desktop --//
	public String getDeviceType() {
		return _devType;
	}
	public Device getDevice() {
		if (_dev == null)
			_dev = Devices.newDevice(this);
		return _dev;
	}
	public void setDeviceType(String deviceType) {
		//Note: we check _comps.isEmpty() only if device type diffs, because
		//a desktop might have several richlet and each of them will call
		//this method once
		if (!_devType.equals(deviceType)) {
			if (deviceType == null || deviceType.length() == 0)
				throw new IllegalArgumentException("empty");
			if (!Devices.exists(deviceType))
				throw new DeviceNotFoundException(deviceType, MZk.NOT_FOUND, deviceType);

			if (!_comps.isEmpty())
				throw new UiException("Unable to change the device type since some components are attached.");
			_devType = deviceType;
			_dev = null;
		}
	}
	public Execution getExecution() {
		return _exec;
	}
	public final Session getSession() {
		return _sess;
	}
	public String getUpdateURI(String pathInfo) {
		final String uri;
		if (pathInfo == null || pathInfo.length() == 0) {
			uri = _updateURI;
		} else {
			if (pathInfo.charAt(0) != '/')
				pathInfo = '/' + pathInfo;
			uri = _updateURI + pathInfo;
		}
		return _exec.encodeURL(uri);
	}
	public String getDynamicMediaURI(Component comp, String pathInfo) {
		if (!(((ComponentCtrl)comp).getExtraCtrl() instanceof DynamicMedia))
			throw new UiException(DynamicMedia.class+" not implemented by getExtraCtrl() of "+comp);

		final StringBuffer sb = new StringBuffer(64)
			.append("/view/").append(getId())
			.append('/').append(comp.getUuid());

		if (pathInfo != null && pathInfo.length() > 0) {
			if (!pathInfo.startsWith("/")) sb.append('/');
			sb.append(pathInfo);
		}
		return getUpdateURI(sb.toString());
	}
	public String getDownloadMediaURI(Media media, String pathInfo) {
		if (media == null)
			throw new IllegalArgumentException("null media");

		if (_meds == null)
			_meds = new CacheMap().setLifetime(6 * 60 * 1000);
				//6 minutes (consider to be configurable)
		String medId = Strings.encode(
			new StringBuffer(12).append(MEDIA_PREFIX), _medId++).toString();
		_meds.put(medId, media);

		final StringBuffer sb = new StringBuffer(64)
			.append("/view/").append(getId())
			.append('/').append(medId);

		if (pathInfo != null && pathInfo.length() > 0) {
			if (!pathInfo.startsWith("/")) sb.append('/');
			sb.append(pathInfo);
		}
		return getUpdateURI(sb.toString());
	}
	public Media getDownloadMedia(String medId, boolean remove) {
		return _meds != null ? remove ?
			(Media)_meds.remove(medId): (Media)_meds.get(medId): null;
	}

	public Page getPage(String pageId) {
		//We allow user to access this method concurrently, so synchronized
		//is required
		final Page page;
		synchronized (_pages) {
			page = (Page)_pages.get(pageId);
		}
		if (page == null)
			throw new ComponentNotFoundException("Page not found: "+pageId);
		return page;
	}
	public boolean hasPage(String pageId) {
		return _pages.containsKey(pageId);
	}
	public Collection getPages() {
		//No synchronized is required because it cannot be access concurrently
		return _pages.values();
	}

	public String getBookmark() {
		return _bookmark;
	}
	public void setBookmark(String name) {
		if (_exec == null)
			throw new IllegalStateException("Not the current desktop: "+this);
		if (name.indexOf('#') >= 0 || name.indexOf('?') >= 0)
			throw new IllegalArgumentException("Illegal character: # ?");
		_bookmark = name;
		((WebAppCtrl)_wapp).getUiEngine()
			.addResponse("bookmark", new AuBookmark(name));
	}

	public Collection getComponents() {
		return _comps.values();
	}
	public Component getComponentByUuid(String uuid) {
		final Component comp = (Component)_comps.get(uuid);
		if (comp == null)
			throw new ComponentNotFoundException("Component not found: "+uuid);
		return comp;
	}
	public Component getComponentByUuidIfAny(String uuid) {
		return (Component)_comps.get(uuid);
	}
	public void addComponent(Component comp) {
		//to avoid misuse, check whether new comp belongs to the same device type
		final LanguageDefinition langdef =
			comp.getDefinition().getLanguageDefinition();
		if (langdef != null && !_devType.equals(langdef.getDeviceType()))
			throw new UiException("Component, "+comp+", does not belong to the same device type of the desktop, "+_devType);

		final Object old = _comps.put(comp.getUuid(), comp);
		if (old != comp && old != null) {
			_comps.put(((Component)old).getUuid(), old); //recover
			throw new InternalError("Caller shall prevent it: Register a component twice: "+comp);
		}
	}
	public void removeComponent(Component comp) {
		_comps.remove(comp.getUuid());
	}

	public Map getAttributes() {
		return _attrs;
	}
	public Object getAttribute(String name) {
		return _attrs.get(name);
	}
	public Object setAttribute(String name, Object value) {
		return value != null ? _attrs.put(name, value): removeAttribute(name);
	}
	public Object removeAttribute(String name) {
		return _attrs.remove(name);
	}

	public WebApp getWebApp() {
		return _wapp;
	}

	public String getCurrentDirectory() {
		return _dir;
	}
	public void setCurrentDirectory(String dir) {
		if (dir == null) {
			dir = "";
		} else {
			final int len = dir.length() - 1;
			if (len >= 0 && dir.charAt(len) != '/')
				dir += '/';
		}
		_dir = dir;
	}

	//-- DesktopCtrl --//
	public RequestQueue getRequestQueue() {
		return _rque;
	}
	public void setExecution(Execution exec) {
		_exec = exec;
	}

	public int getNextKey() {
		return _nextKey++;
	}
	public String getNextUuid() {
		if ((_nextUuid & UUID_STEP_MASK) == 0) //run out
			_nextUuid =
				((SessionCtrl)_sess).getNextUuidGroup(UUID_STEP);

		return ComponentsCtrl.toAutoId(_uuidPrefix, _nextUuid++);
	}
	private static final int UUID_STEP = 128, UUID_STEP_MASK = UUID_STEP - 1;

	public void addPage(Page page) {
		//We have to synchronize it due to getPage allows concurrent access
		synchronized (_pages) {
			final Object old = _pages.put(page.getId(), page);
			if (old != null) {
				_pages.put(((Page)old).getId(), old); //recover
				log.warning(
					page == old ? "Register a page twice: "+page:
						"Replicated ID: "+page+"; already used by "+old);
			}
			if (D.ON && log.debugable()) log.debug("After added, pages: "+_pages);
		}
	}
	public void removePage(Page page) {
		synchronized (_pages) {
			if (_pages.remove(page.getId()) == null) {
				log.warning("Removing non-exist page: "+page+"\nCurrent pages: "+_pages.values());
				return;
			}
			if (D.ON && log.debugable()) log.debug("After removed, pages: "+_pages.values());
		}
		removeComponents(page.getRoots());

		((PageCtrl)page).destroy();
	}
	private void removeComponents(Collection comps) {
		for (Iterator it = comps.iterator(); it.hasNext();) {
			final Component comp = (Component)it.next();
			removeComponents(comp.getChildren()); //recursive
			removeComponent(comp);
		}
	}

	public void setBookmarkByClient(String name) {
		_bookmark = name != null ? name: "";
	}

	public void setId(String id) {
		if (!((ExecutionCtrl)_exec).isRecovering())
			throw new IllegalStateException("Callable only in recovring");
		if (id == null || id.length() <= 1 || id.charAt(0) != 'g')
			throw new IllegalArgumentException("Invalid desktop ID. You have to recover to the original value, not creating a new value: "+id);

		final DesktopCache dc = ((WebAppCtrl)_wapp).getDesktopCache(_sess);
		dc.removeDesktop(this);

		_id = id;
		updateUuidPrefix();

		dc.addDesktop(this);
	}
	public void recoverDidFail(Throwable ex) {
		((WebAppCtrl)_wapp).getDesktopCache(_sess).removeDesktop(this);
	}
	public int getResponseSequence(boolean advance) {
		if (advance && ++_respSeqId == MAX_RESPONSE_SEQUENCE)
			_respSeqId = 0;
		return _respSeqId;
	}
	public void setResponseSequence(int seqId) {
		if (seqId < 0 || seqId >= 1024)
			throw new IllegalArgumentException("Invalid sequence: "+seqId);
		_respSeqId = seqId;
	}

	public void destroy() {
		for (Iterator it = _pages.values().iterator(); it.hasNext();) {
			final PageCtrl pgc = (PageCtrl)it.next();
			try {
				pgc.destroy();
			} catch (Throwable ex) {
				log.error("Failed to destroy "+pgc, ex);
			}
		}

		//theorectically, the following is not necessary, but, to be safe...
		_pages.clear();
		_comps = _attrs = null;
		_meds = null;
		_rque = null;
	}

	public Collection getSuspendedThreads() {
		return ((WebAppCtrl)_wapp).getUiEngine().getSuspendedThreads(this);
	}
	public boolean ceaseSuspendedThread(EventProcessingThread evtthd, String cause) {
		return ((WebAppCtrl)_wapp).getUiEngine()
			.ceaseSuspendedThread(this, evtthd, cause);
	}

	//-- Object --//
	public String toString() {
		return "[Desktop "+_id+']';
	}

	public void sessionWillPassivate(Session sess) {
		for (Iterator it = _pages.values().iterator(); it.hasNext();)
			((PageCtrl)it.next()).sessionWillPassivate(this);

		if (_dev != null) _dev.sessionWillPassivate(this);
	}
	public void sessionDidActivate(Session sess) {
		_sess = sess;
		_wapp = sess.getWebApp();

		if (_dev != null) _dev.sessionDidActivate(this);

		for (Iterator it = _pages.values().iterator(); it.hasNext();)
			((PageCtrl)it.next()).sessionDidActivate(this);
	}

	//-- Serializable --//
	//NOTE: they must be declared as private
	private synchronized void writeObject(java.io.ObjectOutputStream s)
	throws java.io.IOException {
		s.defaultWriteObject();

		willSerialize(_attrs.values());
		Serializables.smartWrite(s, _attrs);
	}
	private void willSerialize(Collection c) {
		if (c != null)
			for (Iterator it = c.iterator(); it.hasNext();)
				willSerialize(it.next());
	}
	private void willSerialize(Object o) {
		if (o instanceof DesktopSerializationListener)
			((DesktopSerializationListener)o).willSerialize(this);
	}
	private synchronized void readObject(java.io.ObjectInputStream s)
	throws java.io.IOException, ClassNotFoundException {
		s.defaultReadObject();

		init();

		//get back _comps from _pages
		for (Iterator it = _pages.values().iterator(); it.hasNext();)
			for (Iterator e = ((Page)it.next()).getRoots().iterator();
			e.hasNext();)
				addAllComponents((Component)e.next());

		Serializables.smartRead(s, _attrs);
		didDeserialize(_attrs.values());
	}
	private void didDeserialize(Collection c) {
		if (c != null)
			for (Iterator it = c.iterator(); it.hasNext();)
				didDeserialize(it.next());
	}
	private void didDeserialize(Object o) {
		if (o instanceof DesktopSerializationListener)
			((DesktopSerializationListener)o).didDeserialize(this);
	}
	private void addAllComponents(Component comp) {
		addComponent(comp);
		for (Iterator it = comp.getChildren().iterator(); it.hasNext();)
			addAllComponents((Component)it.next());
	}
}
