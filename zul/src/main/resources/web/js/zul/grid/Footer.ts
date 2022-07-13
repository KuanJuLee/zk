/* Footer.ts

	Purpose:

	Description:

	History:
		Fri Jan 23 12:26:51     2009, Created by jumperchen

Copyright (C) 2008 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 2.1 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
/**
 * A column of the footer of a grid ({@link Grid}).
 * Its parent must be {@link Foot}.
 *
 * <p>Unlike {@link Column}, you could place any child in a grid footer.
 * <p>Default {@link #getZclass}: z-footer.
 */
@zk.WrapClass('zul.grid.Footer')
export class Footer extends zul.mesh.FooterWidget {
	/** Returns the grid that this belongs to.
	 * @return zul.grid.Grid
	 */
	getGrid(): zul.grid.Grid | null | undefined {
		return this.getMeshWidget() as zul.grid.Grid | null | undefined;
	}

	/** Returns the column that is in the same column as
	 * this footer, or null if not available.
	 * @return zul.grid.Column
	 */
	getColumn(): zul.grid.Column | null | undefined {
		return this.getHeaderWidget() as zul.grid.Column | null | undefined;
	}
}