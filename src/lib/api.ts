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

/** Check if 'subject' follows 'target' by scanning subject's follow list */
async function checkFollows(subjectDid: string, targetDid: string): Promise<boolean> {
	try {
		const res = await fetch(
			`https://public.api.bsky.app/xrpc/app.bsky.graph.getFollows?actor=${subjectDid}&limit=100`
		);
		if (!res.ok) return false;
		const json = await res.json();
		return (json.follows || []).some((f: any) => f.did === targetDid);
	} catch {
		return false;
	}
}

/**
 * Get mutual follows — people BOTH following and followed by the given DID.
 * We fetch the user's follows, then for each one check if they follow back.
 * Runs up to 20 concurrent checks; stops early once we have enough mutuals.
 */
export async function getMutualFollows(did: string, limit = 10): Promise<Profile[]> {
	// Fetch a larger pool of the user's follows to check for mutuals
	const follows = await getFollows(did, 80);
	if (follows.length === 0) return [];

	const mutuals: Profile[] = [];

	// Check in batches of 20 concurrent
	for (let i = 0; i < follows.length && mutuals.length < limit; i += 20) {
		const batch = follows.slice(i, i + 20);
		const results = await Promise.all(
			batch.map(async (profile) => {
				const isMutual = await checkFollows(profile.did, did);
				return isMutual ? profile : null;
			})
		);
		for (const r of results) {
			if (r && mutuals.length < limit) mutuals.push(r);
		}
	}

	return mutuals;
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
