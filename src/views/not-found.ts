import { escapeHtml, renderAppHeader } from "./shared";

export function renderNotFoundPage(pathname: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="The requested Piano Practice page could not be found.">
    <meta name="color-scheme" content="light">
    <meta name="robots" content="noindex">
    <title>Not Found · Piano Practice</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body class="app-body">
    <a class="skip-link" href="#main">Skip to main content</a>
    ${renderAppHeader({ actionHref: "/", actionLabel: "Back home" })}
    <main id="main" class="app-shell not-found-page">
      <section class="not-found-panel">
        <p class="app-eyebrow app-eyebrow-inverse">404 · Off the score</p>
        <h1>That page isn’t<br><em>in this folio.</em></h1>
        <p>No route is defined for <code>${escapeHtml(pathname)}</code>. Return to the exercise library and choose a study that is ready to play.</p>
        <a class="app-button app-button-cue" href="/">Open exercise library <span aria-hidden="true">→</span></a>
      </section>
    </main>
  </body>
</html>`;
}
