import { default as Logger } from 'js-logger';

Logger.useDefaults({
	defaultLevel: 'production' === process.env.NODE_ENV ? Logger.INFO : Logger.TRACE,
});

export { Logger };
