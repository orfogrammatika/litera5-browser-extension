import { isEmpty } from 'lodash';
import { AutoConfig, Config, getStorageItem, setStorageItem, State } from './storage';

const keyConfig = 'config';
const keyState = 'state';
const keyAutoconfig = 'autoconfig';

export async function getConfig(): Promise<Config> {
	return getStorageItem(keyConfig);
}

export async function setConfig(value: Config) {
	return setStorageItem(keyConfig, value);
}

export async function getState(): Promise<State> {
	return getStorageItem(keyState);
}

export async function setState(value: State): Promise<void> {
	return setStorageItem(keyState, value);
}

export async function updateState(process: (state: State) => State): Promise<void> {
	const state = await getState();
	const res = process(state);
	return setState(res);
}

export function isConfigured(cfg: Config, state: State): boolean {
	return !(isEmpty(cfg.server) || isEmpty(cfg.login) || isEmpty(cfg.password)) && state.isConfigured;
}

export function isActive(cfg: Config, state: State): boolean {
	return !(isEmpty(cfg.server) || isEmpty(cfg.login) || isEmpty(cfg.password)) && state.isConfigured && !state.isPaused;
}

export async function getAutoConfig(): Promise<AutoConfig | undefined> {
	return getStorageItem(keyAutoconfig);
}

export async function setAutoConfig(value?: AutoConfig) {
	return setStorageItem(keyAutoconfig, value);
}
