import { detectLocale, i18n, isLocale } from '$i18n/i18n-util';
import { loadAllLocales } from '$i18n/i18n-util.sync';
import type { Handle, RequestEvent, HandleFetch } from '@sveltejs/kit';
import { initAcceptLanguageHeaderDetector } from 'typesafe-i18n/detectors';

import { SvelteKitAuth } from '$lib/auth';

import { sequence } from '@sveltejs/kit/hooks';
import GitHub, { type GitHubProfile } from '@auth/core/providers/github';
import Keycloak from '@auth/core/providers/keycloak';

import { env } from '$env/dynamic/private';

// implementation is based on the sveltekit demo:
// https://github.dev/ivanhofer/typesafe-i18n-demo-sveltekit

loadAllLocales();
const L = i18n();

export const aa__handle: Handle = async ({ event, resolve }) => {
	// read language slug
	//const [, lang] = event.url.pathname.split('/')
	const lang = 'de';

	// // redirect to base locale if no locale slug was found
	// if (!lang) {
	// 	const locale = getPreferredLocale(event)

	// 	return new Response(null, {
	// 		status: 302,
	// 		headers: { Location: `/${locale}` },
	// 	})
	// }

	// if slug is not a locale, use base locale (e.g. api endpoints)
	const locale = isLocale(lang) ? (lang as Locales) : getPreferredLocale(event);

	const LL = L[locale];

	// bind locale and translation functions to current request
	event.locals.locale = locale;
	event.locals.LL = LL;

	// replace html lang attribute with correct language
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', locale) });
};

const getPreferredLocale = ({ request }: RequestEvent) => {
	// detect the preferred language the user has configured in his browser
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
	const acceptLanguageDetector = initAcceptLanguageHeaderDetector(request);

	return detectLocale(acceptLanguageDetector);
};

export const handleFetch = (async ({ request, fetch }) => {
	const url = new URL(request.url);

	request = new Request(request.url.replace(url.origin, env.API_BASE_URL), request);

	return fetch(request);
}) satisfies HandleFetch;

export const handle: Handle = sequence(
	aa__handle,

	SvelteKitAuth({
		secret: '645cf3d6d1455dfe1131b9b017c8ce741e57b0dbf0a15914f641ff98a433c551',
		trustHost: true,
		providers: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			Keycloak({
				issuer: 'https://account.c2f12f5e1a9b4b57b285.westeurope.aksapp.io/realms/sps',
				clientId: 'frontend',
				clientSecret: 'XiiGmlkY4ArduQt6KY4iboHnxJR8n9O1',
			}),
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			// GitHub({
			// 	clientId: '45b76f0b9453a5fbc39a',
			// 	clientSecret: '41a291c7159b2fb0fb20649751729142bee49d16'
			// })
		],
	}),
);
