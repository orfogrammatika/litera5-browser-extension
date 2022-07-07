import { Ext, Msg } from './lib/ext';
import { Logger } from './lib/logger';
import { Ui } from './lib/ui';

const log = Logger.get('L5 Autoconfig');

function onPing() {
	document.dispatchEvent(new CustomEvent('litera5-plugin-pong'));
}

function onSetup(event: Event) {
	const ev = event as CustomEvent;
	Ext.sendMessage({
		kind: Msg.setup,
		data: {
			...ev.detail,
			origin: window.location.origin,
		},
	});
}

Ui.on(document).custom('litera5-plugin-ping', onPing).custom('litera5-plugin-setup', onSetup);
document.dispatchEvent(new CustomEvent('litera5-plugin-pong'));

log.info('Модуль автоматической настройки плагина загружен.');
