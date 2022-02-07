/* jq.d.ts

	Purpose:
		Type definitions for ZK
	Description:

	History:
		Mon Apr 01 14:39:27 CST 2019, Created by rudyhuang

Copyright (C) 2019 Potix Corporation. All Rights Reserved.

This program is distributed under LGPL Version 2.1 in the hope that
it will be useful, but WITHOUT ANY WARRANTY.
*/
/// <reference types="jquery"/>
/// <reference types="jquery.transit"/>
/// <reference types="jquery-mousewheel"/>

declare namespace zk {

	type Offset = import('@zk/types').Offset;
	type Desktop = import('@zk/widget').Desktop;

	interface JQueryEffectExtension extends JQuery.Effects {
		speeds: Record<string, number>;
	}

    interface JQueryStaticExtension extends JQueryStatic {
        borders: {l: string; r: string; t: string; b: string};
        browser: {
            chrome?: boolean;
            mozilla?: boolean;
            msie?: boolean;
            opera?: boolean;
            safari?: boolean;
            version: string;
            webkit?: boolean;
        };
        margins: {l: string; r: string; t: string; b: string};
        paddings: {l: string; r: string; t: string; b: string};
        isReady: boolean; // expose jQuery undocumented property

	    (selector: unknown, zk?: any);
        $$(id: '', subId?: string): null;
        $$(id: string, subId?: string): NodeList;
        $$<T>(id: T, subId?: string): T;
        alert(msg: string, opts?: Partial<AlertOptions>): void;
        clearSelection(): boolean;
        confirm(msg: string): boolean;
        css(elem: Node, name: string): string;
        css(elem: Node, name: string, numeric: true): number;
        css(elem: Node, name: string, extra: 'styleonly', styles?: CSSStyleDeclaration): number;
        d2j(d: Date | import('globals').DateImpl): string;
        doSyncScroll(): void;
        evalJSON(s: string): any;
        filterTextStyle(style: string, plus?: string[]): string;
        filterTextStyle(style: {[key: string]: any}, plus?: string[]): {[key: string]: any};
        focusOut(): void;
        head(): HTMLElement | null;
        innerHeight(): number;
        innerWidth(): number;
        innerX(): number;
        innerY(): number;
        isAncestor(p: HTMLElement | null | undefined, c: HTMLElement | null | undefined): boolean;
        isOverlapped(ofs1: Offset, dim1: Offset, ofs2: Offset, dim2: Offset, tolerant?: number): boolean;
        j2d(s: string): Date;
        newFrame(id: string, src?: string, style?: string | null): HTMLIFrameElement;
        newHidden(nm: string, val: string, parent?: Node): HTMLInputElement;
        newStackup(el: Node | null, id: string, anchor?: Node): HTMLIFrameElement;
        nodeName(el: Node): string;
        nodeName(el: Node, ...tag: string[]): boolean;
        onSyncScroll(wgt: any): void;
        onzsync(obj: any): void;
        parseStyle(style: string): {[key: string]: string};
        px(v: number): string;
        px0(v: number | null | undefined): string;
        scrollbarWidth(): number;
        toJSON(obj: any, replace?: (key: any, value: any) => any): string;
        uaMatch(ua: string): { browser: string; version: string };
        unSyncScroll(wgt: any): void;
        unzsync(obj: any): void;
        zsync(org: any): void;
		fx: JQueryEffectExtension;
    }

    interface EventMetaData {
        altKey?: true;
        ctrlKey?: true;
        shiftKey?: true;
        metaKey?: true;
        which: number;
    }

    interface EventKeyData extends EventMetaData {
        keyCode: number | undefined;
        charCode: number | undefined;
        key: string | undefined;
    }

    interface EventMouseData extends EventMetaData {
        pageX: number | undefined;
        pageY: number | undefined;
    }

    interface AlertOptions {
        mode: 'os' | 'modal' | 'embedded' | 'overlapped' | 'popup' | 'highlighted';
        title: string;
        icon: 'QUESTION' | 'EXCLAMATION' | 'INFORMATION' | 'ERROR' | 'none' | string;
        button: string | Record<string, unknown>;
        desktop: Desktop;
    }
}

// extension of JQuery
interface JQuery {

    selector?: string; // expose
    zk: import('@zk/dom').JQZK;

	on(selector: string, func: Function): this;
	on(selector: string, data: unknown, func: Function): this;
	off(selector: string, func: Function): this;
	off(selector: string, data: unknown, func: Function): this;
	zon<TData>(
		events: JQuery.TypeEventHandlers<HTMLElement, TData, any, any>,
		selector: JQuery.Selector,
		data: TData,
		delegateEventFunc: Function,
		...args: unknown[]
	): this;
	zoff(event?: JQuery.TriggeredEvent<HTMLElement>,
	     selector?: JQuery.Selector,
		delegateEventFunc?: Function,
		...args: unknown[]): this;
    after(widget: Widget, dt?: zk.Desktop): this;
    append(widget: Widget, dt?: zk.Desktop): this;
    before(widget: Widget, dt?: zk.Desktop): this;
    prepend(widget: Widget, dt?: zk.Desktop): this;
    absolutize(): this;
}

declare namespace JQ {
	interface Event extends JQuery.TriggeredEvent {
        stop(): void;
        mouseData(): zk.EventMouseData;
        keyData(): zk.EventKeyData;
        metaData(): zk.EventMetaData;
    }
}

declare namespace JQuery {
	interface EventStatic {
		<T extends object>(event: string| UIEvent, properties?: T): JQ.Event & T;
		filterMetaData(data: Record<string, unknown>): zk.EventMetaData;
		fire(el: Element, evtnm: string): void;
		stop(evt: Event): void;
		zk(evt: Event, wgt?: Widget | null): ZKEvent;
	}
}

declare var jq: zk.JQueryStaticExtension;
