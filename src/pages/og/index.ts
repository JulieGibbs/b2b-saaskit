// MIT License
// Copyright (c) 2022 Shoubhit Dash
// https://github.com/t3-oss/create-t3-app/blob/next/LICENSE

import { Resvg } from '@resvg/resvg-js';
import type { APIRoute } from 'astro';
import satori from 'satori';

import { websiteDescription, websiteTitle } from '../../constants';
import { getFont } from './_getFonts';
import OpenGraph from './_openGraph';
import OpenGraphPrompt from './_openGraphPrompt';

export const prerender = false;

export const get: APIRoute = async (request) => {
	const params = request.url.searchParams;
	const kind = params.get('kind') as 'prompt' | null;
	const title = params.get('title') ?? websiteTitle;
	const description = params.get('description') ?? websiteDescription;
	const chatTemplate = params.get('chatTemplate');

	const Montserrat = await getFont({
		family: 'Montserrat',
		weights: [600] as const,
	});

	const svg = await satori(
		kind === 'prompt'
			? OpenGraphPrompt({
					title,
					description,
					chatTemplate,
					originUrl: request.url.origin,
			  })
			: OpenGraph({
					title,
					description,
					originUrl: request.url.origin,
			  }),
		{
			width: 1200,
			height: 630,
			fonts: [
				//
				{ name: 'Montserrat', data: Montserrat[600], weight: 600 },
			],
			debug: import.meta.env.DEBUG_OG === 'true',
		}
	);

	const resvg = new Resvg(svg, {});
	const pngData = resvg.render();
	const pngBuffer = pngData.asPng();

	return new Response(pngBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'cache-control': import.meta.env.DEV ? 'no-store' : 'public, max-age=31536000, immutable',
		},
	});
};

export function getGeneratorUrl({
	origin,
	title,
	description,
}: {
	origin: string;
	title: string;
	description?: string;
}) {
	const search = new URLSearchParams();
	if (title) {
		search.set('title', title);
	}
	if (description) {
		search.set('description', description);
	}
	const imageUrl = new URL('/og?' + search.toString(), origin);
	return imageUrl.toString();
}

export function getGeneratorForPromptUrl({
	origin,
	title,
	description,
	chatTemplate,
}: {
	origin: string;
	title: string;
	description?: string;
	chatTemplate?: string;
}) {
	const search = new URLSearchParams();
	search.set('kind', 'prompt');
	if (title) {
		search.set('title', title);
	}
	if (description) {
		search.set('description', description);
	}
	if (chatTemplate) {
		search.set('chatTemplate', chatTemplate);
	}
	const imageUrl = new URL('/og?' + search.toString(), origin);
	return imageUrl.toString();
}
