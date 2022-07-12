export * as box from './box';
export * as db from './db';
export * as fud from './fud';
export * as grid from './grid';
export * as inp from './inp';
export * as layout from './layout';
export * as med from './med';
export * as menu from './menu';
export * as mesh from './mesh';
export * as sel from './sel';
export * as tab from './tab';
export * as utl from './utl';
export * as wgt from './wgt';
export * as wnd from './wnd';
export * from '.';
export as namespace zul;

declare global {
	interface HTMLElement {
		_width?: string; // zul.tab.Tabs
		_lastsz?: null | { // zul/mesh
			width: number;
			height: number;
		};
		_lastSize?: null | { // zul/layout
			width: number;
			height: number;
		};
	}
    const msgzul: Record<
	| 'DATE_REQUIRED'
	| 'EMPTY_NOT_ALLOWED'
	| 'FIRST' // zul/mesh/Paging
	| 'GRID_ASC' // zul/mesh/ColumnMenuWidget
	| 'GRID_DESC' // zul/mesh/ColumnMenuWidget
	| 'GRID_GROUP' // zul/mesh/ColumnMenuWidget
	| 'GRID_OTHER' // zul/sel/Listheader
	| 'GRID_UNGROUP' // zul/mesh/ColumnMenuWidget
	| 'ILLEGAL_VALUE'
	| 'INTEGER_REQUIRED' // zul/inp/Intbox
	| 'LAST' // zul/inp/Intbox
	| 'NEXT' // zul/inp/Intbox
	| 'NO_AUDIO_SUPPORT'
	| 'NO_FUTURE_PAST_TODAY'
	| 'NO_FUTURE_PAST'
	| 'NO_FUTURE_TODAY'
	| 'NO_FUTURE'
	| 'NO_NEGATIVE_ZERO'
	| 'NO_NEGATIVE'
	| 'NO_PAST_TODAY'
	| 'NO_PAST'
	| 'NO_POSITIVE_NEGATIVE_ZERO'
	| 'NO_POSITIVE_NEGATIVE'
	| 'NO_POSITIVE_ZERO'
	| 'NO_POSITIVE'
	| 'NO_TODAY'
	| 'NO_ZERO'
	| 'NUMBER_REQUIRED' // zul/inp/Decimalbox
	| 'OK' // zul/dom
	| 'OUT_OF_RANGE_SEPARATOR' // zul/inp/SimpleLocalTimeConstraint
	| 'OUT_OF_RANGE'
	| 'PANEL_COLLAPSE' // zul/wnd/Panel
	| 'PANEL_CLOSE' // zul/wgt/ButtonRenderer
	| 'PANEL_EXPAND' // zul/inp/ComboWidget
	| 'PANEL_MAXIMIZE' // zul/wnd/Panel
	| 'PANEL_MINIMIZE' // zul/wgt/ButtonRenderer
	| 'PANEL_RESTORE' // zul/wnd/Panel
	| 'PREV' // zul/inp/Intbox
	| 'UNKNOWN_TYPE'
	| 'UPLOAD_ERROR_EXCEED_MAXSIZE' // zul/Upload
	| 'VALUE_NOT_MATCHED' // zul/inp/Combobox
	| 'WS_HOME' // zul/WScroll
	| 'WS_PREV' // zul/WScroll
	| 'WS_NEXT' // zul/WScroll
	| 'WS_END' // zul/WScroll
	, string>;
}