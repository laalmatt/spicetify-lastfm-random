// Last.fm Random Artist for Spotify Desktop (Spicetify)
// User-specific settings are entered on first run and stored locally.
// Do not add your personal Last.fm API key or username to this file.
(() => {
  const SETTINGS_KEY = 'lastfm-random-settings-v1';
  const DEFAULT_MIN_PLAYCOUNT = 20;

  function settings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'); }
    catch (_) { return null; }
  }

  function configure() {
    const old = settings() || {};
    const username = window.prompt('Last.fm username:', old.username || '');
    if (username === null) return null;
    const apiKey = window.prompt('Last.fm API key (create one at last.fm/api/account/create):', old.apiKey || '');
    if (apiKey === null) return null;
    const minInput = window.prompt('Minimum playcount (strictly greater than):', String(old.minPlaycount ?? DEFAULT_MIN_PLAYCOUNT));
    if (minInput === null) return null;
    const minPlaycount = Number(minInput);
    if (!username.trim() || !apiKey.trim() || !Number.isInteger(minPlaycount) || minPlaycount < 0) {
      Spicetify.showNotification('Invalid Last.fm settings', true);
      return null;
    }
    const result = { username: username.trim(), apiKey: apiKey.trim(), minPlaycount };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(result));
    // Clear previously fetched lists when settings change.
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('lastfm-random-cache-v2:')) localStorage.removeItem(key);
    }
    return result;
  }

  const PAGE_SIZE = 200;
  const CACHE_MS = 24 * 60 * 60 * 1000;
  const cacheKey = cfg => `lastfm-random-cache-v2:${cfg.username}:${cfg.minPlaycount}`;
  const DICE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/></svg>';

  function apiUrl(page, cfg) {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.set('method', 'library.getartists');
    url.searchParams.set('api_key', cfg.apiKey);
    url.searchParams.set('user', cfg.username);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('page', String(page));
    return url.toString();
  }

  // Last.fm supports JSONP. This is a fallback when the Spotify webview
  // blocks cross-origin fetch requests. It may be restricted by Spotify's CSP.
  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const callback = `__lastfmRandom_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      const script = document.createElement('script');
      const timeout = setTimeout(() => finish(new Error('Last.fm request timed out')), 12000);
      let done = false;
      function finish(error, data) {
        if (done) return;
        done = true;
        clearTimeout(timeout);
        script.remove();
        delete window[callback];
        error ? reject(error) : resolve(data);
      }
      window[callback] = data => finish(null, data);
      script.onerror = () => finish(new Error('Last.fm JSONP was blocked'));
      script.src = `${url}&callback=${encodeURIComponent(callback)}`;
      document.head.appendChild(script);
    });
  }

  async function getPage(page, cfg) {
    const url = apiUrl(page, cfg);
    let data;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (fetchError) {
      try {
        data = await jsonp(url);
      } catch (jsonpError) {
        throw new Error(`Last.fm blocked (fetch: ${fetchError.message}; JSONP: ${jsonpError.message}).`);
      }
    }
    if (data.error) throw new Error(data.message || `Last.fm API error ${data.error}`);
    if (!data.artists || !data.artists.artist) throw new Error('Unexpected Last.fm API response');
    return data;
  }

  async function getArtists(cfg, forceRefresh = false) {
    const CACHE_KEY = cacheKey(cfg);
    if (!forceRefresh) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.savedAt < CACHE_MS && Array.isArray(cached.artists)) {
          return cached.artists;
        }
      } catch (_) { /* ignore corrupt cache */ }
    }
    const artists = [];
    const first = await getPage(1, cfg);
    const pages = Number(first.artists['@attr']?.totalPages || 1);
    const collect = data => {
      for (const artist of data.artists.artist) {
        if (Number(artist.playcount) > cfg.minPlaycount && artist.name) {
          artists.push({ name: artist.name, playcount: Number(artist.playcount) });
        }
      }
    };
    collect(first);
    for (let page = 2; page <= pages; page++) collect(await getPage(page, cfg));
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), artists }));
    return artists;
  }

  function init() {
    if (!window.Spicetify?.Topbar?.Button || !window.Spicetify?.Platform?.History) {
      setTimeout(init, 500);
      return;
    }
    const button = new Spicetify.Topbar.Button('Random Last.fm artist', DICE_ICON, async () => {
      if (button.disabled) return;
      button.disabled = true;
      try {
        const cfg = settings() || configure();
        if (!cfg) return;
        const artists = await getArtists(cfg);
        if (!artists.length) throw new Error(`No artists with more than ${cfg.minPlaycount} plays`);
        const artist = artists[Math.floor(Math.random() * artists.length)];
        Spicetify.Platform.History.push(`/search/${encodeURIComponent(artist.name)}`);
        Spicetify.showNotification(`🎲 ${artist.name} (${artist.playcount} plays)`);
      } catch (error) {
        console.error('[Last.fm Random Artist]', error);
        Spicetify.showNotification(`Last.fm: ${error.message}`, true, 8000);
      } finally {
        button.disabled = false;
      }
    }, false, true);
    // Right-click to edit settings; library cache is invalidated automatically.
    button.element.addEventListener('contextmenu', event => {
      event.preventDefault();
      if (configure()) Spicetify.showNotification('Last.fm settings saved');
    });
  }
  init();
})();
