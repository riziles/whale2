export interface Profile {
	did: string;
	handle: string;
	displayName: string;
	avatar: string;
}

export async function resolveHandle(handle: string): Promise<string> {
	const res = await fetch(
		`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
	);
	if (!res.ok) throw new Error('Handle not found');
	const json = await res.json();
	return json.did;
}

export async function getFollows(did: string, limit = 10): Promise<Profile[]> {
	const res = await fetch(
		`https://public.api.bsky.app/xrpc/app.bsky.graph.getFollows?actor=${did}&limit=${limit}`
	);
	if (!res.ok) throw new Error('Failed to fetch follows');
	const json = await res.json();
	return (json.follows || []).map((f: any) => ({
		did: f.did,
		handle: f.handle,
		displayName: f.displayName || '',
		avatar: f.avatar || ''
	} as Profile));
}


/** Rewrite cdn.bsky.app URLs through local proxy in dev mode */
export function avatarUrl(cdnUrl: string): string {
	if (typeof window === 'undefined') return cdnUrl;
	if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
		return cdnUrl.replace('https://cdn.bsky.app/img/avatar/', '/avatar/');
	}
	return cdnUrl;
}

export async function getProfile(did: string): Promise<Profile> {
	const res = await fetch(
		`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${did}`
	);
	if (!res.ok) throw new Error('Profile not found');
	const json = await res.json();
	return {
		did: json.did,
		handle: json.handle,
		displayName: json.displayName || '',
		avatar: json.avatar || ''
	};
}
