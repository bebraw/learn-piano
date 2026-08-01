export function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy":
        "default-src 'self'; script-src 'self'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
      "permissions-policy": "camera=(), geolocation=(), microphone=(), midi=(self)",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
    },
  });
}

export function cssResponse(body: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

export function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

interface AppHeaderOptions {
  readonly actionHref: string;
  readonly actionLabel: string;
}

export function renderAppHeader({ actionHref, actionLabel }: AppHeaderOptions): string {
  return `<header class="app-topbar">
    <div class="app-shell flex min-h-16 items-center justify-between gap-4 py-2">
      <a class="app-brand" href="/" aria-label="Piano Practice home">
        <span class="app-mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </span>
        <span class="app-brand-name">Piano <strong>Practice</strong></span>
      </a>
      <div class="flex items-center gap-2 sm:gap-4">
        <span class="app-local-status"><span aria-hidden="true"></span>Local practice</span>
        <a class="app-header-action" href="${escapeHtml(actionHref)}">${escapeHtml(actionLabel)}</a>
      </div>
    </div>
  </header>`;
}
