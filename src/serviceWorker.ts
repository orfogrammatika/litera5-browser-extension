import { setAutoConfig } from './lib/Config';
import { AutoConfig, initializeStorageWithDefaults } from './lib/storage';
import { Logger } from './lib/logger';

const log = Logger.get('L5 ServiceWorker');

log.debug('ServiceWorker loaded');

chrome.runtime.onInstalled.addListener(async () => {
	// Here goes everything you want to execute after extension initialization

	await initializeStorageWithDefaults({
		config: {
			server: 'https://litera5.ru',
			login: '',
			password: '',
		},
	});

	log.debug('Extension successfully installed!');
});

// Log storage changes, might be safely removed
chrome.storage.onChanged.addListener(changes => {
	for (const [key, value] of Object.entries(changes)) {
		log.debug(`"${key}" changed from`, value.oldValue, ' to ', value.newValue);
	}
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (sender.id === chrome.runtime.id) {
		switch (request.kind) {
			case 'setup':
				setAutoConfig(request.data as AutoConfig).then(() => {
					chrome.runtime.openOptionsPage();
					sendResponse(true);
				});
				break;
			default:
				sendResponse(false);
		}
	}
	return true;
});
