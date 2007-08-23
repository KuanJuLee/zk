/* BaseSlider.java

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

import java.text.DecimalFormat;
import java.util.regex.Pattern;

import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.ConverterException;

import org.zkoss.jsf.zul.impl.BaseDatebox.DateFormatConverter;
import org.zkoss.zk.ui.Component;

/**
 * The Base implementation of Slider. This component should be declared
 * nested under {@link org.zkoss.jsf.zul.Page}.
 * 
 * @author Dennis.Chen
 * 
 */
abstract public class BaseSlider extends BranchInput {

	/**
	 * Override method, add a {@link DateFormatConverter} as the default
	 * converter if no converter is assigned.
	 */
	protected void afterZULComponentComposed(Component zulcomp) {

		// add default converter before super process attribute.
		Converter converter = this.getConverter();
		if (converter == null) {
			converter = new IntgerFormatConverter();
			this.setConverter(converter);
		}

		super.afterZULComponentComposed(zulcomp);
	}

	/**
	 * Override Method, Return ZUL Component attribute name which can handler
	 * the submition of input. Always return "curpos"
	 * 
	 * @see ClientInputSupport
	 */
	public String getMappedAttributeName() {
		return "curpos";
	}

	/**
	 * Converter String to Integer, or Integer to String by a
	 * {@link java.text.DecimalFormat}.
	 * 
	 * @author Dennis.Chen
	 * 
	 */
	static public class IntgerFormatConverter extends FormateHolder implements
			Converter {

		private DecimalFormat _formater;
		static private Pattern pattern = Pattern.compile("\\-*[0-9]*");
		

		public IntgerFormatConverter() {
			formatChanged();
		}

		public IntgerFormatConverter(String format) {
			super(format);
			formatChanged();
		}

		protected void formatChanged() {
			if(_formater==null){
				_formater = new DecimalFormat();
			}
			if(_format==null){
				_formater.applyLocalizedPattern("#0");
			}else{
				_formater.applyLocalizedPattern(_format);
			}
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see javax.faces.convert.Converter#getAsObject(javax.faces.context.FacesContext,
		 *      javax.faces.component.UIComponent, java.lang.String)
		 */
		public Object getAsObject(FacesContext context, UIComponent component,
				String value) {
			try {
				if (value == null || "".equals(value.trim()))
					return null;
				
				if(!pattern.matcher(value).matches()){
					throw new ConverterException("Format Error");
				}
				return new Integer(_formater.parse(value).intValue());
			} catch (Exception e) {
				throw new ConverterException(e.getMessage(),e);
			}
		}

		/*
		 * (non-Javadoc)
		 * 
		 * @see javax.faces.convert.Converter#getAsString(javax.faces.context.FacesContext,
		 *      javax.faces.component.UIComponent, java.lang.Object)
		 */
		public String getAsString(FacesContext context, UIComponent component,
				Object value) {
			if (value == null)
				return null;
			try {
				return _formater.format(value);
			} catch (Exception e) {
				throw new ConverterException(e.getMessage(),e);
			}
		}
	}

}
