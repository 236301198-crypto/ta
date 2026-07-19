// =========================================================================
//                   TEACHERS ACADEMY LEARNING PORTAL V2
//               Engineered by Naveen | Cloudflare Worker Proxy & SPA
// =========================================================================

const DEFAULT_TOKEN = "4fg1iZcgrW2X8QsF0DpX0ekBNZSNmugOWw9TJWVX5cTmYX4il3VIO%2B1lP6eCPAxoj93%2BhuIgNm03oQ1sCIkmv4zjcEdZwiTA5kpS8WG9VH9tQ6nsKQRDDjSzcQCQpASTHpGzOr%2F4vCIOahj4Z%2FMrQ2eud8PtLvIp1xit7EARO18%3D";

const BASE_HEADERS = {
  'Host': 'backend.classwalla.com',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip',
  'User-Agent': 'okhttp/5.3.2'
};

const LEGACY_HEADERS = {
  'User-Agent': 'okhttp/4.9.2',
  'Accept-Encoding': 'gzip'
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });
  }

  try {
    if (path === '/api/getCourseCategory') {
      return await getCourseCategoryProxy();
    } else if (path === '/api/getCoursesByCat') {
      return await getCoursesByCatProxy(url.searchParams.get('categoryId'));
    } else if (path === '/api/getCourseStructure') {
      return await getCourseStructureProxy(url.searchParams.get('courseId'));
    } else if (path === '/api/getCourseVideos') {
      return await getCourseVideosProxy(
        url.searchParams.get('courseId'),
        url.searchParams.get('categoryId'),
        url.searchParams.get('subCategoryId')
      );
    }

    // Default: Serve Premium Single Page Application (SPA)
    return new Response(getSPAHTML(), {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// =========================================================================
//                 BACKEND SECURE API MASKING PROXIES
// =========================================================================

async function getCourseCategoryProxy() {
  const boundary = 'f30abafb-92e2-4b52-bf44-12df495babc3';
  const apiEndpoint = "https://backend.classwalla.com/coursecategory/v1/getCourseCategory";
  
  // Exact body building format to match Python concatenation
  const body_cat = '{"data":{"companyId":46},"token":"' + DEFAULT_TOKEN + '"}';
  const multipartBody = 
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="body"\r\n\r\n` +
    `${body_cat}\r\n` +
    `--${boundary}--\r\n`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: multipartBody
  });

  const resJson = await response.json();
  return createJSONResponse(resJson);
}

async function getCoursesByCatProxy(categoryId) {
  if (!categoryId) {
    return createJSONResponse({ error: "categoryId is required" }, 400);
  }

  // Step A: Fetch layoutV2 to retrieve exact Subcategory ID
  const layoutBoundary = '276b3148-2c4f-406a-9d76-a4379e9e122c';
  const layoutEndpoint = "https://backend.classwalla.com/coursecategory/v1/getLayoutV2";
  
  const body_layout = '{"data":{"candidateId":"","categoryId":' + categoryId + ',"companyId":46,"limit":"100","offset":"0"},"token":"' + DEFAULT_TOKEN + '"}';
  const multipartLayout = 
    `--${layoutBoundary}\r\n` +
    `Content-Disposition: form-data; name="body"\r\n\r\n` +
    `${body_layout}\r\n` +
    `--${layoutBoundary}--\r\n`;

  const layoutResponse = await fetch(layoutEndpoint, {
    method: 'POST',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': `multipart/form-data; boundary=${layoutBoundary}`
    },
    body: multipartLayout
  });

  const layoutJson = await layoutResponse.json();
  const subcategoryId = layoutJson?.data?.layout?.[0]?.id;

  if (!subcategoryId) {
    return createJSONResponse({ error: "Failed to fetch Subcategory ID for layout layoutV2" }, 404);
  }

  // Step B: Fetch courses list using extracted Subcategory ID
  const subcatBoundary = '1af43917-9fc4-43d6-8f6a-dc58aaa6ccef';
  const subcatEndpoint = "https://backend.classwalla.com/coursecategory/v1/getCoursesBySubCat";

  const body_subcat = '{"data":{"limit":"100","offset":"0","searchString":"","subcatId":"' + subcategoryId + '"},"token":"' + DEFAULT_TOKEN + '"}';
  const multipartSubcat = 
    `--${subcatBoundary}\r\n` +
    `Content-Disposition: form-data; name="body"\r\n\r\n` +
    `${body_subcat}\r\n` +
    `--${subcatBoundary}--\r\n`;

  const coursesResponse = await fetch(subcatEndpoint, {
    method: 'POST',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': `multipart/form-data; boundary=${subcatBoundary}`
    },
    body: multipartSubcat
  });

  const coursesJson = await coursesResponse.json();
  return createJSONResponse(coursesJson);
}

async function getCourseStructureProxy(courseId) {
  if (!courseId) {
    return createJSONResponse({ error: "courseId is required" }, 400);
  }

  const endpoint = 'https://backend.classwalla.com/course/course/getCourseCategories';
  const bodyStr = '{"data":{"courseId":"' + courseId + '"},"token":"' + DEFAULT_TOKEN + '"}';
  
  const formEncoded = new URLSearchParams();
  formEncoded.append('body', bodyStr);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...LEGACY_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formEncoded.toString()
  });

  const resJson = await response.json();
  return createJSONResponse(resJson);
}

async function getCourseVideosProxy(courseId, categoryId, subCategoryId) {
  if (!courseId || !categoryId || !subCategoryId) {
    return createJSONResponse({ error: "courseId, categoryId, subCategoryId are required parameters" }, 400);
  }

  const endpoint = 'https://backend.classwalla.com/candidate/candidate/getCourseVideos';
  const bodyStr = '{"data":{"courseId":"' + courseId + '","filters":{"videoCategory":"' + categoryId + '","videoSubCategory":"' + subCategoryId + '"},"limit":"1000","offset":"0"},"token":"' + DEFAULT_TOKEN + '"}';

  const formEncoded = new URLSearchParams();
  formEncoded.append('body', bodyStr);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...LEGACY_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formEncoded.toString()
  });

  const resJson = await response.json();
  return createJSONResponse(resJson);
}

function createJSONResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}

// =========================================================================
//                    STUNNING PREMIUM FRONTEND (SPA)
// =========================================================================

function getSPAHTML() {
  return `<!DOCTYPE html>
<html lang="en" class="h-full scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEACHERS ACADEMY | Naveen</title>
  
  <!-- CSS Integration -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          },
          colors: {
            brand: {
              50: '#f5f3ff',
              100: '#ede9fe',
              200: '#ddd6fe',
              300: '#c084fc',
              400: '#a78bfa',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
              800: '#5b21b6',
              900: '#4c1d95',
              950: '#0f0b21',
            },
            dark: {
              card: '#121826',
              bg: '#080c14',
              border: '#1f293d',
              muted: '#64748b'
            }
          },
          boxShadow: {
            'glow': '0 0 20px rgba(124, 58, 237, 0.15)',
            'glow-lg': '0 0 35px rgba(124, 58, 237, 0.3)',
          }
        }
      }
    }
  </script>

  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #080c14;
      color: #f1f5f9;
    }
    
    .glass-nav {
      background: rgba(8, 12, 20, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(31, 41, 61, 0.7);
    }

    .premium-card {
      background: linear-gradient(135deg, #121826 0%, #0d121d 100%);
      border: 1px solid rgba(255, 255, 255, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .premium-card:hover {
      transform: translateY(-4px);
      border-color: rgba(139, 92, 246, 0.35);
      box-shadow: 0 10px 30px -10px rgba(124, 58, 237, 0.25);
    }

    /* Standard high-end scrollbar customization */
    ::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    ::-webkit-scrollbar-track {
      background: #080c14;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #7c3aed;
    }

    /* Modal Styling */
    .modal-backdrop {
      background: rgba(4, 6, 10, 0.85);
      backdrop-filter: blur(12px);
    }
  </style>
</head>
<body class="h-full flex flex-col selection:bg-brand-500 selection:text-white">

  <!-- ================= TOP NAV BAR ================= -->
  <header class="sticky top-0 z-50 glass-nav">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- Brand Logo Custom Display -->
      <a href="#/my-batches" class="flex items-center space-x-3.5 group">
        <div class="relative w-12 h-12 rounded-2xl overflow-hidden border border-brand-500/30 group-hover:border-brand-500/80 group-hover:scale-105 transition-all duration-300">
          <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
               alt="Teachers Academy Brand Logo" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col">
          <div class="flex items-center space-x-2">
            <span class="text-lg font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300">
              TEACHERS ACADEMY
            </span>
          </div>
          <span class="text-[10px] font-bold tracking-widest text-violet-400/90 uppercase flex items-center">
            <span>By Naveen</span>
            <span class="mx-1.5">•</span>
            <span class="text-emerald-400 font-semibold flex items-center">
              <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1 animate-pulse"></span>
              Live Learning
            </span>
          </span>
        </div>
      </a>

      <!-- Navigation Tabs -->
      <nav class="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80">
        <a href="#/my-batches" id="nav-my-batches" class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2">
          <i class="fa-solid fa-graduation-cap"></i>
          <span>My Batches</span>
          <span id="nav-count" class="ml-1 px-1.5 py-0.5 text-[9px] bg-brand-500 text-white font-extrabold rounded-full hidden">0</span>
        </a>
        <a href="#/all-courses" id="nav-all-courses" class="px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 text-slate-400 hover:text-slate-100">
          <i class="fa-solid fa-compass"></i>
          <span>All Batches</span>
        </a>
      </nav>

    </div>
  </header>

  <!-- ================= BREADCRUMBS BAR ================= -->
  <div class="bg-slate-950/60 border-b border-slate-900/45 py-3">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav id="breadcrumbs" class="flex flex-wrap items-center space-x-2 text-xs text-slate-400">
        <!-- Filled Dynamically -->
        <span class="text-slate-600">Initializing Navigation System...</span>
      </nav>
    </div>
  </div>

  <!-- ================= MAIN VIEWPORT CONTAINER ================= -->
  <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div id="dynamic-viewport" class="space-y-8">
      <!-- Direct Injection by Router -->
    </div>
  </main>

  <!-- ================= EMBEDDED PLAYER MODAL ================= -->
  <div id="player-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 modal-backdrop">
    <div class="relative w-full max-w-4xl bg-[#111622] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl shadow-black">
      
      <!-- Video Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div class="flex items-center space-x-3.5">
          <span class="px-2.5 py-1 bg-brand-900/40 text-brand-400 rounded-lg text-[10px] font-bold tracking-wider uppercase">
            NOW STREAMING
          </span>
          <h3 id="player-title" class="text-sm font-bold text-slate-100 truncate max-w-md sm:max-w-xl">Class Lecture</h3>
        </div>
        <button onclick="closePlayer()" class="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Iframe Video Panel -->
      <div class="aspect-video bg-black relative">
        <iframe id="player-iframe" class="absolute inset-0 w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>

      <!-- Footer Integration -->
      <div class="px-6 py-4 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-800/60">
        <p class="text-xs text-slate-400">
          <i class="fa-solid fa-info-circle text-brand-400 mr-1.5"></i>
          YouTube premium stream engine optimized by Naveen.
        </p>
        <div class="flex items-center space-x-3">
          <a id="player-youtube-btn" target="_blank" class="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:text-white text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-2 transition-all">
            <i class="fa-brands fa-youtube text-red-500"></i>
            <span>YouTube View</span>
          </a>
        </div>
      </div>

    </div>
  </div>

  <!-- ================= SYSTEM FEEDBACK NOTIFIER ================= -->
  <div id="toast-notif" class="fixed bottom-6 right-6 z-50 transform translate-y-12 opacity-0 pointer-events-none transition-all duration-300">
    <div class="flex items-center space-x-3 px-5 py-3.5 bg-slate-900/95 border border-emerald-500/30 shadow-2xl rounded-2xl">
      <div class="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <span id="toast-text" class="text-xs font-semibold text-slate-200">Operation Successful</span>
    </div>
  </div>

  <!-- ================= COMPACT FOOTER ================= -->
  <footer class="border-t border-slate-900 bg-slate-950 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center space-x-2">
        <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
             alt="Logo" class="w-6 h-6 rounded-md">
        <span class="text-xs font-medium text-slate-500">&copy; 2026 TEACHERS ACADEMY. Administered securely by Naveen.</span>
      </div>
      <div class="text-xs text-slate-600 font-medium">
        Encrypted Cloudflare Worker Routing Framework
      </div>
    </div>
  </footer>

  <!-- ================= CLIENT SIDE ROUTER ENGINE ================= -->
  <script>
    // State Memory Manager
    const appState = {
      myBatches: [],
      categoryCache: [],
      courseCache: {}, // categoryId -> array of courses
      structureCache: {}, // courseId -> chapters structure
      currentCourseId: null,
      currentCategory: null,
      currentChapter: null
    };

    // Initialize Local Database on Load
    function initDB() {
      const saved = localStorage.getItem('ta_my_batches');
      if (saved) {
        try {
          appState.myBatches = JSON.parse(saved);
        } catch (e) {
          appState.myBatches = [];
        }
      }
      refreshTabCounter();
    }

    function saveDB() {
      localStorage.setItem('ta_my_batches', JSON.stringify(appState.myBatches));
      refreshTabCounter();
    }

    function refreshTabCounter() {
      const counter = document.getElementById('nav-count');
      if (counter) {
        if (appState.myBatches.length > 0) {
          counter.innerText = appState.myBatches.length;
          counter.classList.remove('hidden');
        } else {
          counter.classList.add('hidden');
        }
      }
    }

    // Interactive Toast Notification
    function showToast(message, isSuccess = true) {
      const toast = document.getElementById('toast-notif');
      const text = document.getElementById('toast-text');
      if (!toast || !text) return;

      text.innerText = message;
      toast.classList.remove('translate-y-12', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');

      setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-12', 'opacity-0');
      }, 2500);
    }

    // =========================================================================
    //                            HASH NAVIGATION SYSTEM
    // =========================================================================
    const routingTable = [
      { regex: /^#\/my-batches$/, action: renderMyBatchesDashboard },
      { regex: /^#\/all-courses$/, action: renderAllCategories },
      { regex: /^#\/category\/([^\/]+)$/, action: renderCategoryCourses },
      { regex: /^#\/course\/([^\/]+)$/, action: renderCourseStructure },
      { regex: /^#\/course\/([^\/]+)\/chapter\/([^\/]+)\/([^\/]+)$/, action: renderChapterLessons }
    ];

    function handleHashRouting() {
      const hash = window.location.hash || '#/my-batches';
      
      // Update UI Header Highlights
      const myBatchesTab = document.getElementById('nav-my-batches');
      const allCoursesTab = document.getElementById('nav-all-courses');

      if (hash.startsWith('#/my-batches')) {
        myBatchesTab.className = "px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-lg shadow-brand-600/10 transition-all flex items-center space-x-2";
        allCoursesTab.className = "px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all flex items-center space-x-2";
      } else {
        allCoursesTab.className = "px-5 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-lg shadow-brand-600/10 transition-all flex items-center space-x-2";
        myBatchesTab.className = "px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all flex items-center space-x-2";
      }

      for (const route of routingTable) {
        const match = hash.match(route.regex);
        if (match) {
          const args = match.slice(1);
          route.action(...args);
          return;
        }
      }

      // Default redirect
      window.location.hash = '#/my-batches';
    }

    // =========================================================================
    //                         BREADCRUMB HELPER UI
    // =========================================================================
    function setBreadcrumbs(items) {
      const container = document.getElementById('breadcrumbs');
      if (!container) return;

      let html = `
        <a href="#/my-batches" class="hover:text-violet-400 transition-colors flex items-center space-x-1.5">
          <i class="fa-solid fa-house text-[10px]"></i>
          <span>Dashboard</span>
        </a>
      `;

      items.forEach((item, index) => {
        html += `
          <span class="text-slate-700 text-[10px]"><i class="fa-solid fa-chevron-right"></i></span>
        `;
        if (index === items.length - 1) {
          html += `
            <span class="text-slate-200 font-bold truncate max-w-[150px] sm:max-w-xs block">${item.name}</span>
          `;
        } else {
          html += `
            <a href="${item.link}" class="hover:text-violet-400 transition-colors truncate max-w-[120px] block">${item.name}</a>
          `;
        }
      });

      container.innerHTML = html;
    }

    // =========================================================================
    //                        LOADER & ERROR WRAPPERS
    // =========================================================================
    function showLoader(containerId = 'dynamic-viewport') {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 space-y-4">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 border-4 border-slate-800/80 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
          <p class="text-xs text-slate-400 font-bold tracking-widest uppercase animate-pulse">
            Connecting Academic Server...
          </p>
        </div>
      `;
    }

    function showFailedState(containerId, message, retryLink) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = `
        <div class="max-w-md mx-auto text-center py-16 px-4 bg-[#121826]/30 border border-slate-800 rounded-3xl">
          <div class="w-14 h-14 bg-red-950/40 text-red-400 rounded-full border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-circle-exclamation text-xl animate-pulse"></i>
          </div>
          <h3 class="text-slate-200 font-bold text-base mb-1.5">Server Interruption</h3>
          <p class="text-slate-400 text-xs mb-6 leading-relaxed">${message}</p>
          <a href="${retryLink}" class="px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-850 hover:text-white transition-all inline-flex items-center space-x-2">
            <i class="fa-solid fa-arrow-rotate-right"></i>
            <span>Retry Connection</span>
          </a>
        </div>
      `;
    }

    // =========================================================================
    //                          UTILITY EXTENSION ENGINE
    // =========================================================================
    function getYTID(url) {
      if (!url) return null;
      const reg = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(reg);
      return (match && match[2].length === 11) ? match[2] : null;
    }

    function getYTThumb(url) {
      const id = getYTID(url);
      if (id) {
        return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
      }
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80";
    }

    function computeCourseThumbnail(course) {
      const defaultVal = course.cthumb || course.courseThumbnail;
      if (defaultVal && defaultVal !== "null" && defaultVal.trim() !== "") {
        return defaultVal;
      }
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80";
    }

    function formatDisplayDate(dateRaw) {
      if (!dateRaw) return '';
      try {
        const d = new Date(dateRaw);
        if (isNaN(d.getTime())) {
          return dateRaw.split(' ')[0] || '';
        }
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return dateRaw;
      }
    }

    // =========================================================================
    //                   VIEW 1: MY BATCHES (DASHBOARD)
    // =========================================================================
    function renderMyBatchesDashboard() {
      setBreadcrumbs([]);
      const viewport = document.getElementById('dynamic-viewport');
      if (!viewport) return;

      if (appState.myBatches.length === 0) {
        viewport.innerHTML = `
          <!-- Beautiful Greeting Welcome Hero -->
          <div class="relative bg-gradient-to-r from-brand-950/60 via-slate-900 to-indigo-950/30 rounded-3xl border border-slate-800 p-8 sm:p-10 overflow-hidden">
            <div class="absolute -top-12 -right-12 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 max-w-xl">
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3 text-slate-100">
                Welcome to your Learning Desk!
              </h2>
              <p class="text-slate-400 text-xs sm:text-sm mb-6 leading-relaxed">
                Unlock, trace, and manage lectures and resources easily on your device. Explore the course catalog to start pinning learning batches today.
              </p>
              <a href="#/all-courses" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs tracking-wide shadow-lg shadow-brand-600/20 inline-flex items-center space-x-2 transition-all">
                <i class="fa-solid fa-compass"></i>
                <span>Explore All Batches</span>
              </a>
            </div>
          </div>

          <!-- Empty Grid Dashboard UI -->
          <div class="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/30 max-w-xl mx-auto">
            <div class="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
              <i class="fa-solid fa-graduation-cap text-slate-500 text-lg"></i>
            </div>
            <h4 class="text-slate-300 font-bold text-sm">Dashboard is Unlocked but Empty</h4>
            <p class="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto px-4">Browse classes inside the explorer. All marked course sessions will immediately appear here.</p>
          </div>
        `;
        return;
      }

      // Render Dynamic Locker List
      let html = `
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 class="text-xl font-extrabold tracking-tight text-slate-200">Registered Batches</h2>
            <p class="text-slate-500 text-xs mt-0.5">Quick workspace access mapped locally to this web browser.</p>
          </div>
          
          <div class="flex items-center space-x-3 bg-slate-900/40 p-2 border border-slate-800 rounded-xl">
            <span class="text-[10px] text-slate-400 uppercase tracking-widest px-2.5 font-bold border-r border-slate-800">Workspace Sync</span>
            <span class="text-xs font-bold text-emerald-400 px-2.5 flex items-center">
              <i class="fa-solid fa-cloud-bolt mr-1.5 text-emerald-400"></i>Active
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      `;

      appState.myBatches.forEach(batch => {
        const thumb = computeCourseThumbnail(batch);
        html += `
          <div class="group relative premium-card rounded-2xl overflow-hidden flex flex-col justify-between h-full">
            <div class="relative aspect-video overflow-hidden bg-slate-950">
              <img src="${thumb}" alt="${batch.courseName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/10 to-transparent"></div>
              <div class="absolute top-3 left-3">
                <span class="px-2.5 py-1 bg-brand-600/95 text-[9px] font-extrabold text-white uppercase tracking-widest rounded-lg border border-brand-400/20 shadow-glow">
                  My Course
                </span>
              </div>
            </div>

            <div class="p-5 flex-grow flex flex-col justify-between">
              <div>
                <h3 class="text-xs font-bold text-slate-200 group-hover:text-brand-300 transition-colors line-clamp-2 leading-relaxed">
                  ${batch.courseName}
                </h3>
                <div class="mt-2.5 flex items-center space-x-1.5 text-xs text-brand-300 font-extrabold">
                  <span>${batch.price === "0" ? "Free Batch" : "₹" + batch.price}</span>
                </div>
              </div>

              <div class="mt-6 grid grid-cols-5 gap-2 border-t border-slate-800/60 pt-4">
                <a href="#/course/${batch.courseId}" class="col-span-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-2 transition-all shadow-lg shadow-brand-600/10">
                  <i class="fa-solid fa-circle-play text-[10px]"></i>
                  <span>Enter Dashboard</span>
                </a>
                <button onclick="removeBatchFromMyList('${batch.courseId}')" class="col-span-1 py-2.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/20 rounded-xl text-xs flex items-center justify-center transition-colors" title="Remove Course">
                  <i class="fa-solid fa-trash-can text-[11px]"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      viewport.innerHTML = html;
    }

    function removeBatchFromMyList(courseId) {
      appState.myBatches = appState.myBatches.filter(b => String(b.courseId) !== String(courseId));
      saveDB();
      showToast("Course Batch removed successfully!");
      renderMyBatchesDashboard();
    }

    // =========================================================================
    //                     VIEW 2: CATEGORIES CATALOG EXPLORER
    // =========================================================================
    async function renderAllCategories() {
      setBreadcrumbs([{ name: 'All Batches', link: '#/all-courses' }]);
      showLoader();

      try {
        if (appState.categoryCache.length === 0) {
          const res = await fetch('/api/getCourseCategory');
          const data = await res.json();
          appState.categoryCache = data?.data?.courseCategory || [];
        }

        const viewport = document.getElementById('dynamic-viewport');
        if (!viewport) return;

        if (appState.categoryCache.length === 0) {
          showFailedState('dynamic-viewport', "API reported empty categories. Token expired?", '#/all-courses');
          return;
        }

        let html = `
          <div>
            <h2 class="text-xl font-extrabold tracking-tight text-slate-200">Category Streams</h2>
            <p class="text-slate-500 text-xs mt-0.5">Explore batches under specific categories and educational departments.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        `;

        appState.categoryCache.forEach((cc, idx) => {
          const indexNum = idx + 1;
          html += `
            <a href="#/category/${cc.categoryId}" class="group block p-6 premium-card rounded-2xl flex items-center justify-between border border-slate-800/80 hover:bg-gradient-to-br hover:from-brand-950/10">
              <div class="space-y-1.5 pr-4">
                <span class="text-[9px] font-extrabold text-violet-400/80 uppercase tracking-widest">
                  STREAM MODULE ${indexNum}
                </span>
                <h3 class="font-extrabold text-slate-200 group-hover:text-white transition-colors text-sm sm:text-base leading-tight">
                  ${cc.courseCategory}
                </h3>
              </div>
              <div class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800/60 group-hover:bg-brand-600 group-hover:text-white group-hover:border-transparent text-slate-400 flex items-center justify-center transition-all duration-300">
                <i class="fa-solid fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
              </div>
            </a>
          `;
        });

        html += `</div>`;
        viewport.innerHTML = html;

      } catch (err) {
        showFailedState('dynamic-viewport', err.message, '#/all-courses');
      }
    }

    // =========================================================================
    //                        VIEW 3: CATEGORIES COURSES LIST
    // =========================================================================
    async function renderCategoryCourses(categoryId) {
      showLoader();

      try {
        // Resolve target Category title
        let categoryName = "Streams Explorer";
        if (appState.categoryCache.length === 0) {
          const resCat = await fetch('/api/getCourseCategory');
          const dataCat = await resCat.json();
          appState.categoryCache = dataCat?.data?.courseCategory || [];
        }
        const activeCat = appState.categoryCache.find(c => String(c.categoryId) === String(categoryId));
        if (activeCat) {
          categoryName = activeCat.courseCategory;
          appState.currentCategory = activeCat;
        }

        setBreadcrumbs([
          { name: 'All Batches', link: '#/all-courses' },
          { name: categoryName, link: '#/category/' + categoryId }
        ]);

        // Query active courses for specified CategoryId
        if (!appState.courseCache[categoryId]) {
          const res = await fetch('/api/getCoursesByCat?categoryId=' + categoryId);
          const data = await res.json();
          
          let clists = [];
          if (data?.data?.candidateCourseList) {
            clists = data.data.candidateCourseList;
          } else if (data?.data?.layout?.[0]?.content) {
            clists = data.data.layout[0].content;
          }
          appState.courseCache[categoryId] = clists;
        }

        const courses = appState.courseCache[categoryId];
        const viewport = document.getElementById('dynamic-viewport');
        if (!viewport) return;

        if (!courses || courses.length === 0) {
          viewport.innerHTML = `
            <div class="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/30 max-w-xl mx-auto">
              <div class="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <i class="fa-solid fa-graduation-cap text-slate-500 text-lg"></i>
              </div>
              <h4 class="text-slate-300 font-bold text-sm">No Courses Available</h4>
              <p class="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">No batches are linked inside this category structure at the moment.</p>
              <a href="#/all-courses" class="mt-5 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl inline-block hover:bg-slate-800">
                <i class="fa-solid fa-chevron-left mr-1.5"></i>Return to Explorer
              </a>
            </div>
          `;
          return;
        }

        // Render card layout
        let html = `
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 class="text-xl font-extrabold tracking-tight text-slate-200">${categoryName}</h2>
              <p class="text-slate-500 text-xs mt-0.5">Explore available batches and add them to your local list for workspace tracking.</p>
            </div>
            
            <div class="relative max-w-xs w-full">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
                <i class="fa-solid fa-magnifying-glass text-[10px]"></i>
              </span>
              <input type="text" id="course-filter" oninput="filterCourseList(this.value)" placeholder="Filter courses by title..." 
                     class="w-full pl-9 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="course-cards-mount">
        `;

        courses.forEach(c => {
          const isAdded = appState.myBatches.some(b => String(b.courseId) === String(c.courseId));
          const thumb = computeCourseThumbnail(c);
          
          html += `
            <div class="group relative premium-card rounded-2xl overflow-hidden flex flex-col justify-between h-full search-card" data-title="${c.courseName.toLowerCase()}">
              <div class="relative aspect-video overflow-hidden bg-slate-950">
                <img src="${thumb}" alt="${c.courseName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/10 to-transparent"></div>
              </div>

              <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 class="text-xs font-bold text-slate-200 group-hover:text-brand-300 transition-colors line-clamp-2 leading-relaxed">
                    ${c.courseName}
                  </h3>
                  <div class="mt-2.5 flex items-center space-x-1.5 text-xs text-brand-300 font-extrabold">
                    <span>${c.price === "0" ? "Free Admission" : "₹" + c.price}</span>
                  </div>
                </div>

                <div class="mt-6 grid grid-cols-5 gap-2 border-t border-slate-800/60 pt-4">
                  <a href="#/course/${c.courseId}" class="col-span-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-750 text-slate-200 font-bold rounded-xl text-xs text-center flex items-center justify-center space-x-1.5 transition-colors">
                    <span>Structure</span>
                  </a>
                  
                  <button id="add-btn-${c.courseId}" onclick='toggleBatchRegistration(${JSON.stringify(c).replace(/'/g, "&apos;")})' 
                          class="col-span-2 py-2.5 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1 transition-all ${isAdded ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/10'}">
                    ${isAdded ? '<i class="fa-solid fa-check"></i> <span>Saved</span>' : '<i class="fa-solid fa-plus"></i> <span>Add</span>'}
                  </button>
                </div>
              </div>
            </div>
          `;
        });

        html += `</div>`;
        viewport.innerHTML = html;

      } catch (err) {
        showFailedState('dynamic-viewport', err.message, '#/category/' + categoryId);
      }
    }

    function filterCourseList(val) {
      const formatted = val.toLowerCase().trim();
      const cards = document.getElementsByClassName('search-card');
      
      Array.from(cards).forEach(card => {
        const title = card.getAttribute('data-title');
        if (title.includes(formatted)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    // Persistent storage manipulation inside lists
    function toggleBatchRegistration(courseObj) {
      const index = appState.myBatches.findIndex(b => String(b.courseId) === String(courseObj.courseId));
      const btn = document.getElementById('add-btn-' + courseObj.courseId);
      
      if (index > -1) {
        // Remove from persistent storage
        appState.myBatches.splice(index, 1);
        saveDB();
        showToast("Removed from My Batches");
        if (btn) {
          btn.className = "col-span-2 py-2.5 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1 bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/10 transition-all";
          btn.innerHTML = '<i class="fa-solid fa-plus"></i> <span>Add</span>';
        }
      } else {
        // Add to persistent storage
        appState.myBatches.push(courseObj);
        saveDB();
        showToast("Saved to My Batches!");
        if (btn) {
          btn.className = "col-span-2 py-2.5 font-extrabold rounded-xl text-xs flex items-center justify-center space-x-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20 transition-all";
          btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Saved</span>';
        }
      }
    }

    // =========================================================================
    //                        VIEW 4: COURSE SYLLABUS LAYOUT
    // =========================================================================
    async function renderCourseStructure(courseId) {
      showLoader();

      try {
        let courseName = "Syllabus Outline";
        let foundCourse = null;

        // Trace active course metadata
        Object.values(appState.courseCache).flat().forEach(c => {
          if (c && String(c.courseId) === String(courseId)) foundCourse = c;
        });
        if (!foundCourse) {
          foundCourse = appState.myBatches.find(b => String(b.courseId) === String(courseId));
        }

        if (foundCourse) {
          courseName = foundCourse.courseName;
          appState.currentCourseId = courseId;
        }

        setBreadcrumbs([
          { name: 'All Batches', link: '#/all-courses' },
          { name: courseName, link: '#/course/' + courseId }
        ]);

        if (!appState.structureCache[courseId]) {
          const res = await fetch('/api/getCourseStructure?courseId=' + courseId);
          const data = await res.json();

          const categories = [];
          const categoryList = data?.data?.categoryList || [];
          
          categoryList.forEach(c => {
            const categoryIdVal = c.id;
            const categoryNameVal = c.categoryName;
            
            const subCategoryList = c.subCategory || [];
            subCategoryList.forEach(s => {
              categories.push({
                categoryId: categoryIdVal,
                categoryName: categoryNameVal,
                subCategoryId: s.subCategoryId,
                subCategoryName: s.subCategory
              });
            });
          });

          appState.structureCache[courseId] = categories;
        }

        const chapters = appState.structureCache[courseId];
        const viewport = document.getElementById('dynamic-viewport');
        if (!viewport) return;

        if (!chapters || chapters.length === 0) {
          viewport.innerHTML = `
            <div class="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/30 max-w-xl mx-auto">
              <div class="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <i class="fa-solid fa-folder-open text-slate-500 text-lg"></i>
              </div>
              <h4 class="text-slate-300 font-bold text-sm">Syllabus Empty</h4>
              <p class="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">Class sessions are not published inside this workspace layout yet.</p>
              <a href="#/all-courses" class="mt-5 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl inline-block hover:bg-slate-800">
                <i class="fa-solid fa-chevron-left mr-1.5"></i>Return to Catalog
              </a>
            </div>
          `;
          return;
        }

        // Logical grouping by subject categories
        const grouped = {};
        chapters.forEach(chap => {
          if (!grouped[chap.categoryName]) {
            grouped[chap.categoryName] = {
              id: chap.categoryId,
              subtopics: []
            };
          }
          grouped[chap.categoryName].subtopics.push(chap);
        });

        const isAddedInMyList = appState.myBatches.some(b => String(b.courseId) === String(courseId));

        let html = `
          <div class="relative p-6 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="space-y-1">
              <span class="text-[9px] font-extrabold text-violet-400 uppercase tracking-widest block">Lectures Feed Portal</span>
              <h2 class="text-base sm:text-lg font-extrabold text-slate-100 leading-tight">${courseName}</h2>
              <p class="text-slate-500 text-xs">Explore course chapters. Access videos and complete PDF study material.</p>
            </div>
            
            <button onclick='toggleQuickBatch(${JSON.stringify(foundCourse).replace(/'/g, "&apos;")})'
                    id="quick-add-action"
                    class="px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-2 transition-all ${isAddedInMyList ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-brand-600 hover:bg-brand-500 text-white'}">
              ${isAddedInMyList ? '<i class="fa-solid fa-circle-check"></i><span>Saved to My Batches</span>' : '<i class="fa-solid fa-plus"></i><span>Save to My Batches</span>'}
            </button>
          </div>

          <div class="space-y-6">
        `;

        for (const [categoryName, dataObj] of Object.entries(grouped)) {
          html += `
            <div class="bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden">
              <div class="px-5 py-4 bg-[#121826] border-b border-slate-800/80 flex items-center space-x-3">
                <span class="w-8 h-8 bg-brand-950 text-brand-400 rounded-lg flex items-center justify-center text-xs font-bold border border-brand-800">
                  <i class="fa-solid fa-folder"></i>
                </span>
                <h3 class="text-xs sm:text-sm font-bold text-slate-200">${categoryName}</h3>
              </div>
              <div class="divide-y divide-slate-800/40 bg-[#0c101a]/40">
          `;

          dataObj.subtopics.forEach(sub => {
            html += `
              <a href="#/course/${courseId}/chapter/${sub.categoryId}/${sub.subCategoryId}" 
                 class="px-5 py-4 flex items-center justify-between hover:bg-slate-900/60 transition-all duration-200 group">
                <div class="flex items-center space-x-4 pr-4">
                  <span class="text-slate-500 group-hover:text-brand-300 transition-colors">
                    <i class="fa-regular fa-circle-play text-xs sm:text-sm"></i>
                  </span>
                  <span class="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors line-clamp-1">
                    ${sub.subCategoryName}
                  </span>
                </div>
                <div class="flex items-center space-x-1.5 text-slate-500 group-hover:text-slate-300 transition-all text-xs shrink-0">
                  <span>Enter Lectures</span>
                  <i class="fa-solid fa-chevron-right text-[9px] group-hover:translate-x-0.5 transition-transform"></i>
                </div>
              </a>
            `;
          });

          html += `
              </div>
            </div>
          `;
        }

        html += `</div>`;
        viewport.innerHTML = html;

      } catch (err) {
        showFailedState('dynamic-viewport', err.message, '#/course/' + courseId);
      }
    }

    function toggleQuickBatch(courseObj) {
      if (!courseObj) return;
      const index = appState.myBatches.findIndex(b => String(b.courseId) === String(courseObj.courseId));
      const btn = document.getElementById('quick-add-action');

      if (index > -1) {
        appState.myBatches.splice(index, 1);
        saveDB();
        showToast("Removed from Dashboard List");
        if (btn) {
          btn.className = "px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white transition-all";
          btn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Save to My Batches</span>';
        }
      } else {
        appState.myBatches.push(courseObj);
        saveDB();
        showToast("Pinned to Dashboard!");
        if (btn) {
          btn.className = "px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-2 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 transition-all";
          btn.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>Saved to My Batches</span>';
        }
      }
    }

    // =========================================================================
    //                    VIEW 5: CHAPTER LESSONS (VIDEOS FEED)
    // =========================================================================
    async function renderChapterLessons(courseId, categoryId, subCategoryId) {
      showLoader();

      try {
        let courseName = "Course Outline";
        let foundCourse = null;
        Object.values(appState.courseCache).flat().forEach(c => {
          if (c && String(c.courseId) === String(courseId)) foundCourse = c;
        });
        if (!foundCourse) {
          foundCourse = appState.myBatches.find(b => String(b.courseId) === String(courseId));
        }
        if (foundCourse) courseName = foundCourse.courseName;

        let chapterName = "Lessons Feed";
        if (appState.structureCache[courseId]) {
          const matchedChapter = appState.structureCache[courseId].find(
            s => String(s.categoryId) === String(categoryId) && String(s.subCategoryId) === String(subCategoryId)
          );
          if (matchedChapter) chapterName = matchedChapter.subCategoryName;
        }

        setBreadcrumbs([
          { name: 'All Batches', link: '#/all-courses' },
          { name: courseName, link: '#/course/' + courseId },
          { name: chapterName, link: '#' }
        ]);

        const res = await fetch(`/api/getCourseVideos?courseId=${courseId}&categoryId=${categoryId}&subCategoryId=${subCategoryId}`);
        const data = await res.json();
        const videos = data?.data?.courseVideo || [];

        const viewport = document.getElementById('dynamic-viewport');
        if (!viewport) return;

        if (videos.length === 0) {
          viewport.innerHTML = `
            <div class="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/30 max-w-xl mx-auto">
              <div class="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <i class="fa-regular fa-file-video text-slate-500 text-lg"></i>
              </div>
              <h4 class="text-slate-300 font-bold text-sm">Lectures Unreleased</h4>
              <p class="text-slate-500 text-xs mt-1.5 max-w-xs mx-auto">Sessions under this subchapter have not been synchronized yet.</p>
              <a href="#/course/${courseId}" class="mt-5 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl inline-block hover:bg-slate-800">
                <i class="fa-solid fa-chevron-left mr-1.5"></i>Return to Chapters
              </a>
            </div>
          `;
          return;
        }

        let html = `
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="space-y-1">
              <span class="text-[9px] font-extrabold text-violet-400 uppercase tracking-widest block">Chapter Video Archives</span>
              <h2 class="text-base sm:text-lg font-extrabold text-slate-200 leading-tight">${chapterName}</h2>
              <p class="text-slate-500 text-xs">Access video lectures chronological to their live dates alongside reference board sheets.</p>
            </div>
            
            <a href="#/course/${courseId}" class="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 rounded-xl transition-colors flex items-center space-x-1.5 shrink-0 self-start sm:self-center">
              <i class="fa-solid fa-chevron-left"></i>
              <span>Back to Syllabus</span>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        `;

        // Reverse sequence of array to write chronologically (Oldest first)
        const chronological = [...videos].reverse();

        chronological.forEach(video => {
          const title = video.title || 'Live Interactive Class Session';
          const videoLink = video.url || video.Url || '';
          const pdfLink = video.pdfUrl || '';
          const rawDate = video.eventDateTime || '';
          const displayDate = formatDisplayDate(rawDate);
          
          const videoThumb = getYTThumb(videoLink);

          html += `
            <div class="group relative premium-card rounded-2xl overflow-hidden flex flex-col justify-between h-full">
              <!-- Thumbnail Container -->
              <div class="relative aspect-video bg-black overflow-hidden">
                <img src="${videoThumb}" alt="${title}" class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/20 to-transparent"></div>
                
                ${videoLink ? `
                  <button onclick="launchVideo('${videoLink}', '${title.replace(/'/g, "\\'")}')" 
                          class="absolute inset-0 m-auto w-12 h-12 bg-brand-600 hover:bg-brand-500 rounded-full flex items-center justify-center text-white text-sm shadow-xl hover:scale-105 transition-all border border-brand-400/20">
                    <i class="fa-solid fa-play translate-x-0.5"></i>
                  </button>
                ` : ''}

                ${displayDate ? `
                  <div class="absolute bottom-3 left-3">
                    <span class="px-2 py-0.5 bg-slate-950/80 text-[10px] font-semibold text-slate-300 rounded-lg border border-slate-800/50">
                      ${displayDate}
                    </span>
                  </div>
                ` : ''}
              </div>

              <!-- Content Body -->
              <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 class="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed tracking-wide mb-4">
                    ${title}
                  </h3>
                </div>

                <div class="grid grid-cols-2 gap-2.5 border-t border-slate-800/60 pt-4">
                  ${videoLink ? `
                    <button onclick="launchVideo('${videoLink}', '${title.replace(/'/g, "\\'")}')" 
                            class="py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-brand-600/10">
                      <i class="fa-regular fa-circle-play"></i>
                      <span>Watch</span>
                    </button>
                  ` : `
                    <button disabled class="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold select-none cursor-not-allowed">
                      No Media
                    </button>
                  `}

                  ${pdfLink ? `
                    <a href="${pdfLink}" target="_blank" 
                       class="py-2.5 bg-[#121826] hover:bg-slate-800 hover:text-white text-slate-300 border border-slate-800 hover:border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors">
                      <i class="fa-regular fa-file-pdf text-red-400"></i>
                      <span>Notes PDF</span>
                    </a>
                  ` : `
                    <button disabled class="py-2.5 bg-slate-900/40 text-slate-600 rounded-xl text-xs font-bold select-none cursor-not-allowed">
                      No Notes
                    </button>
                  `}
                </div>
              </div>
            </div>
          `;
        });

        html += `</div>`;
        viewport.innerHTML = html;

      } catch (err) {
        showFailedState('dynamic-viewport', err.message, `#/course/${courseId}/chapter/${categoryId}/${subCategoryId}`);
      }
    }

    // =========================================================================
    //                        MODAL MEDIA CONTROLLERS
    // =========================================================================
    function launchVideo(url, title) {
      const ytId = getYTID(url);
      if (!ytId) {
        // Fallback for non-youtube links
        window.open(url, '_blank');
        return;
      }

      const modal = document.getElementById('player-modal');
      const iframe = document.getElementById('player-iframe');
      const titleDisplay = document.getElementById('player-title');
      const ytButton = document.getElementById('player-youtube-btn');

      if (!modal || !iframe) return;

      titleDisplay.innerText = title;
      iframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
      ytButton.href = url;

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closePlayer() {
      const modal = document.getElementById('player-modal');
      const iframe = document.getElementById('player-iframe');
      
      if (!modal || !iframe) return;
      
      iframe.src = "";
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    // =========================================================================
    //                        INITIAL MOUNT LISTENERS
    // =========================================================================
    window.addEventListener('DOMContentLoaded', () => {
      initDB();
      handleHashRouting();
    });

    window.addEventListener('hashchange', handleHashRouting);
  </script>
</body>
</html>`;
}