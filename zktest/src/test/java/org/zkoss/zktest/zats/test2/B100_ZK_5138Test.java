/* B100_ZK_5138Test.java

	Purpose:

	Description:

	History:
		Mon Apr 11 10:47:12 CST 2022, Created by katherine

Copyright (C) 2022 Potix Corporation. All Rights Reserved.
*/
package org.zkoss.zktest.zats.test2;

import static org.junit.Assert.assertTrue;

import org.junit.Test;

import org.zkoss.zktest.zats.WebDriverTestCase;

/**
 * @author katherine
 */
public class B100_ZK_5138Test extends WebDriverTestCase {
	@Test
	public void test() {
		connect();
		assertTrue(jq(".z-row").attr("style").contains("center"));
		click(jq("@button"));
		waitResponse();
		assertTrue(jq(".z-row").attr("style").contains("left"));
	}
}
