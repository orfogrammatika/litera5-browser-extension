import { isNil } from 'lodash';
import { Logger } from './lib/logger';
import '../styles/options.scss';
import { getAutoConfig, getConfig, setAutoConfig, setConfig } from './lib/Config';

const log = Logger.get('L5 Options');

async function setup() {
	const $ = {
		input: {
			server: document.getElementById('input-server') as HTMLInputElement,
			login: document.getElementById('input-login') as HTMLInputElement,
			password: document.getElementById('input-password') as HTMLInputElement,
		},
		btn: {
			save: document.getElementById('btn-save') as HTMLButtonElement,
		},
		auto: {
			block: document.getElementById('autoconfigure'),
			origin: document.getElementById('autoconfigure__origin'),
			server: document.getElementById('autoconfigure__server'),
			login: document.getElementById('autoconfigure__login'),
			password: document.getElementById('autoconfigure__password'),
			apply: document.getElementById('autoconfigure__apply'),
			cancel: document.getElementById('autoconfigure__cancel'),
		},
		message: document.getElementById('message'),
	};

	function successMessage() {
		$.message.classList.remove('hidden');
	}

	async function onSaveClick() {
		await setConfig({
			server: $.input.server.value,
			login: $.input.login.value,
			password: $.input.password.value,
		});
		successMessage();
	}

	async function loadConfig() {
		const cfg = await getConfig();
		$.input.server.value = cfg.server;
		$.input.login.value = cfg.login;
		$.input.password.value = cfg.password;
		$.btn.save.addEventListener('click', onSaveClick);
	}

	await loadConfig();

	const auto = await getAutoConfig();

	async function onCancel() {
		$.auto.block.classList.add('hidden');
		await setAutoConfig(null);
		await loadConfig();
		window.close();
	}

	async function onApply() {
		await setConfig(auto);
		successMessage();
		await onCancel();
	}

	if (!isNil(auto)) {
		$.auto.origin.innerText = auto.origin;
		$.auto.server.innerText = auto.server;
		$.auto.login.innerText = auto.login;
		$.auto.password.innerText = auto.password;
		$.auto.block.classList.remove('hidden');
		$.auto.apply.addEventListener('click', onApply);
		$.auto.cancel.addEventListener('click', onCancel);
	}
}

setup().then(() => {
	log.debug('configured');
});
