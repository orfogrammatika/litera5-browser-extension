/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Deferred<T> {
	promise: Promise<T>;
	resolve: (value: T | PromiseLike<T>) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	reject: (reason: any) => void;
}

export function defer<T>(): Deferred<T> {
	const res: any = {};
	const promise = new Promise<T>((resolve, reject) => {
		res.resolve = resolve;
		res.reject = reject;
	});
	return {
		promise,
		resolve: res.resolve,
		reject: res.reject,
	};
}
