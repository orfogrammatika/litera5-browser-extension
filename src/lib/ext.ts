import browser from 'webextension-polyfill';

export const Ext = {
	openOptionsPage: () => {
		browser.runtime.openOptionsPage().then();
	},
	sendMessage: (msg: unknown) => {
		browser.runtime.sendMessage(msg).then();
	},
	on: {
		installed: (callback: (details: browser.Runtime.OnInstalledDetailsType) => void) => {
			browser.runtime.onInstalled.addListener(callback);
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		message: (callback: (message: any, sender: browser.Runtime.MessageSender) => void) => {
			browser.runtime.onMessage.addListener(callback);
		},
	},
	id: () => browser.runtime.id,
};

export const Msg = {
	setup: 'setup',
	misconfigure: 'misconfigure',
};
