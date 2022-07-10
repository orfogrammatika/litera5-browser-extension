import { createApi } from 'litera5-api-js-client';
import { findIndex, isEqual, isFunction, isNil } from 'lodash';

import '../styles/contentSpellcheck.scss';
import { parseCompany, parseLogin } from './lib/api';
import { getConfig, isConfigured } from './lib/Config';
import {
	findEditors,
	getEditorContent,
	getEditorContentValue,
	getEditorMime,
	getEditorText,
	isEditorTextarea,
	setEditorContent,
} from './lib/editor';
import { Ext, Msg, gettext } from './lib/ext';
import { Logger } from './lib/logger';
import { popupAlert, popupConfirm, showDialog } from './lib/popup';
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

enum L5ButtonHandlerState {
	initial,
	checked,
}

class L5ButtonHandler {
	$element: HTMLElement;
	$btn?: HTMLElement;
	$div?: HTMLElement;
	count: number;
	state: L5ButtonHandlerState;
	text?: string;
	mime?: string;

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

	copyToClipboard = (): Promise<void> => {
		if (L5ButtonHandlerState.checked === this.state && this.text && this.mime) {
			const blob = new Blob([this.text], { type: this.mime });
			const clip = [new ClipboardItem({ [this.mime]: blob })];
			return navigator.clipboard.write(clip);
		} else {
			return Promise.reject();
		}
	};

	testEditorContent = ($element: HTMLElement, data: EditorSaveDetail) => {
		return async () => {
			const test = getEditorContent($element);
			const editorText = getEditorText($element, data.html);
			const dataTest = getEditorContentValue($element, editorText);
			if (isEqual(test, dataTest)) {
				this.state = L5ButtonHandlerState.initial;
				this.text = undefined;
				this.mime = undefined;
				if (this.$btn) {
					this.$btn.innerHTML = Svg.logo;
					this.$btn.title = gettext('contentSpellcheck__createButton__title__check');
				}
			} else {
				this.state = L5ButtonHandlerState.checked;
				this.text = editorText;
				this.mime = getEditorMime($element);
				if (this.$btn) {
					this.$btn.innerHTML = Svg.logoCheck;
					this.$btn.title = gettext('contentSpellcheck__createButton__title__result');
				}
				const perm = await navigator.permissions.query({
					// noinspection TypeScriptValidateTypes
					name: 'clipboard-write',
				});
				if ('granted' === perm.state || 'prompt' === perm.state) {
					const confirmed = await popupConfirm(
						gettext('contentSpellcheck__testEditorContent__confirmCopyClipboardOnInsertError__title'),
						gettext('contentSpellcheck__testEditorContent__confirmCopyClipboardOnInsertError__message')
					);
					if (confirmed) {
						this.copyToClipboard()
							.then(async () => {
								await popupAlert(
									gettext('contentSpellcheck__testEditorContent__alertClipboardCopySuccess__title'),
									gettext('contentSpellcheck__testEditorContent__alertClipboardCopySuccess__message')
								);
							})
							.catch(async () => {
								await popupAlert(
									gettext('contentSpellcheck__testEditorContent__alertClipboardCopyError__title'),
									gettext('contentSpellcheck__testEditorContent__alertClipboardCopyError__message')
								);
							});
					} else {
						await popupAlert(
							gettext('contentSpellcheck__testEditorContent__alertUserRejectedCopy__title'),
							gettext('contentSpellcheck__testEditorContent__alertUserRejectedCopy__message')
						);
					}
				} else {
					await popupAlert(
						gettext('contentSpellcheck__testEditorContent__alertClipboardAccessDenied__title'),
						gettext('contentSpellcheck__testEditorContent__alertClipboardAccessDenied__message')
					);
				}
			}
		};
	};

	saveEditor = (data: EditorSaveDetail) => {
		log.debug('saveEditor data:', data);
		this.closeEditor();
		setEditorContent(this.$element, data.html);
		setTimeout(this.testEditorContent(this.$element, data), 100);
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
		$btn.title = gettext('contentSpellcheck__showEditor__closeButton__title');
		$iframe.src = url;
		$div.appendChild($iframe);
		$div.appendChild($btn);
		document.body.appendChild($div);
		this.$div = $div;
	};

	onClickButton = async () => {
		switch (this.state) {
			case L5ButtonHandlerState.initial:
				await this.checkText();
				break;
			case L5ButtonHandlerState.checked:
				await this.showResults();
				break;
		}
	};

	showResults = async () => {
		const footer = `<button class="l5-plugin-dialog__button l5-plugin-dialog__button--default l5-plugin-dialog__button--clip">${gettext(
			'contentSpellcheck__showResults__clipButton__caption'
		)}</button>
			<button class="l5-plugin-dialog__button l5-plugin-dialog__button--primary l5-plugin-dialog__button--recheck">${gettext(
				'contentSpellcheck__showResults__recheckButton__caption'
			)}</button>`;
		const body = isEditorTextarea(this.$element)
			? `<textarea readonly class="l5-plugin-dialog__results">${this.text}</textarea>`
			: `<div class="l5-plugin-dialog__results">${this.text}</div>`;
		const $dialog = showDialog(gettext('contentSpellcheck__showResults__title'), body, footer);
		const $clip = $dialog.querySelector('.l5-plugin-dialog__button--clip');
		const $recheck = $dialog.querySelector('.l5-plugin-dialog__button--recheck');
		const $cancel = $dialog.querySelector('.l5-plugin-dialog__cancel');
		const $res = $dialog.querySelector('.l5-plugin-dialog__results');

		const selectAll = () => {
			if ($res && window.getSelection) {
				const range = document.createRange();
				range.selectNode($res);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
			}
		};

		const closeDialog = () => $dialog.remove();

		Ui.on($clip).click(() => {
			this.copyToClipboard()
				.then(() => {
					closeDialog();
					popupAlert(
						gettext('contentSpellcheck__showResults__alertCopySuccess__title'),
						gettext('contentSpellcheck__showResults__alertCopySuccess__message')
					);
				})
				.catch(() => {
					window.alert(
						`${gettext('contentSpellcheck__showResults__alertCopyError__title')}. ${gettext(
							'contentSpellcheck__showResults__alertCopyError__message'
						)}`
					);
				});
		});
		Ui.on($recheck).click(() => {
			closeDialog();
		});
		Ui.on($cancel).click(closeDialog);
		Ui.on($dialog).click(closeDialog);
		Ui.on($res).click(selectAll);

		selectAll();
	};

	checkText = async () => {
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
						popupAlert(
							gettext('contentSpellcheck__checkText__apiErrorUnauthenticated__title'),
							gettext('contentSpellcheck__checkText__apiErrorUnauthenticated__message')
						);
					} else {
						const text = isFunction(err.text) ? err.text() : err;
						if (!isNil(text)) {
							popupAlert(
								gettext('contentSpellcheck__checkText__apiErrorDetailed__title'),
								gettext('contentSpellcheck__checkText__apiErrorDetailed__message', [text])
							);
						} else {
							popupAlert(
								gettext('contentSpellcheck__checkText__apiErrorGeneric__title'),
								gettext('contentSpellcheck__checkText__apiErrorGeneric__message')
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
		this.$btn.title = gettext('contentSpellcheck__createButton__title__check');
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
		this.state = L5ButtonHandlerState.initial;
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
