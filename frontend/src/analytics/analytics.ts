/**
 * Privacy-first funnel analytics.
 *
 * Design constraints:
 * - **No-op by default.** With no provider configured the module does nothing, so the app
 *   ships instrumented without sending anything anywhere until a provider is wired up.
 * - **Never sends prompt content.** Only metadata (lengths, scores, grades, component counts).
 *   Prompts are the user's private material; the product's whole pitch is that they never leave
 *   the browser.
 * - **Provider-agnostic.** Plausible and Umami both support custom events and are cookieless,
 *   which keeps a consent banner off the critical path. Swapping providers is a one-line change.
 *
 * Configuration (build-time, Vite):
 *   VITE_ANALYTICS_PROVIDER=plausible  VITE_ANALYTICS_DOMAIN=skelica.pages.dev
 *   VITE_ANALYTICS_PROVIDER=umami      VITE_ANALYTICS_SCRIPT_URL=... VITE_ANALYTICS_WEBSITE_ID=...
 */

export type AnalyticsProvider = 'plausible' | 'umami' | 'none';

interface AnalyticsConfig {
  provider: AnalyticsProvider;
  /** Plausible: the site domain registered in the dashboard. */
  domain?: string;
  /** Umami: full URL of the tracker script. */
  scriptUrl?: string;
  /** Umami: website id. */
  websiteId?: string;
  /** Log events to the console instead of sending them. */
  debug?: boolean;
}

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Props }) => void;
    umami?: { track: (event: string, data?: Props) => void };
  }
}

const SCRIPT_ID = 'skelica-analytics';

function readConfig(): AnalyticsConfig {
  const env = import.meta.env;
  const raw = (env.VITE_ANALYTICS_PROVIDER ?? '').trim().toLowerCase();

  const provider: AnalyticsProvider =
    raw === 'plausible' || raw === 'umami' ? raw : 'none';

  return {
    provider,
    domain: env.VITE_ANALYTICS_DOMAIN as string | undefined,
    scriptUrl: env.VITE_ANALYTICS_SCRIPT_URL as string | undefined,
    websiteId: env.VITE_ANALYTICS_WEBSITE_ID as string | undefined,
    debug: env.DEV,
  };
}

let config: AnalyticsConfig = { provider: 'none' };
let initialized = false;

function injectScript(src: string, attributes: Record<string, string> = {}): void {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = src;
  script.setAttribute('data-skelica-analytics', 'true');
  Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value));
  document.head.appendChild(script);
}

/** Loads the tracker. Safe to call unconditionally; does nothing when unconfigured. */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  config = readConfig();

  if (config.provider === 'plausible' && config.domain) {
    injectScript('https://plausible.io/js/script.tagged-events.js', {
      'data-domain': config.domain,
    });
  } else if (config.provider === 'umami' && config.scriptUrl && config.websiteId) {
    injectScript(config.scriptUrl, { 'data-website-id': config.websiteId });
  }
}

/**
 * Records a funnel event. Never pass prompt text, API keys, or any user content.
 */
export function track(event: string, props: Props = {}): void {
  if (config.debug && config.provider === 'none') {
     
    console.debug('[analytics:noop]', event, props);
    return;
  }

  try {
    if (typeof window === 'undefined') return;

    if (config.provider === 'plausible' && typeof window.plausible === 'function') {
      window.plausible(event, { props });
      return;
    }

    if (config.provider === 'umami' && window.umami) {
      window.umami.track(event, props);
    }
  } catch {
    // Analytics must never break the product.
  }
}

/** Funnel event names, centralised so they cannot drift between call sites. */
export const EVENTS = {
  analyzeClicked: 'analyze_clicked',
  analysisShown: 'analysis_shown',
  semanticSettled: 'semantic_settled',
  improveClicked: 'improve_clicked',
} as const;
