import { getConfig, isConfigured } from './lib/Config';
import { Logger } from './lib/logger';
import '../styles/popup.scss';

const log = Logger.get('L5 Popup');

async function setup() {
	const $ = {
		options: document.getElementById('go-to-options'),
		configured: document.getElementById('configured'),
		misconfigured: document.getElementById('misconfigured'),
	};

	$.options.addEventListener('click', () => {
		chrome.runtime.openOptionsPage();
	});

	const cfg = await getConfig();
	if (isConfigured(cfg)) {
		$.configured.classList.remove('hidden');
	} else {
		$.misconfigured.classList.remove('hidden');
	}
}

setup().then(() => {
	log.debug('configured');
});
