import { Logger } from './lib/logger';

const log = Logger.get('L5 Autoconfig');

log.debug('Autoconfig loaded');

function onPing() {
	document.dispatchEvent(new CustomEvent('litera5-plugin-pong'));
}

function onSetup(event: CustomEvent) {
	chrome.runtime.sendMessage({
		kind: 'setup',
		data: {
			...event.detail,
			origin: window.location.origin,
		},
	});
}

document.addEventListener('litera5-plugin-ping', onPing);
document.addEventListener('litera5-plugin-setup', onSetup);
document.dispatchEvent(new CustomEvent('litera5-plugin-pong'));
