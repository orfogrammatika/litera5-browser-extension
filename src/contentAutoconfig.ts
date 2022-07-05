import { Logger } from './lib/logger';

const log = Logger.get('L5 Autoconfig');

function onPing() {
	document.dispatchEvent(new CustomEvent('litera5-plugin-pong'));
}

function onSetup(event: Event) {
	const ev = event as CustomEvent;
	chrome.runtime.sendMessage({
		kind: 'setup',
		data: {
			...ev.detail,
			origin: window.location.origin,
		},
	});
}

document.addEventListener('litera5-plugin-ping', onPing);
document.addEventListener('litera5-plugin-setup', onSetup);
document.dispatchEvent(new CustomEvent('litera5-plugin-pong'));

log.info('Модуль автоматической настройки плагина загружен.');
