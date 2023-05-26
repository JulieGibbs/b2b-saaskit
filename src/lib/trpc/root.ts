import type { AstroGlobal } from 'astro';

import { authRouter } from './routers/auth';
import { helloRouter } from './routers/hello';
import { promptsRouter } from './routers/prompts';
import { settingsRouter } from './routers/settings';
import { surveysRouter } from './routers/surveys';
import { createTRPCRouter, createTRPCServerSideHelpers } from './trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	hello: helloRouter,
	auth: authRouter,
	prompts: promptsRouter,
	settings: settingsRouter,
	surveys: surveysRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = appRouter.createCaller;
export const createServerSideHelpers = createTRPCServerSideHelpers(appRouter);
// short form for cases when you call it from .astro file
export const createHelpers = (Astro: AstroGlobal) =>
	createServerSideHelpers({
		req: Astro.request,
		resHeaders: Astro.response.headers,
	});
export type Helpers = ReturnType<typeof createHelpers>;
