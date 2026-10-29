/**
 * @module openapi/scalar-ui
 * Generates a self-contained Scalar API reference HTML page.
 * Scalar is a modern, beautiful OpenAPI docs UI — https://scalar.com
 */

export interface ScalarUIOptions {
  /** URL of the openapi.json spec endpoint. Default `'/openapi.json'`. */
  specUrl?: string;
  /** Page title shown in the browser tab. */
  title?: string;
  /** Scalar theme. Default `'purple'`. */
  theme?: 'alternate' | 'default' | 'moon' | 'purple' | 'solarized' | 'bluePlanet' | 'saturn' | 'kepler' | 'mars' | 'deepSpace' | 'none';
  /** Dark mode by default. Default `false`. */
  darkMode?: boolean;
}

/**
 * Returns an HTML string that renders the Scalar API reference UI.
 * The page loads Scalar from the official CDN, so internet access is required.
 */
export function scalarUIPage(options: ScalarUIOptions = {}): string {
  const {
    specUrl  = '/openapi.json',
    title    = 'API Reference',
    theme    = 'purple',
    darkMode = false,
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${specUrl}"
      data-configuration="${JSON.stringify({ theme, darkMode }).replace(/"/g, '&quot;')}"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;
}

/**
 * Returns an HTML string that renders the Swagger UI.
 * Useful as an alternative to Scalar.
 * Loads from the official CDN.
 */
export function swaggerUIPage(options: Pick<ScalarUIOptions, 'specUrl' | 'title'> = {}): string {
  const {
    specUrl = '/openapi.json',
    title   = 'API Reference',
  } = options;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    </script>
  </body>
</html>`;
}

