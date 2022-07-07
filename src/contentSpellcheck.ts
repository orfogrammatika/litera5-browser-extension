import { parseCompany, parseLogin } from './lib/api';
import { getConfig, isConfigured } from './lib/Config';
import { findEditors, getEditorContent, setEditorContent } from './lib/editor';
import { Ext, Msg } from './lib/ext';
import { Logger } from './lib/logger';
import { findIndex, isFunction, isNil } from 'lodash';
import { createApi } from 'litera5-api-js-client';

import '../styles/contentSpellcheck.scss';
import { Config } from './lib/storage';
import { Ui } from './lib/ui';
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

function _mkIFrameUrl(server: string, url: string): string {
	const m = url.match(/^.*\/([^/]+)\/$/);
	const iframe = m?.[1];
	return `${server.replace(/\/+$/, '')}/api/pub/iframe/${iframe}/`;
}

class L5ButtonHandler {
	$element: HTMLElement;
	$btn?: HTMLElement;
	$div?: HTMLElement;
	count: number;

	setButtonClass = () => {
		if (this.$btn) {
			if (this.count > 0) {
				const r = this.$element.getBoundingClientRect();
				Ui.style.set(this.$btn, {
					left: `${window.scrollX + r.right - 36}px`,
					top: `${window.scrollY + r.bottom - 36}px`,
				});
				Ui.show(this.$btn);
			} else {
				Ui.hide(this.$btn);
			}
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
		this.$div?.remove();
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
		$iframe.classList.add('l5-plugin-editor__iframe');
		const $btn = document.createElement('button');
		$btn.classList.add('l5-plugin-editor__close-button');
		Ui.on($btn).click(this.closeEditor);
		$btn.innerText = '✕';
		$btn.title = 'Закрыть редактор Литеры';
		$iframe.src = url;
		$div.appendChild($iframe);
		$div.appendChild($btn);
		document.body.appendChild($div);
		this.$div = $div;
	};

	onClickButton = async () => {
		const html = getEditorContent(this.$element);
		log.debug('check html:', html);
		const cfg = await getConfig();
		if (isConfigured(cfg)) {
			const api = createApi({
				company: parseCompany(cfg.login),
				userApiPassword: cfg.password,
				url: cfg.server,
			});
			const resp = await api
				.userCheck({
					login: parseLogin(cfg.login),
					token: '',
					html: html,
				})
				.catch(err => {
					log.error('Ошибка API', err);
					if (401 === err.status) {
						Ext.sendMessage({
							kind: Msg.misconfigure,
						});
						setTimeout(deinstrumentEditors, 1000);
						window.alert(
							'Не удалось проверить текст. Похоже, что изменились параметры входа в Литеру, например, специальный пароль. Пожалуйста, проверьте настройки плагина.'
						);
					} else {
						const text = isFunction(err.text) ? err.text() : err;
						if (!isNil(text)) {
							window.alert(
								`Во время проверки произошла непредвиденная ошибка: "${text}". Пожалуйста убедитесь, что сервер Литеры работает, плагин настроен правильно и у вас есть все необходимые права на работу с Литерой.`
							);
						} else {
							window.alert(
								'Во время проверки произошла непредвиденная ошибка. Пожалуйста убедитесь, что сервер Литеры работает, плагин настроен правильно и у вас есть все необходимые права на работу с Литерой.'
							);
						}
					}
					return {
						url: undefined,
					};
				});
			if (!isNil(resp.url)) {
				window.addEventListener('message', this.onMessage);
				this.showEditor(_mkIFrameUrl(cfg.server, resp.url));
			}
		}
	};

	createButton = () => {
		this.$btn = document.createElement('div');
		this.$btn.classList.add('l5-plugin-button');
		Ui.hide(this.$btn);
		this.$btn.innerHTML = Svg.logo;
		this.$btn.title = 'Проверить текст редактора в Литере';
		Ui.on(this.$btn).mouseenter(this.showButton).mouseleave(this.hideButton).click(this.onClickButton);
		document.body.appendChild(this.$btn);
	};

	removeButton = () => {
		if (this.$btn) {
			Ui.off(this.$btn).mouseenter(this.showButton).mouseleave(this.hideButton).click(this.onClickButton);
			this.$btn.remove();
			this.$btn = undefined;
		}
		Ui.off(this.$element).mouseenter(this.showButton).mouseleave(this.hideButton);
	};

	constructor(e: HTMLElement) {
		this.$element = e;
		this.createButton();
		Ui.on(this.$element).mouseenter(this.showButton).mouseleave(this.hideButton);
		this.count = 0;
	}
}

let editors: L5ButtonHandler[] = [];

function deinstrumentEditors() {
	editors.forEach(editor => {
		editor.removeButton();
	});
	editors = [];
}

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

function allowCheck(cfg: Config): boolean {
	const href = window.location.href.toLowerCase();
	const host = window.location.host;
	return !(href.startsWith(cfg.server) || host.match(/orfogrammka/) || host.match(/litera5/));
}

async function instrumentEditors() {
	const cfg = await getConfig();
	if (isConfigured(cfg) && allowCheck(cfg)) {
		const editors = findEditors();
		editors.forEach(instrumentEditor);
	}
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

	setInterval(instrumentEditors, 5000);

	await instrumentEditors();
	log.debug('setup >');
}

setup().then();

log.debug('Модуль проверки правописания загружен.');
