import { setAutoConfig, updateState } from './lib/Config';
import { Ext, Msg } from './lib/ext';
import { Logger } from './lib/logger';
import { AutoConfig, initializeStorageWithDefaults } from './lib/storage';

const log = Logger.get('L5 ServiceWorker');

log.debug('ServiceWorker loaded');

Ext.on.installed(async () => {
	// Here goes everything you want to execute after extension initialization

	await initializeStorageWithDefaults({
		state: {
			isConfigured: false,
			isPaused: false,
		},
		config: {
			server: 'https://litera5.ru',
			login: '',
			password: '',
		},
	});

	log.debug('Extension successfully installed!');
});

Ext.on.message(async (request, sender) => {
	if (sender.id === Ext.id()) {
		switch (request.kind) {
			case Msg.setup:
				setAutoConfig(request.data as AutoConfig).then(() => {
					Ext.openOptionsPage();
				});
				break;
			case Msg.misconfigure:
				await updateState(state => ({
					...state,
					isConfigured: false,
				}));
				break;
			default:
		}
	}
});
