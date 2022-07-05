import { isNil } from 'lodash';
import { createApi } from '../../litera5-api-js-client';
import { parseCompany, parseLogin } from './lib/api';
import { Logger } from './lib/logger';
import '../styles/options.scss';
import { getAutoConfig, getConfig, isConfigured, setAutoConfig, setConfig } from './lib/Config';
import { Config, State } from './lib/storage';

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
		message: {
			success: document.getElementById('message__success'),
			progress: document.getElementById('message__progress'),
			fail: document.getElementById('message__fail'),
		},
		status: {
			container: document.getElementById('status'),
			configured: document.getElementById('status__configured'),
			misconfigured: document.getElementById('status__misconfigured'),
		},
	};

	function successMessage() {
		$.message.success?.classList.remove('hidden');
		setTimeout(() => {
			$.message.success?.classList.add('hidden');
			$.status.container?.classList.remove('hidden');
		}, 10000);
	}

	function failMessage() {
		$.message.fail?.classList.remove('hidden');
		setTimeout(() => {
			$.message.fail?.classList.add('hidden');
			$.status.container?.classList.remove('hidden');
		}, 10000);
	}

	function progressMessageShow() {
		$.message.progress?.classList.remove('hidden');
	}

	function progressMessageHide() {
		$.message.progress?.classList.add('hidden');
	}

	async function testConfig(cfg: Config): Promise<boolean> {
		const api = createApi({
			company: parseCompany(cfg.login),
			userApiPassword: cfg.password,
			url: cfg.server,
		});
		return await api
			.userCheck({
				login: parseLogin(cfg.login),
				token: 'check-auth',
			})
			.then(() => true)
			.catch(() => false);
	}

	async function saveConfig(cfg: Config) {
		progressMessageShow();
		const goodCfg = await testConfig(cfg);
		if (goodCfg) {
			await setConfig({
				...cfg,
				state: State.active,
			});
			successMessage();
		} else {
			failMessage();
		}
		progressMessageHide();
	}

	async function onSaveClick() {
		$.status.container?.classList.add('hidden');
		const newCfg = {
			state: State.active,
			server: $.input.server.value,
			login: $.input.login.value,
			password: $.input.password.value,
		};
		await saveConfig(newCfg);
	}

	async function loadConfig() {
		const cfg = await getConfig();
		$.input.server.value = cfg.server;
		$.input.login.value = cfg.login;
		$.input.password.value = cfg.password;
		$.btn.save.addEventListener('click', onSaveClick);
		if (isConfigured(cfg)) {
			$.status.configured?.classList.remove('hidden');
			$.status.misconfigured?.classList.add('hidden');
		} else {
			$.status.configured?.classList.add('hidden');
			$.status.misconfigured?.classList.remove('hidden');
		}
	}

	await loadConfig();

	const auto = await getAutoConfig();

	async function closeAutoConfig() {
		$.auto.block?.classList.add('hidden');
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		await setAutoConfig(null!);
		await loadConfig();
	}

	async function onCancel() {
		await closeAutoConfig();
		$.status.container?.classList.remove('hidden');
	}

	async function onApply() {
		if (!isNil(auto)) {
			await saveConfig(auto);
			await closeAutoConfig();
		}
	}

	if (!isNil(auto)) {
		if ($.auto.origin) $.auto.origin.innerText = auto.origin;
		if ($.auto.server) $.auto.server.innerText = auto.server;
		if ($.auto.login) $.auto.login.innerText = auto.login;
		if ($.auto.password) $.auto.password.innerText = auto.password;
		$.auto.block?.classList.remove('hidden');
		$.status.container?.classList.add('hidden');
		$.auto.apply?.addEventListener('click', onApply);
		$.auto.cancel?.addEventListener('click', onCancel);
	} else {
		$.status.container?.classList.remove('hidden');
	}
}

setup().then(() => {
	log.debug('configured');
});
