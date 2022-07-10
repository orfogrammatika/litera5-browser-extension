import { defer } from './defer';
import { Ui } from './ui';
import { gettext } from './ext';

export function showDialog(header: string, body: string, footer?: string): HTMLElement {
	const $div = document.createElement('div');
	$div.classList.add('l5-plugin-dialog');
	$div.innerHTML = `
<div class="l5-plugin-dialog__frame">
  <div class="l5-plugin-dialog__header">
  <button class="l5-plugin-dialog__cancel"></button>
  <h4 class="l5-plugin-dialog__title">${header}</h4>
  </div>
  <div class="l5-plugin-dialog__body">
  ${body}
  </div>
  ${footer ? `<div class="l5-plugin-dialog__footer">${footer}</div>` : ''}
</div>
`;
	Ui.on($div).click(event => {
		event.cancelBubble = true;
		event.stopImmediatePropagation();
		event.stopPropagation();
	});
	document.body.appendChild($div);
	return $div;
}

export function popupConfirm(title: string, msg: string): Promise<boolean> {
	const footer = `<button class="l5-plugin-dialog__button l5-plugin-dialog__button--primary l5-plugin-dialog__button--yes">${gettext(
		'popup__popupConfirm__yes'
	)}</button>
		<button class="l5-plugin-dialog__button l5-plugin-dialog__button--default l5-plugin-dialog__button--no">${gettext(
			'popup__popupConfirm__no'
		)}</button>`;
	const $dialog = showDialog(title, msg, footer);
	const $yes = $dialog.querySelector('.l5-plugin-dialog__button--yes');
	const $no = $dialog.querySelector('.l5-plugin-dialog__button--no');
	const $cancel = $dialog.querySelector('.l5-plugin-dialog__cancel');
	const res = defer<boolean>();
	const closeDialog = (value: boolean) => () => {
		$dialog.remove();
		res.resolve(value);
	};
	Ui.on($yes).click(closeDialog(true));
	Ui.on($no).click(closeDialog(false));
	Ui.on($cancel).click(closeDialog(false));
	Ui.on($dialog).click(closeDialog(false));
	return res.promise;
}

export function popupAlert(title: string, msg: string): Promise<void> {
	// const footer = '<button class="l5-plugin-dialog__button l5-plugin-dialog__button--close">Закрыть</button>';
	const $dialog = showDialog(title, msg);
	const res = defer<void>();
	const closeDialog = () => {
		$dialog.remove();
		res.resolve();
	};
	// const $close = $dialog.querySelector('.l5-plugin-dialog__button--close');
	const $cancel = $dialog.querySelector('.l5-plugin-dialog__cancel');
	// Ui.on($close).click(closeDialog);
	Ui.on($cancel).click(closeDialog);
	Ui.on($dialog).click(closeDialog);
	return res.promise;
}
