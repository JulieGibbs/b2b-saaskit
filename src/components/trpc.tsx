import { DehydratedState, Hydrate, QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { useState } from 'react';
import superjson from 'superjson';

import type { AppRouter } from '../lib/trpc/root';
import { QueryProvider } from './client';

// eslint-disable-next-line react-refresh/only-export-components
export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({
	children,
	dehydratedState,
}: {
	children: React.ReactNode;
	dehydratedState?: DehydratedState;
}) {
	const [queryClient] = useState(() => new QueryClient());
	const [trpcClient] = useState(() =>
		trpc.createClient({
			transformer: superjson,
			links: [
				httpBatchLink({
					url: '/api/trpc',
					// You can pass any HTTP headers you wish here
					headers() {
						return {
							authorization: 'getAuthCookie()',
						};
					},
				}),
			],
		})
	);
	// TODO: we should be passing dehydratedState to trpcClient not queryClient
	const state = dehydratedState ? superjson.deserialize(dehydratedState as any) : undefined;
	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryProvider queryClient={queryClient}>
				<Hydrate state={state}>{children}</Hydrate>
			</QueryProvider>
		</trpc.Provider>
	);
}

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export type RouterUtils = ReturnType<typeof trpc.useContext>;
