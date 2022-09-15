import { isNil } from 'lodash';
import { createApi } from '../../litera5-api-js-client';
import { parseCompany, parseLogin } from './lib/api';
import { Logger } from './lib/logger';
import '../styles/options.scss';
import { getAutoConfig, getConfig, getState, isConfigured, setAutoConfig, setConfig, updateState } from './lib/Config';
import { AutoConfig, Config, State } from './lib/storage';
import { Ui } from './lib/ui';

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

	const state = {
		config: await getConfig(),
		state: await getState(),
		autoconfig: await getAutoConfig(),
	};

	function successMessage() {
		Ui.show($.message.success);
		setTimeout(() => {
			Ui.hide($.message.success);
			Ui.show($.status.container);
		}, 10000);
	}

	function failMessage() {
		Ui.show($.message.fail);
		setTimeout(() => {
			Ui.hide($.message.fail);
			Ui.show($.status.container);
		}, 10000);
	}

	function progressMessageShow() {
		Ui.show($.message.progress);
	}

	function progressMessageHide() {
		Ui.hide($.message.progress);
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
			await setConfig(cfg);
			await updateState(state => ({
				...state,
				isConfigured: true,
			}));
			successMessage();
		} else {
			failMessage();
		}
		progressMessageHide();
		invalidate();
	}

	async function onSaveClick() {
		Ui.hide($.status.container);
		const newCfg = {
			server: $.input.server.value,
			login: $.input.login.value,
			password: $.input.password.value,
		};
		await saveConfig(newCfg);
	}

	function invalidateConfig(cfg: Config) {
		$.input.server.value = cfg.server;
		$.input.login.value = cfg.login;
		$.input.password.value = cfg.password;
		Ui.on($.btn.save).click(onSaveClick);
	}

	function invalidateState(cfg: Config, state: State) {
		if (isConfigured(cfg, state)) {
			Ui.show($.status.configured);
			Ui.hide($.status.misconfigured);
		} else {
			Ui.hide($.status.configured);
			Ui.show($.status.misconfigured);
		}
	}

	function invalidateAutoConfig(auto?: AutoConfig) {
		if (!isNil(auto)) {
			Ui.innerText.set($.auto.origin, auto.origin);
			Ui.innerText.set($.auto.server, auto.server);
			Ui.innerText.set($.auto.login, auto.login);
			Ui.innerText.set($.auto.password, auto.password);
			Ui.show($.auto.block);
			Ui.hide($.status.container);
			Ui.on($.auto.apply).click(onApply);
			Ui.on($.auto.cancel).click(onCancel);
		} else {
			Ui.show($.status.container);
		}
	}

	async function invalidate() {
		state.config = await getConfig();
		state.state = await getState();
		state.autoconfig = await getAutoConfig();
		invalidateConfig(state.config);
		invalidateState(state.config, state.state);
		invalidateAutoConfig(state.autoconfig);
	}

	async function closeAutoConfig() {
		Ui.hide($.auto.block);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		await setAutoConfig(null!);
		await invalidate();
	}

	async function onCancel() {
		await closeAutoConfig();
		Ui.show($.status.container);
	}

	async function onApply() {
		if (!isNil(state.autoconfig)) {
			await saveConfig(state.autoconfig);
			await closeAutoConfig();
		}
	}

	await invalidate();

	setInterval(invalidate, 2000);
}

setup().then(() => {
	log.debug('configured');
});
