export async function onRequest(context) {
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  return new HTMLRewriter()
    .on('header.top', {
      element(el) {
        el.append(`<nav class="awe-hub-nav" aria-label="AWE ecosystem"><a href="https://awe-a2z.pages.dev/" target="_blank" rel="noopener">AWE A2Z</a><a href="https://awe-exp.pages.dev/" target="_blank" rel="noopener">AWEEXP</a><a href="https://awegame.pages.dev/" target="_blank" rel="noopener">AWEGame</a><a href="https://awearchive.pages.dev/" target="_blank" rel="noopener">AWEARCHIVE</a><a href="https://blogma-wa.blogspot.com/" target="_blank" rel="noopener">Blog</a></nav>` , { html: true });
      }
    })
    .on('head', {
      element(el) {
        el.append(`<style>.awe-hub-nav{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-left:auto}.awe-hub-nav a{padding:8px 11px;border:1px solid #dce6f3;border-radius:999px;background:#ffffffb8;color:#52627a;font:800 12px Inter,system-ui,sans-serif;text-decoration:none;backdrop-filter:blur(10px)}.awe-hub-nav a:hover{color:#5274e8;border-color:#9bbcff;transform:translateY(-1px)}@media(max-width:900px){.awe-hub-nav{width:100%;justify-content:center;margin:0 0 8px}}</style>`, { html: true });
      }
    })
    .transform(response);
}
