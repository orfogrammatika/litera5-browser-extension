import { isEmpty } from 'lodash';
import { AutoConfig, Config, getStorageItem, setStorageItem } from './storage';

const key = 'config';
const autoKey = 'autoconfig';

export async function getConfig(): Promise<Config> {
	return getStorageItem(key);
}

export async function setConfig(value: Config) {
	return setStorageItem(key, value);
}

export function isConfigured(cfg: Config): boolean {
	return !(isEmpty(cfg.server) || isEmpty(cfg.login) || isEmpty(cfg.password));
}

export async function getAutoConfig(): Promise<AutoConfig> {
	return getStorageItem(autoKey);
}

export async function setAutoConfig(value: AutoConfig) {
	return setStorageItem(autoKey, value);
}
