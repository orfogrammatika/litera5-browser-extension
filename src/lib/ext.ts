import InstalledDetails = chrome.runtime.InstalledDetails;
import MessageSender = chrome.runtime.MessageSender;

export const Ext = {
	openOptionsPage: () => {
		chrome.runtime.openOptionsPage();
	},
	sendMessage: (msg: unknown) => {
		chrome.runtime.sendMessage(msg);
	},
	on: {
		installed: (callback: (details: InstalledDetails) => void) => {
			chrome.runtime.onInstalled.addListener(callback);
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		message: (callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void) => {
			chrome.runtime.onMessage.addListener(callback);
		},
	},
	id: () => chrome.runtime.id,
};

export const Msg = {
	setup: 'setup',
	misconfigure: 'misconfigure',
};
