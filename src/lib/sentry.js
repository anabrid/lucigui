import { loadScript } from './utils'

/**
 * Lazy loads sentry with loader script https://docs.sentry.io/platforms/javascript/install/loader/
 * The advantage instead of an npm bundle (in particular of the svelte-tailored npm package
 * @sentry/svelte) is that the bundle is several hundred kB smaller. Furthermore, sentry makes
 * only sense if the browser has a connection to the sentry endpoint, therefore it is also fine
 * to load sentry dynamically.
 * 
 * Lazy loading won't give us page startup metrics but that's fine.
 **/
export function lazy_load_sentry(dsn) {
    loadScript(
        "https://browser.sentry-cdn.com/7.107.0/bundle.tracing.replay.feedback.min.js",
        "sha384-H6FbnZIOcKmFV89f6mKXLz25b6iQTJI7TYp0HiXgt0BKFQKpFMyu96eKNzTJDbYL"
        //"https://sentry.anabrid.dev/js-sdk-loader/1945f70e4e7a79fda4bcc0b6e321d1c7.min.js",
        //"sha384-3c4S9kEAZWKhMtt+4LPcDUv+Pr0d4fb4So9pn858LJzqQNO0GfYi0J9drl6J/SL+"
    )
    .then(() => {
        // can alternatively also define window.sentryOnLoad = () => { ... }
        try {
            Sentry.init({
                dsn,
                integrations: [
                    Sentry.browserTracingIntegration(),
                    Sentry.replayIntegration({
                        maskAllText: false,
                        blockAllMedia: false,
                    }),
                    Sentry.feedbackIntegration({
                        colorScheme: "system"
                    })
                ],
            
                // Performance Monitoring
                tracesSampleRate: 0.2, // 1.0, //  Capture 100% of the transactions
                // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
                tracePropagationTargets: ["*"], // ["localhost", /^https:\/\/anabrid\.dev/, /^((\d+)\.?){4}/],
                // Session Replay
                replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
                replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
            });
        } catch(e) {}
    })
}