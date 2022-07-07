import '../styles/popup.scss';
import { getConfig, isConfigured } from './lib/Config';
import { Ext } from './lib/ext';
import { Logger } from './lib/logger';
import { Ui } from './lib/ui';

const log = Logger.get('L5 Popup');

async function setup() {
	const $ = {
		options: document.getElementById('go-to-options'),
		configured: document.getElementById('configured'),
		user: document.getElementById('user'),
		server: document.getElementById('server'),
		misconfigured: document.getElementById('misconfigured'),
	};
	Ui.on($.options).click(Ext.openOptionsPage);
	const cfg = await getConfig();
	if (isConfigured(cfg)) {
		Ui.show($.configured);
		Ui.innerText.set($.user, cfg.login);
		Ui.innerText.set($.server, cfg.server);
	} else {
		Ui.show($.misconfigured);
	}
}

setup().then(() => {
	log.debug('configured');
});
