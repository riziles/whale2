export interface Profile {
	did: string;
	handle: string;
	displayName: string;
	avatar: string;
}

export interface Post {
	uri: string;
	cid: string;
	author: Profile;
	record: {
		text: string;
		createdAt: string;
	};
}

export async function resolveHandle(handle: string): Promise<string> {
	const res = await fetch(
		`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`
	);
	if (!res.ok) throw new Error('Handle not found');
	const json = await res.json();
	return json.did;
}

export async function getLikes(did: string, limit = 10): Promise<Post[]> {
	const res = await fetch(
		`https://public.api.bsky.app/xrpc/app.bsky.feed.getActorLikes?actor=${did}&limit=${limit}`
	);
	if (!res.ok) throw new Error('Failed to fetch likes');
	const json = await res.json();
	return (json.feed || []).map((f: any) => f.post as Post);
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
