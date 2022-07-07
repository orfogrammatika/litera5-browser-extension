import { concat, filter, has } from 'lodash';
import { Logger } from './logger';

const log = Logger.get('L5 Editor');

function isVisible(elem: HTMLElement): boolean {
	return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

function isEditorContainer(elem: HTMLIFrameElement): boolean {
	return (
		(elem && elem.contentDocument && elem.contentDocument.body && elem.contentDocument.body.isContentEditable) || false
	);
}

function isCK5Editor(elem: HTMLElement): boolean {
	return elem.classList.contains('ck-editor__editable') && has(elem, 'ckeditorInstance');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setCK5Content(elem: any, content: string): void {
	const ed = elem.ckeditorInstance;
	if (ed) {
		ed.execute('selectAll');
		const viewFragment = ed.data.processor.toView(content);
		const modelFragment = ed.data.toModel(viewFragment);
		ed.model.insertContent(modelFragment);
		ed.editing.view.scrollToTheSelection();
	}
}

/**
 * Возвращает список элементов текстовых редакторов, к которым нужно добавить элементы управления Литеры
 */
export function findEditors(): HTMLElement[] {
	log.debug('findEditors <');
	const textareas = document.getElementsByTagName('textarea');
	const iframes = document.getElementsByTagName('iframe');
	const contenteditables = document.querySelectorAll('[contenteditable=true]');
	const result: HTMLElement[] = concat(
		filter(textareas, isVisible),
		filter(iframes, isEditorContainer),
		filter(contenteditables, isVisible)
	) as HTMLElement[];
	log.debug('findEditors >', result);
	return result;
}

/**
 * Возвращает содержимое редактора для отправки на проверку
 * @param element элемент, содержимое которого необходимо добыть
 */
export function getEditorContent(element: HTMLElement): string {
	log.debug('getEditorContent < element=', element);
	let result = '';
	if ('textarea' === element.tagName.toLowerCase()) {
		result = `<pre style="white-space: pre-wrap;">${(element as HTMLTextAreaElement).value}</pre>`;
	} else if ('true' === element.getAttribute('contenteditable')?.toLowerCase()) {
		result = element.innerHTML;
	} else if (isEditorContainer(element as HTMLIFrameElement)) {
		result = (element as HTMLIFrameElement).contentDocument?.body.innerHTML ?? '';
	}
	log.debug('getEditorContent >', result);
	return result;
}

/**
 * Устанавливает содержимое редактора в текстовое поле
 * @param element
 * @param content
 */
export function setEditorContent(element: HTMLElement, content: string): void {
	log.debug('setEditorContent < element=', element, 'content=', content);
	if ('textarea' === element.tagName.toLowerCase()) {
		(element as HTMLTextAreaElement).value = content
			.replace(/^<pre style="white-space: pre-wrap;">/, '')
			.replace(/<\/pre>\s*$/, '')
			.replace(/<br>/g, '\n');
	} else if ('true' === element.getAttribute('contenteditable')?.toLowerCase()) {
		if (isCK5Editor(element)) {
			setCK5Content(element, content);
		} else {
			element.innerHTML = content;
		}
	} else if (isEditorContainer(element as HTMLIFrameElement)) {
		const doc = (element as HTMLIFrameElement).contentDocument;
		if (doc) {
			doc.body.innerHTML = content;
		}
	}
	log.debug('setEditorContent >');
}
