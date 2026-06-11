import type { Post, Profile } from './api';

export type GameState = 'input' | 'loading' | 'playing' | 'complete';

export interface OrbData {
	id: number;
	post: Post;
	author: Profile;
	position: { x: number; z: number };
	collected: boolean;
	textureUrl: string | null;
}

// Global game state using Svelte 5 runes
class GameStore {
	state = $state<GameState>('input');
	handle = $state('');
	error = $state('');
	score = $state(0);
	orbs = $state<OrbData[]>([]);
	playerPosition = $state({ x: 0, z: 0 });
	targetOrbs = $state(0);

	playerName = $state('Player');
	playerAvatar = $state<string | null>(null);

	reset() {
		this.state = 'input';
		this.handle = '';
		this.error = '';
		this.score = 0;
		this.orbs = [];
		this.playerPosition = { x: 0, z: 0 };
		this.targetOrbs = 0;
		this.playerName = 'Player';
		this.playerAvatar = null;
	}

	collectOrb(id: number) {
		const orb = this.orbs.find((o) => o.id === id);
		if (orb && !orb.collected) {
			orb.collected = true;
			this.score++;
			if (this.score >= this.targetOrbs) {
				this.state = 'complete';
			}
		}
	}
}

export const game = new GameStore();
