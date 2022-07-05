export function parseCompany(login: string): string {
	const parts = login.split('@');
	if (parts.length === 2) {
		return parts[1];
	} else {
		return '';
	}
}

export function parseLogin(login: string): string {
	const parts = login.split('@');
	if (parts.length === 2) {
		return parts[0];
	} else {
		return '';
	}
}
