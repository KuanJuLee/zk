/* BaseListbox.java

 {{IS_NOTE
 Purpose:
 
 Description:
 
 History:
 Aug 8, 2007 5:48:27 PM     2007, Created by Dennis.Chen
 }}IS_NOTE

 Copyright (C) 2007 Potix Corporation. All Rights Reserved.

 {{IS_RIGHT
 This program is distributed under GPL Version 2.0 in the hope that
 it will be useful, but WITHOUT ANY WARRANTY.
 }}IS_RIGHT
 */
package org.zkoss.jsf.zul.impl;

import java.util.Map;

import javax.faces.context.FacesContext;

import org.zkoss.zk.ui.Component;
import org.zkoss.zk.ui.event.Event;
import org.zkoss.zk.ui.event.EventListener;
import org.zkoss.zk.ui.event.Events;
import org.zkoss.zul.Radio;
import org.zkoss.zul.Radiogroup;

/**
 *  The Base implementation of Radiogroup. 
 * This component should be declared nested under {@link org.zkoss.jsf.zul.Page}.
 * @author Dennis.Chen
 * 
 */
abstract public class BaseRadiogroup extends BranchInput {

	/**
	 * Overrride , and return null, It means that do not map value of ValueHolder to zul component. i
	 * will take case value of ValueHolder to selecteItem of radiogroup .
	 * @return null
	 */
	public String getMappedAttributeName() {
		return null;
	}

	protected void afterZULComponentComposed(Component zulcomp) {
		super.afterZULComponentComposed(zulcomp);

		if (isLocalValueSet() || getValueBinding("value") != null) {
			
			zulcomp.addEventListener("onProcessZULJSFSelection",
					new ProcessSelection());
			
			//send onProcessZULJSFSelection as late as possible. 
			Events.postEvent("onProcessZULJSFSelection",zulcomp,getValue());
		}
	}
	
	private class ProcessSelection implements EventListener{
		public void onEvent(Event event) throws Exception {
			Radiogroup radiogroup = (Radiogroup)event.getTarget();
			Object value = event.getData();
			processSelection(radiogroup,value);
		}
	}

	/**
	 * set selected item of listbox by value,
	 */
	private void processSelection(Radiogroup radiogroup ,Object value){
		if(value==null) return;
		//radiogroup.setSelectedIndex(-1);
		
		int size =-1;
		Object data = null;
		
		
		size = radiogroup.getItemCount();
		
		for (int i = 0; i < size; i++) {
			data = null;
			Radio item = radiogroup.getItemAtIndex(i);
			data = item.getValue();
			
			if (data != null && value.equals(data)) {
				item.setSelected(true);
				radiogroup.setSelectedItem(item);
			}
		}
	}

	
	/**
	 * decode parameter in request, 
	 * @param context
	 */
	protected void clientInputDecode(FacesContext context) {
		String clientId = this.getClientId(context);
		Map requestMap = context.getExternalContext().getRequestParameterMap();
		if (requestMap.containsKey(clientId)) {
			String newValue = (String)context.getExternalContext().getRequestParameterMap().get(clientId);
			if(newValue!=null ){
				setSubmittedValue(newValue);
			}
		}
	}


}
