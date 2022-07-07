import { getConfig, setAutoConfig, setConfig } from './lib/Config';
import { Ext, Msg } from './lib/ext';
import { AutoConfig, Config, initializeStorageWithDefaults, State } from './lib/storage';
import { Logger } from './lib/logger';

const log = Logger.get('L5 ServiceWorker');

log.debug('ServiceWorker loaded');

Ext.on.installed(async () => {
	// Here goes everything you want to execute after extension initialization

	await initializeStorageWithDefaults({
		config: {
			state: State.misconfigured,
			server: 'https://litera5.ru',
			login: '',
			password: '',
		},
	});

	log.debug('Extension successfully installed!');
});

Ext.on.message(async (request, sender, sendResponse) => {
	if (sender.id === Ext.id()) {
		let cfg: Config | undefined = undefined;
		switch (request.kind) {
			case Msg.setup:
				setAutoConfig(request.data as AutoConfig).then(() => {
					Ext.openOptionsPage();
					sendResponse(true);
				});
				break;
			case Msg.misconfigure:
				cfg = await getConfig();
				await setConfig({
					...cfg,
					state: State.misconfigured,
				});
				break;
			default:
				sendResponse(false);
		}
	}
	return true;
});
