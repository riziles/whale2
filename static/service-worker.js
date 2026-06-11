// Service worker that adds CORS headers to cdn.bsky.app responses.
// This lets Three.js TextureLoader load avatar images without CORS errors.

self.addEventListener('fetch', function(event) {
	var url = new URL(event.request.url);
	if (url.hostname === 'cdn.bsky.app') {
		event.respondWith(
			fetch(event.request).then(function(response) {
				var headers = new Headers(response.headers);
				headers.set('Access-Control-Allow-Origin', '*');
				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: headers
				});
			})
		);
	}
});
