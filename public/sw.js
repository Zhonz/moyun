// Service Worker for 墨韵 AI - 离线缓存支持

const CACHE_VERSION = 'inkverse-v1.13.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const FONT_CACHE = `${CACHE_VERSION}-fonts`;
const API_CACHE = `${CACHE_VERSION}-api`;

// 静态资源列表 - 应用核心文件
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles.css',
  '/src/styles/theme.css',
  '/src/styles/base.css',
  '/src/styles/components.css',
  '/src/styles/animations.css'
];

// 需要缓存的字体文件模式
const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&family=Noto+Serif+SC:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap'
];

// API 请求匹配模式
const API_PATTERNS = [
  /\/v1\/chat\/completions/,
  /\/v1\/messages/,
  /\/v1\/models/,
  /\/compatible-mode\/v1\//,
  /\/api\/paas\/v4\//,
  /\/api\/moonshot\/v1\//,
  /\/api\/lingyiwanwu\/v1\//
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装 Service Worker...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] 缓存静态资源');
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.error('[SW] 缓存静态资源失败:', err);
        });
      }),
      // 缓存字体
      caches.open(FONT_CACHE).then((cache) => {
        console.log('[SW] 缓存字体资源');
        return Promise.all(
          FONT_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn('[SW] 缓存字体失败:', url, err);
            })
          )
        );
      })
    ]).then(() => {
      console.log('[SW] 安装完成，跳过等待');
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活 Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 删除旧版本缓存
          if (cacheName.startsWith('inkverse-') && 
              cacheName !== STATIC_CACHE && 
              cacheName !== FONT_CACHE && 
              cacheName !== API_CACHE) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] 激活完成，claim 客户端');
      return self.clients.claim();
    })
  );
});

// 获取事件 - 根据类型使用不同缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过 chrome-extension 和其他非 http/https 请求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API 请求 - 网络优先，有缓存后备
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // 字体请求 - Stale While Revalidate
  if (isFontRequest(url)) {
    event.respondWith(staleWhileRevalidateStrategy(request, FONT_CACHE));
    return;
  }

  // 静态资源 - Cache First
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // 其他请求 - 网络优先
  event.respondWith(networkFirstStrategy(request, STATIC_CACHE));
});

// 判断是否为 API 请求
function isAPIRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url.pathname)) ||
         url.hostname.includes('openai.com') ||
         url.hostname.includes('anthropic.com') ||
         url.hostname.includes('deepseek.com') ||
         url.hostname.includes('dashscope') ||
         url.hostname.includes('bigmodel') ||
         url.hostname.includes('moonshot') ||
         url.hostname.includes('volces') ||
         url.hostname.includes('lingyiwanwu');
}

// 判断是否为字体请求
function isFontRequest(url) {
  return url.hostname.includes('fonts.googleapis.com') ||
         url.hostname.includes('fonts.gstatic.com') ||
         url.hostname.includes('fonts.googleapis.com');
}

// 判断是否为静态资源
function isStaticAsset(url) {
  if (url.origin !== self.location.origin) {
    return false;
  }
  
  const path = url.pathname;
  return path.startsWith('/src/') ||
         path === '/' ||
         path.endsWith('.html') ||
         path.endsWith('.js') ||
         path.endsWith('.css') ||
         path.endsWith('.json');
}

// Cache First 策略 - 缓存优先，适用于静态资源
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Cache First 命中:', request.url);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    console.log('[SW] Cache First 网络获取:', request.url);
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First 失败:', error);
    // 返回离线页面或缓存的 index.html
    return cache.match('/index.html') || new Response('离线模式', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network First 策略 - 网络优先，适用于 API 请求
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 只缓存成功的 API 响应
      if (isAPIRequest(new URL(request.url))) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    console.log('[SW] Network First 网络获取:', request.url);
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network First 使用缓存:', request.url);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // API 请求没有缓存时返回错误提示
    if (isAPIRequest(new URL(request.url))) {
      return new Response(JSON.stringify({
        error: '网络请求失败',
        message: '请检查网络连接后重试'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 其他请求尝试返回缓存的 index.html
    return cache.match('/index.html') || new Response('离线模式', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale While Revalidate 策略 - 返回缓存同时后台更新，适用于字体
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // 立即返回缓存，同时在后台更新
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('[SW] SWR 更新缓存:', request.url);
    }
    return networkResponse;
  }).catch((error) => {
    console.warn('[SW] SWR 后台更新失败:', error);
  });
  
  // 如果有缓存立即返回，否则等待网络
  if (cachedResponse) {
    console.log('[SW] SWR 缓存命中:', request.url);
    return cachedResponse;
  }
  
  console.log('[SW] SWR 等待网络:', request.url);
  return fetchPromise;
}

// 监听消息 - 用于手动清除缓存等操作
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        console.log('[SW] 缓存已清除');
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        });
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service Worker 脚本加载完成');
