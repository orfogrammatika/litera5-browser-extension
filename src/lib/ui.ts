import { forEach, isNil } from 'lodash';

export const Ui = {
	hide: (elm?: HTMLElement | null) => elm?.classList.add('hidden'),
	show: (elm?: HTMLElement | null) => elm?.classList.remove('hidden'),
	innerText: {
		set: (elm?: HTMLElement | null, value?: string) => {
			if (!isNil(elm)) {
				elm.innerText = value ?? '';
			}
		},
		get: (elm?: HTMLElement | null) => {
			return elm?.innerText;
		},
	},
	style: {
		set: (elm?: HTMLElement | null, value?: Partial<CSSStyleDeclaration>) => {
			if (!isNil(elm) && !isNil(value)) {
				forEach(value as Record<string, string>, (v, k) => {
					elm.style.setProperty(k, v);
				});
			}
		},
	},
	on: (elm?: HTMLElement | Element | Document | null) => {
		const res = {
			custom: (event: string, handler: EventListenerOrEventListenerObject) => {
				elm?.addEventListener(event, handler);
				return res;
			},
			click: (handler: EventListenerOrEventListenerObject) => res.custom('click', handler),
			mouseenter: (handler: EventListenerOrEventListenerObject) => res.custom('mouseenter', handler),
			mouseleave: (handler: EventListenerOrEventListenerObject) => res.custom('mouseleave', handler),
		};
		return res;
	},
	off: (elm?: HTMLElement | Element | Document | null) => {
		const res = {
			custom: (event: string, handler: EventListenerOrEventListenerObject) => {
				elm?.removeEventListener(event, handler);
				return res;
			},
			click: (handler: EventListenerOrEventListenerObject) => res.custom('click', handler),
			mouseenter: (handler: EventListenerOrEventListenerObject) => res.custom('mouseenter', handler),
			mouseleave: (handler: EventListenerOrEventListenerObject) => res.custom('mouseleave', handler),
		};
		return res;
	},
};
