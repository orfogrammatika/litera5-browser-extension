import { getConfig } from './lib/Config';
import { findEditors, getEditorContent, setEditorContent } from './lib/editor';
import { Logger } from './lib/logger';
import { findIndex } from 'lodash';
import { createApi } from 'litera5-api-js-client';

import '../styles/contentSpellcheck.scss';
import { Svg } from './svg';

const log = Logger.get('L5 Spellcheck');

interface EditorSaveDetail {
	title?: string;
	description?: string;
	keywords?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	metaCustom?: any[];
	html: string;
}

function _company(login: string): string {
	const parts = login.split('@');
	if (parts.length === 2) {
		return parts[1];
	} else {
		return '';
	}
}

function _login(login: string): string {
	const parts = login.split('@');
	if (parts.length === 2) {
		return parts[0];
	} else {
		return '';
	}
}

function _mkIFrameUrl(server: string, url: string): string {
	const m = url.match(/^.*\/([^/]+)\/$/);
	const iframe = m?.[1];
	return `${server.replace(/\/+$/, '')}/api/pub/iframe/${iframe}/`;
}

class L5ButtonHandler {
	$element: HTMLElement;
	$btn: HTMLElement;
	$div: HTMLElement;
	count: number;

	setButtonClass = () => {
		if (this.count > 0) {
			const r = this.$element.getBoundingClientRect();
			this.$btn.style.left = `${window.scrollX + r.right - 36}px`;
			this.$btn.style.top = `${window.scrollY + r.bottom - 36}px`;
			this.$btn.classList.remove('hidden');
		} else {
			this.$btn.classList.add('hidden');
		}
	};

	showButton = () => {
		this.count++;
		this.setButtonClass();
	};

	hideButton = () => {
		this.count--;
		if (this.count < 0) {
			this.count = 0;
		}
		this.setButtonClass();
	};

	onMessage = (event: MessageEvent) => {
		log.debug('onMessage event:', event);
		switch (event.data.kind) {
			case 'litera5-iframe-save':
				this.saveEditor(event.data.detail as EditorSaveDetail);
				break;
			case 'litera5-iframe-cancel':
				this.closeEditor();
				break;
		}
	};

	closeEditor = () => {
		log.debug('closeEditor');
		if (this.$div) {
			this.$div.remove();
		}
		window.removeEventListener('message', this.onMessage);
	};

	saveEditor = (data: EditorSaveDetail) => {
		log.debug('saveEditor data:', data);
		setEditorContent(this.$element, data.html);
		this.closeEditor();
	};

	showEditor = (url: string) => {
		log.debug('showEditor url:', url);
		const $div = document.createElement('div');
		$div.classList.add('l5-plugin-editor');
		const $iframe = document.createElement('iframe');
		$iframe.src = url;
		$div.appendChild($iframe);
		document.body.appendChild($div);
		this.$div = $div;
	};

	onClickButton = async () => {
		const html = getEditorContent(this.$element);
		log.debug('check html:', html);
		const cfg = await getConfig();
		const api = createApi({
			company: _company(cfg.login),
			userApiPassword: cfg.password,
			url: cfg.server,
		});
		const resp = await api.userCheck({
			login: _login(cfg.login),
			token: '',
			html: html,
		});
		window.addEventListener('message', this.onMessage);
		this.showEditor(_mkIFrameUrl(cfg.server, resp.url));
	};

	createButton = () => {
		this.$btn = document.createElement('div');
		this.$btn.classList.add('l5-plugin-button');
		this.$btn.classList.add('hidden');
		this.$btn.innerHTML = Svg.logo;
		this.$btn.title = 'Проверить текст редактора в Литере';
		this.$btn.addEventListener('mouseenter', this.showButton);
		this.$btn.addEventListener('mouseleave', this.hideButton);
		this.$btn.addEventListener('click', this.onClickButton);
		document.body.appendChild(this.$btn);
	};

	constructor(e: HTMLElement) {
		this.$element = e;
		this.createButton();
		this.$element.addEventListener('mouseenter', this.showButton);
		this.$element.addEventListener('mouseleave', this.hideButton);
		this.count = 0;
	}
}

const editors: L5ButtonHandler[] = [];

function hasHandlerForElement(element: HTMLElement): boolean {
	return findIndex(editors, { $element: element }) > -1;
}

/**
 *
 * @param element
 */
function instrumentEditor(element: HTMLElement): void {
	if (!hasHandlerForElement(element)) {
		log.debug('instrumentEditor < element=', element);
		const handler = new L5ButtonHandler(element);
		editors.push(handler);
		log.debug('instrumentEditor >');
	}
}

function instrumentEditors() {
	const editors = findEditors();
	editors.forEach(instrumentEditor);
}

/**
 * Стартовая настройка плагина, поиск текстовых редакторов и
 */
async function setup() {
	log.debug('setup <');

	const observer = new MutationObserver(instrumentEditors);
	observer.observe(document.body, {
		attributes: false,
		childList: true,
		subtree: true,
	});

	instrumentEditors();
	log.debug('setup >');
}

setup().then();

log.debug('Модуль проверки правописания загружен.');
