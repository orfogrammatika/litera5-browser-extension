import browser from 'webextension-polyfill';

export enum State {
	misconfigured = 'misconfigured',
	active = 'active',
}

export interface Config {
	server: string;
	login: string;
	password: string;
	state: State;
}

export interface AutoConfig extends Config {
	origin: string;
}

// Define your storage data here
export interface Storage {
	config: Config;
	autoconfig?: AutoConfig;
}

export function getStorageData(): Promise<Storage> {
	return browser.storage.sync.get() as Promise<Storage>;
}

export function setStorageData(data: Storage): Promise<void> {
	return browser.storage.sync.set(data);
}

export function getStorageItem<Key extends keyof Storage>(key: Key): Promise<Storage[Key]> {
	return browser.storage.sync.get([key]).then(res => res[key]);
}

export function setStorageItem<Key extends keyof Storage>(key: Key, value: Storage[Key]): Promise<void> {
	return browser.storage.sync.set({
		[key]: value,
	});
}

export async function initializeStorageWithDefaults(defaults: Storage) {
	const currentStorageData = await getStorageData();
	const newStorageData = Object.assign({}, defaults, currentStorageData);
	await setStorageData(newStorageData);
}
