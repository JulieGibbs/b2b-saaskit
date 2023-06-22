import type { UseAuthInfoLoggedInProps } from '@propelauth/react/types/useAuthInfo';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import clsx from 'clsx';
import { useReducer, useState } from 'react';

import { env } from '../../config';
import { websiteTitle } from '../../constants';
import { apiServer, useMutation } from '../client';
import { useRequireActiveOrg } from '../propelauth';
import { useAuthInfo } from '../propelauth';
import { trpc } from '../trpc';
import { Layout } from './Layout';

export function Settings() {
	const { activeOrg } = useRequireActiveOrg();
	const orgId = activeOrg?.orgId;

	const keysQuery = trpc.settings.getKeys.useQuery(
		{ orgId: orgId || '' },
		{
			enabled: !!orgId,
			staleTime: 1000,
		}
	);

	const { data: subscriptions } = trpc.settings.getSubscriptions.useQuery(
		{ orgId: orgId || '' },
		{
			enabled: !!orgId,
			staleTime: 1000,
		}
	);

	const { data: stripeConfigured } = trpc.settings.stripeConfigured.useQuery(
		{},
		{
			enabled: !!orgId,
			staleTime: 1000,
		}
	);

	const queryClient = useQueryClient();
	const addKeyMutation = trpc.settings.createKey.useMutation({
		onSettled: () => {
			queryClient.invalidateQueries(getQueryKey(trpc.settings.getKeys));
		},
	});
	const deleteKeyMutation = trpc.settings.deleteKey.useMutation({
		onSuccess: (data) => {
			queryClient.setQueryData(
				getQueryKey(trpc.settings.getKeys, undefined, 'query'),
				(oldData: typeof keysQuery.data) => oldData?.filter((item) => item.keyId !== data.keyId)
			);
		},
		onSettled: () => {
			queryClient.invalidateQueries(getQueryKey(trpc.settings.getKeys));
		},
	});

	const [showAddKey, toggleShowAddKey] = useReducer((state) => !state, false);

	const [submitOk, setSubmitOk] = useState(false);

	const auth = useAuthInfo();

	const createCheckoutSessionMutation = useMutation({
		mutationFn: ({ auth }: { auth: UseAuthInfoLoggedInProps }) =>
			apiServer
				.url('/api/create-checkout-session')
				.auth('Bearer ' + auth.accessToken)
				.json({ orgId: activeOrg?.orgId })
				.post()
				.json<{ url: string }>(),
		cacheTime: 0,
		onSuccess: ({ url }) => {
			location.assign(url);
		},
	});

	return (
		<Layout title={`${websiteTitle} / Settings`}>
			{stripeConfigured ? (
				<div className="mt-4">
					In order to run prompts, you can either add your OpenAI key below, or purchase a
					subscription.
				</div>
			) : (
				<div className="mt-4">In order to run prompts, you have to add your OpenAI key below.</div>
			)}
			<div className="mt-4 rounded-md border border-gray-300 px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex w-full flex-col items-center justify-center">
					<div className="flex w-full flex-col gap-2 text-start">
						<div className="sm:flex sm:items-center">
							<div className="sm:flex-auto">
								<h1 className="text-xl font-medium">Configure your OpenAI key</h1>
								<p className="mt-2 w-full text-sm text-gray-700 md:w-2/3">
									Create an OpenAI key by signing up for OpenAI and going to the{' '}
									<a
										className="text-blue-700 underline visited:text-purple-600 hover:text-rose-600"
										href="https://platform.openai.com/account/api-keys"
									>
										API keys
									</a>{' '}
									page.
								</p>
								<p className="mt-2 w-full text-sm text-gray-700 md:w-2/3">
									Keep in mind that having your key here will allow anyone in your{' '}
									<a
										className="text-blue-700 underline visited:text-purple-600 hover:text-rose-600"
										href={env.PUBLIC_AUTH_URL + '/org'}
									>
										Prompts with Friends organization
									</a>{' '}
									to run OpenAI calls against your OpenAI account budget.
								</p>
							</div>
							<div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
								<button
									type="button"
									className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
									onClick={toggleShowAddKey}
								>
									{showAddKey ? 'Cancel' : keysQuery.data?.length ? 'Replace Key' : 'Add Key'}
								</button>
							</div>
						</div>
						{showAddKey && (
							<form
								className="mt-4 flex flex-col gap-2 rounded-md border border-gray-300 p-2"
								onSubmit={(e) => {
									e.preventDefault();
									const form = e.currentTarget;
									const formData = new FormData(form);
									addKeyMutation.mutate(Object.fromEntries(formData) as any, {
										onSuccess: () => {
											form.reset();
										},
									});
								}}
							>
								<label className="text-gray-800" htmlFor="keySecret">
									Secret Key{' '}
									<span className="text-gray-600">
										(get{' '}
										<a
											className="text-blue-700 underline visited:text-purple-600 hover:text-rose-600"
											href="https://platform.openai.com/account/api-keys"
										>
											here
										</a>
										)
									</span>
								</label>
								<input type="hidden" name="orgId" value={orgId} />
								<input
									onChange={(e) => setSubmitOk(e.target.value.trim().length > 0)}
									className="rounded-md border border-gray-300 p-2"
									type="text"
									id="keySecret"
									name="keySecret"
									autoFocus
								/>
								<label className="text-gray-800" htmlFor="keyType">
									GPT version{' '}
									<span className="text-gray-600">(select GPT-4 if you have access to it)</span>
								</label>
								<select
									id="keyType"
									name="keyType"
									className="mt-2 block h-[42px] rounded-md border-0 px-3 py-1.5 text-gray-900 accent-indigo-600 ring-1 ring-inset ring-gray-300 focus:outline-indigo-500 focus:ring-indigo-600 sm:text-sm sm:leading-6"
								>
									<option value="gpt-3">GPT-3.5</option>
									<option value="gpt-4">GPT-4</option>
								</select>
								<button
									className="max-w-min rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
									type="submit"
									disabled={submitOk === false || addKeyMutation.isLoading}
								>
									{addKeyMutation.isLoading
										? 'Saving...'
										: keysQuery.data?.length
										? 'Replace'
										: 'Save'}
								</button>
								{addKeyMutation.isError && (
									<div>
										Error!{' '}
										{addKeyMutation.error.data?.zodError && (
											<pre>{JSON.stringify(addKeyMutation.error.data.zodError, null, 2)}</pre>
										)}
									</div>
								)}
							</form>
						)}
					</div>
					<div className="space-between mt-4 flex w-full flex-col gap-4 divide-y divide-gray-200 rounded-lg border border-gray-200 pb-4">
						<div className="flex w-full flex-row px-6 pb-2 pt-6">
							<div className="flex flex-col">
								<h2 className="text-lg font-medium">Org-wide OpenAI key</h2>
								<p className="text-sm text-gray-600">
									By using this app, everyone in your Prompts with Friends organization can use the
									OpenAI budget associated with this key
								</p>
							</div>
						</div>
						<div className="space-between flex w-full flex-row gap-4 overflow-y-auto">
							<table className="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										<th
											scope="col"
											className="px-3 py-3.5 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
										>
											Key
										</th>
										<th
											scope="col"
											className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
										>
											Type
										</th>
										<th
											scope="col"
											className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
										>
											Added
										</th>
										<th
											scope="col"
											className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
										>
											Last used
										</th>
										<th scope="col">
											<span className="sr-only">Actions</span>
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-200 bg-white">
									{keysQuery.isLoading && (
										<tr>
											<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
												Loading...
											</td>
										</tr>
									)}
									{!keysQuery.isLoading && keysQuery.data?.length === 0 && (
										<tr>
											<td className="break-all py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
												No keys are configured.{' '}
												<button
													className="text-blue-700 hover:text-rose-600"
													onClick={(e) => {
														e.preventDefault();
														toggleShowAddKey();
													}}
												>
													Add one
												</button>{' '}
												to start using prompts.
											</td>
										</tr>
									)}
									{keysQuery.data?.map((key, index) => (
										<tr
											key={key.keyId}
											className={clsx(
												index % 2 === 0 && 'bg-gray-50',
												deleteKeyMutation.isLoading &&
													deleteKeyMutation.variables?.keyId === key.keyId &&
													'opacity-50'
											)}
										>
											<td className="break-all py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
												{key.keyPublic}
											</td>
											<td className="break-all px-3 py-4 text-sm text-gray-500">{key.keyType}</td>
											<td className="break-all px-3 py-4 text-sm text-gray-500">
												{key.createdAt.toLocaleString()}
											</td>
											<td className="break-all px-3 py-4 text-sm text-gray-500">
												{key.lastUsedAt ? key.lastUsedAt.toLocaleString() : 'Never'}
											</td>
											<td className="relative flex justify-end gap-2 break-all py-4 pr-4 text-sm font-medium">
												<button
													type="button"
													className="p-1 text-indigo-600 hover:text-indigo-900 focus:outline-indigo-500"
													onClick={() => {
														const confirm = window.confirm(
															'Are you sure you want to delete this key?'
														);
														if (confirm) {
															deleteKeyMutation.mutate({ keyId: key.keyId });
														}
													}}
												>
													Delete
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>
			{stripeConfigured && (
				<div className="mt-4 rounded-md border border-gray-300 px-4 py-8 sm:px-6 lg:px-8">
					<div className="flex w-full flex-col items-center justify-center">
						<div className="flex w-full flex-col gap-2 text-start">
							<div className="sm:flex sm:items-center">
								<div className="sm:flex-auto">
									<h1 className="text-xl font-medium">Subscriptions</h1>
									<div className="mt-4 flex flex-col gap-4">
										<button
											className="block w-60 rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
											onClick={() => {
												if (auth.loading === false && auth.isLoggedIn) {
													createCheckoutSessionMutation.mutate({ auth });
												}
											}}
										>
											Subscribe for $69/month
										</button>
										{(subscriptions?.length || 0) > 0 && (
											<div className="flex flex-col gap-4">
												{subscriptions?.map((s, i) => (
													<div
														key={`${s.email}-${i}`}
														className="flex flex-col rounded-md border border-gray-300 p-4"
													>
														<span>{s.email}</span>
														{s.active ? (
															<span className="text-green-500">Active</span>
														) : (
															<span className="text-rose-500">Inactive</span>
														)}
														{s.cancelAtEpochSec && (
															<span>
																Will cancel on {new Date(s.cancelAtEpochSec * 1000).toString()}
															</span>
														)}
														<a
															className="text-blue-700 underline visited:text-purple-600 hover:text-rose-600"
															href={s.portalUrl}
														>
															Manage
														</a>
													</div>
												))}
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</Layout>
	);
}
