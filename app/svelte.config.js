import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		// GitHub Pages 정적 빌드용
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html', // SPA 라우팅 fallback
			precompress: false,
			strict: true
		}),
		// GitHub Pages: nury6942.github.io/the-atelier/ → paths.base = '/the-atelier'
		paths: {
			base: process.env.NODE_ENV === 'production' ? '/the-atelier' : ''
		}
	}
};

export default config;
