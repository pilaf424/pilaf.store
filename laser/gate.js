'use strict';
(() => {
  const form = document.getElementById('unlock-form');
  const input = document.getElementById('preview-password');
  const button = form.querySelector('[type=submit]');
  const status = document.getElementById('unlock-status');
  const toggle = document.getElementById('password-toggle');
  const initialPath = location.pathname + location.search;
  let busy = false;
  toggle.addEventListener('click', () => {
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    toggle.textContent = visible ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(visible));
    toggle.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    input.focus();
  });
  const safeJSON = value => JSON.stringify(value).replace(/</g, '\u003c').replace(/\u2028/g, '\u2028').replace(/\u2029/g, '\u2029');
  const cleanKey = value => value.split(/[?#]/)[0].replace(/^\.\//, '');
  function reveal(payload) {
    if (!payload || payload.version !== 1 || typeof payload.html !== 'string' || typeof payload.css !== 'string' || typeof payload.js !== 'string' || !payload.assets) throw new Error('FORMAT');
    const assets = payload.assets;
    const resolveAsset = value => assets[cleanKey(value)] || assets['assets/' + cleanKey(value)];
    // Rewrite before parsing, so even a browser that loads resources from an
    // inert DOMParser document can never request a clear portfolio image.
    const safeMarkup = payload.html.replace(/\b(src|poster|href)\s*=\s*(["'])(.*?)\2/gi, (match, name, quote, value) => {
      const replacement=resolveAsset(value);return replacement ? name+'="'+replacement+'"' : match;
    }).replace(/<script\b[\s\S]*?<\/script\s*>/gi,'').replace(/<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*>/gi,'');
    const doc = new DOMParser().parseFromString(safeMarkup, 'text/html');
    doc.querySelectorAll('script,link[rel=stylesheet],meta[http-equiv],meta[name=robots],meta[property="og:image"],meta[property="og:image:alt"]').forEach(node => node.remove());
    for (const element of doc.querySelectorAll('*')) {
      for (const attr of [...element.attributes]) {
        const replacement = resolveAsset(attr.value);
        if (replacement) element.setAttribute(attr.name, replacement);
      }
      if (element.hasAttribute('srcset')) {
        element.setAttribute('srcset', element.getAttribute('srcset').split(',').map(item => {
          const tokens = item.trim().split(/\s+/);tokens[0] = resolveAsset(tokens[0]) || tokens[0];return tokens.join(' ');
        }).join(', '));
      }
    }
    const robots = doc.createElement('meta');robots.name='robots';robots.content='noindex,nofollow,noarchive,noimageindex';doc.head.append(robots);
    const referrer = doc.createElement('meta');referrer.name='referrer';referrer.content='no-referrer';doc.head.append(referrer);
    const style = doc.createElement('style');
    style.textContent = payload.css.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g, (match, quote, url) => {
      const replacement = resolveAsset(url);return replacement ? 'url("' + replacement + '")' : match;
    }) + '#private-lock{position:fixed;right:20px;bottom:20px;z-index:9999;border:1px solid #b9c2b1;border-radius:4px;padding:11px 15px;background:#fffdf6;color:#314a3b;box-shadow:0 3px 20px #0001;font:600 12px system-ui,sans-serif;cursor:pointer}#private-lock:focus-visible{outline:3px solid #a58a55;outline-offset:4px}@media print{#private-lock{display:none}}';
    doc.head.append(style);
    const lock = doc.createElement('button');lock.type='button';lock.id='private-lock';lock.textContent='Lock preview';lock.setAttribute('aria-label','Lock this private preview');doc.body.append(lock);
    const boot = doc.createElement('script');
    const lifecycle = '(' + function privateLifecycle(lockURL) {
      const clear = () => { window.__PILAF_PRIVATE_ASSETS__ = null; window.__PILAF_PRIVATE_ASSET = null; document.title = 'PILAF / Private preview'; document.documentElement.innerHTML = '<head><meta name="robots" content="noindex,nofollow,noarchive"><title>PILAF / Private preview</title></head><body style="background:#f4f2e9"></body>'; };
      document.getElementById('private-lock').addEventListener('click', () => { clear(); location.replace(lockURL); });
      window.addEventListener('pagehide', clear, {once:true});
      window.addEventListener('pageshow', event => { if(event.persisted) location.replace(lockURL); });
      if(location.hash) requestAnimationFrame(() => { const target = document.getElementById(decodeURIComponent(location.hash.slice(1))); target?.scrollIntoView(); });
    }.toString() + ')(' + safeJSON(initialPath) + ');';
    const resolver = function(value) {
      let key=value.split('?')[0].split('#')[0];if(key.startsWith('./'))key=key.slice(2);
      const found=window.__PILAF_PRIVATE_ASSETS__[key]||window.__PILAF_PRIVATE_ASSETS__['assets/'+key];
      if(!found)throw new Error('Missing private asset');return found;
    };
    boot.textContent = 'window.__PILAF_PRIVATE_ASSETS__=' + safeJSON(assets) + ';window.__PILAF_PRIVATE_ASSET=' + resolver.toString() + ';' + payload.js + lifecycle;
    doc.body.append(boot);
    const html = '<!doctype html>' + doc.documentElement.outerHTML;
    // Data and script exist only in this unlocked document, never in storage.
    document.open();document.write(html);document.close();
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();if(busy || !input.value)return;
    if(!window.isSecureContext || !crypto.subtle){status.textContent='Open this preview over HTTPS, or on localhost for a local review.';status.dataset.error='true';return;}
    busy=true;button.disabled=true;form.setAttribute('aria-busy','true');status.dataset.error='false';status.textContent='Opening your private preview…';
    let passwordBytes = new TextEncoder().encode(input.value);
    input.value='';input.type='password';toggle.textContent='Show';toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-label','Show password');
    try {
      const response = await fetch(new URL('payload.bin', document.baseURI),{cache:'no-store',credentials:'same-origin',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error('NETWORK');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if(bytes.length<68 || new TextDecoder().decode(bytes.slice(0,8))!=='PILAFv01')throw new Error('FORMAT');
      const material = await crypto.subtle.importKey('raw',passwordBytes,'PBKDF2',false,['deriveKey']);passwordBytes.fill(0);passwordBytes=null;
      const key = await crypto.subtle.deriveKey({name:'PBKDF2',salt:bytes.slice(8,40),iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['decrypt']);
      const plaintext = new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(40,52),tagLength:128},key,bytes.slice(52)));
      let text = new TextDecoder('utf-8',{fatal:true}).decode(plaintext);plaintext.fill(0);
      const payload = JSON.parse(text);text='';reveal(payload);
    } catch(error) {
      const message=error?.message;
      status.textContent = message==='NETWORK' || error instanceof TypeError ? 'The preview could not be loaded. Check your connection and try again.' : message==='FORMAT' ? 'This preview package could not be opened. Please ask for a fresh link.' : 'That password did not open the preview. Please try again.';
      status.dataset.error='true';input.focus();
    } finally {
      if(passwordBytes)passwordBytes.fill(0);busy=false;button.disabled=false;form.removeAttribute('aria-busy');
    }
  });
})();
