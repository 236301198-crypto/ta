// ==========================================
// TEACHERS ACADEMY - Cloudflare Worker Script
// Powered by Classwalla Backend Scraper V2
// Compiled & Customized by Naveen
// ==========================================

const DEFAULT_TOKEN = "4fg1iZcgrW2X8QsF0DpX0ekBNZSNmugOWw9TJWVX5cTmYX4il3VIO%2B1lP6eCPAxoj93%2BhuIgNm03oQ1sCIkmv4zjcEdZwiTA5kpS8WG9VH9tQ6nsKQRDDjSzcQCQpASTHpGzOr%2F4vCIOahj4Z%2FMrQ2eud8PtLvIp1xit7EARO18%3D";
const decodedToken = decodeURIComponent(DEFAULT_TOKEN);

// Standard HTTP Headers to keep request context authentic
const PROXY_HEADERS = {
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

/**
 * Handles incoming requests: Route proxy API calls or serve the SPA HTML page.
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    if (path === '/api/categories') {
      return await handleGetCategories();
    } else if (path === '/api/courses') {
      return await handleGetCourses(url);
    } else if (path === '/api/course-structure') {
      return await handleGetCourseStructure(url);
    } else if (path === '/api/course-videos') {
      return await handleGetCourseVideos(url);
    }

    // Default route: Serve Frontend Client SPA
    return new Response(getHTMLTemplate(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// ==========================================
// CLASSWALLA BACKEND PROXY HANDLERS
// ==========================================

/**
 * Step 1 Proxy: Fetches all available Course Categories
 */
async function handleGetCategories() {
  const boundary = 'f30abafb-92e2-4b52-bf44-12df495babc3';
  const apiEndpoint = "https://backend.classwalla.com/coursecategory/v1/getCourseCategory";
  
  const payloadBody = JSON.stringify({
    data: { companyId: 46 },
    token: decodedToken
  });

  const rawMultipart = `--${boundary}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${payloadBody}\r\n--${boundary}--\r\n`;

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      ...PROXY_HEADERS,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: rawMultipart
  });

  const data = await response.json();
  return createJSONResponse(data);
}

/**
 * Step 2 & 3 Proxy: Cascades Layout extraction and resolves actual subcategory list.
 */
async function handleGetCourses(url) {
  const categoryId = url.searchParams.get('categoryId');
  if (!categoryId) {
    return createJSONResponse({ error: "Missing categoryId query parameter" }, 400);
  }

  // --- SUB-STEP A: Fetch Layout V2 to extract subcategoryId ---
  const layoutBoundary = '276b3148-2c4f-406a-9d76-a4379e9e122c';
  const layoutEndpoint = "https://backend.classwalla.com/coursecategory/v1/getLayoutV2";
  
  const layoutPayload = JSON.stringify({
    data: {
      candidateId: "",
      categoryId: parseInt(categoryId),
      companyId: 46,
      limit: "100",
      offset: "0"
    },
    token: decodedToken
  });

  const layoutMultipart = `--${layoutBoundary}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${layoutPayload}\r\n--${layoutBoundary}--\r\n`;

  const layoutResponse = await fetch(layoutEndpoint, {
    method: 'POST',
    headers: {
      ...PROXY_HEADERS,
      'Content-Type': `multipart/form-data; boundary=${layoutBoundary}`
    },
    body: layoutMultipart
  });

  const layoutJson = await layoutResponse.json();
  const subcatId = layoutJson?.data?.layout?.[0]?.id;

  if (!subcatId) {
    return createJSONResponse({ error: "No subcategory layout found for category" }, 404);
  }

  // --- SUB-STEP B: Query Courses using extracted subcategoryId ---
  const subcatBoundary = '1af43917-9fc4-43d6-8f6a-dc58aaa6ccef';
  const subcatEndpoint = "https://backend.classwalla.com/coursecategory/v1/getCoursesBySubCat";

  const subcatPayload = JSON.stringify({
    data: {
      limit: "100",
      offset: "0",
      searchString: "",
      subcatId: String(subcatId)
    },
    token: decodedToken
  });

  const subcatMultipart = `--${subcatBoundary}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${subcatPayload}\r\n--${subcatBoundary}--\r\n`;

  const coursesResponse = await fetch(subcatEndpoint, {
    method: 'POST',
    headers: {
      ...PROXY_HEADERS,
      'Content-Type': `multipart/form-data; boundary=${subcatBoundary}`
    },
    body: subcatMultipart
  });

  const coursesJson = await coursesResponse.json();
  return createJSONResponse(coursesJson);
}

/**
 * Step 4 Proxy: Retrieves Course Chapters structure (categories and subcategories)
 */
async function handleGetCourseStructure(url) {
  const courseId = url.searchParams.get('courseId');
  if (!courseId) {
    return createJSONResponse({ error: "Missing courseId query parameter" }, 400);
  }

  const endpoint = 'https://backend.classwalla.com/course/course/getCourseCategories';
  
  const payload = {
    body: JSON.stringify({
      data: { courseId: String(courseId) },
      token: decodedToken
    })
  };

  const formEncoded = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    formEncoded.append(key, value);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...LEGACY_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formEncoded.toString()
  });

  const data = await response.json();
  return createJSONResponse(data);
}

/**
 * Step 5 Proxy: Fetches lessons, video URL feeds and class note PDFs under a specific topic
 */
async function handleGetCourseVideos(url) {
  const courseId = url.searchParams.get('courseId');
  const categoryId = url.searchParams.get('categoryId');
  const subCategoryId = url.searchParams.get('subCategoryId');

  if (!courseId || !categoryId || !subCategoryId) {
    return createJSONResponse({ error: "Missing required filtering query parameters" }, 400);
  }

  const endpoint = 'https://backend.classwalla.com/candidate/candidate/getCourseVideos';

  const payload = {
    body: JSON.stringify({
      data: {
        courseId: String(courseId),
        filters: {
          videoCategory: String(categoryId),
          videoSubCategory: String(subCategoryId)
        },
        limit: "1000",
        offset: "0"
      },
      token: decodedToken
    })
  };

  const formEncoded = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    formEncoded.append(key, value);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...LEGACY_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formEncoded.toString()
  });

  const data = await response.json();
  return createJSONResponse(data);
}

/**
 * Helper to generate optimized JSON Response objects
 */
function createJSONResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
}

// ==========================================
// SPA FRONTEND TEMPLATE (HTML, TAILWIND, JS)
// ==========================================
function getHTMLTemplate() {
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEACHERS ACADEMY | Online Learning Portal</title>
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts - Inter -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
          },
          colors: {
            brand: {
              50: '#f5f3ff',
              100: '#edd8ff',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
              900: '#4c1d95',
            }
          }
        }
      }
    }
  </script>

  <style>
    /* Premium visual features */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #0f172a;
    }
    ::-webkit-scrollbar-thumb {
      background: #1e293b;
      border-radius: 9999px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #334155;
    }
    .blur-glass {
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .card-glowing {
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .card-glowing::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1px;
      background: linear-gradient(to bottom right, rgba(139,92,246,0.3), transparent);
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
    }
    .card-glowing:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px -5px rgba(139, 92, 246, 0.15), 0 8px 10px -6px rgba(139, 92, 246, 0.1);
    }
  </style>
</head>
<body class="bg-[#0b0f19] text-slate-100 font-sans min-h-screen flex flex-col antialiased">

  <!-- ================= HEADER SECTION ================= -->
  <header class="sticky top-0 z-40 border-b border-slate-800/80 blur-glass">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      
      <!-- Brand Logo / Identity -->
      <a href="#/my-batches" class="flex items-center space-x-3 group transition-transform duration-200">
        <div class="relative w-12 h-12 rounded-xl overflow-hidden border border-brand-500/30 group-hover:scale-105 transition-transform">
          <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
               alt="Logo" class="w-full h-full object-cover">
        </div>
        <div>
          <div class="flex items-center space-x-1.5">
            <h1 class="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-200">
              TEACHERS ACADEMY
            </h1>
          </div>
          <p class="text-[10px] font-semibold text-violet-400/90 tracking-widest uppercase flex items-center">
            <span>By Naveen</span>
            <span class="mx-1.5">•</span>
            <span class="text-emerald-400 flex items-center"><span class="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-1 animate-pulse"></span>Verified Portal</span>
          </p>
        </div>
      </a>

      <!-- Horizontal Navigation Tabs -->
      <nav class="flex space-x-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/50">
        <a href="#/my-batches" id="nav-my-batches" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2">
          <i class="fa-solid fa-graduation-cap"></i>
          <span>My Batches</span>
          <span id="badge-my-batches" class="hidden px-1.5 py-0.5 text-[10px] bg-brand-600 text-white rounded-full">0</span>
        </a>
        <a href="#/all-courses" id="nav-all-courses" class="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2">
          <i class="fa-solid fa-compass"></i>
          <span>All Batches</span>
        </a>
      </nav>

    </div>
  </header>

  <!-- ================= BREADCRUMBS BAR ================= -->
  <div class="bg-slate-900/40 border-b border-slate-800/30 py-3.5">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex flex-wrap items-center space-x-2 text-sm text-slate-400" id="breadcrumbs">
        <!-- Rendered Dynamically -->
        <span class="text-slate-500">Loading Navigation Router...</span>
      </nav>
    </div>
  </div>

  <!-- ================= MAIN CONTAINER ================= -->
  <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div id="view-container" class="space-y-8">
      <!-- Active App State Rendered Dynamically Here -->
    </div>
  </main>

  <!-- ================= MODAL: INLINE VIDEO PLAYER ================= -->
  <div id="video-modal" class="fixed inset-0 z-50 hidden flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
    <div class="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-slate-800">
        <div class="flex items-center space-x-3">
          <span class="p-2 bg-brand-900/30 text-brand-400 rounded-lg text-xs font-bold uppercase tracking-wider">Now Playing</span>
          <h3 id="modal-video-title" class="text-base font-semibold text-slate-100 truncate max-w-md">Lesson Stream</h3>
        </div>
        <button onclick="closeVideoModal()" class="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
      <!-- Video Container -->
      <div class="aspect-video bg-black relative">
        <iframe id="modal-youtube-iframe" class="absolute inset-0 w-full h-full border-0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
      <!-- Action Footer -->
      <div class="flex flex-wrap gap-3 items-center justify-between p-4 bg-slate-950/50">
        <div class="text-xs text-slate-400 flex items-center">
          <i class="fa-solid fa-circle-info mr-1.5 text-brand-400"></i>
          <span>Interactive player mode is optimized for instant loading.</span>
        </div>
        <a id="modal-external-link" target="_blank" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors">
          <i class="fa-brands fa-youtube text-red-500"></i>
          <span>Watch on YouTube App</span>
        </a>
      </div>
    </div>
  </div>

  <!-- ================= FOOTER ================= -->
  <footer class="mt-auto border-t border-slate-900 bg-slate-950 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center space-x-2">
        <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
             alt="Logo" class="w-6 h-6 rounded-md">
        <span class="text-xs font-semibold text-slate-400">&copy; 2026 TEACHERS ACADEMY by Naveen. All rights secured.</span>
      </div>
      <div class="flex items-center space-x-4 text-xs text-slate-500">
        <span>Powered safely via decentralized proxy cloud worker.</span>
      </div>
    </div>
  </footer>

  <!-- ================= ROUTER ENGINE & APP SCRIPT ================= -->
  <script>
    // State memory variables
    const state = {
      myBatches: [],
      categoriesCache: [],
      coursesCache: {}, // categoryId -> courses
      chaptersCache: {}, // courseId -> chapters
      currentCourse: null,
      currentCategory: null,
      currentChapter: null
    };

    // Initialize state from Storage
    function initLocalStorage() {
      const saved = localStorage.getItem('ta_my_batches');
      if (saved) {
        try {
          state.myBatches = JSON.parse(saved);
        } catch (e) {
          state.myBatches = [];
        }
      }
      updateMyBatchesBadge();
    }

    function saveLocalStorage() {
      localStorage.setItem('ta_my_batches', JSON.stringify(state.myBatches));
      updateMyBatchesBadge();
    }

    function updateMyBatchesBadge() {
      const badge = document.getElementById('badge-my-batches');
      if (badge) {
        if (state.myBatches.length > 0) {
          badge.innerText = state.myBatches.length;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
    }

    // Router matching map
    const routes = [
      { path: /^\/my-batches$/, action: viewMyBatches },
      { path: /^\/all-courses$/, action: viewAllCategories },
      { path: /^\/category\/([^\/]+)$/, action: viewCategoryCourses },
      { path: /^\/course\/([^\/]+)$/, action: viewCourseStructure },
      { path: /^\/course\/([^\/]+)\/chapter\/([^\/]+)\/([^\/]+)$/, action: viewChapterLessons }
    ];

    function runRouter() {
      const hash = window.location.hash.slice(1) || '/my-batches';
      
      // Update Navbar highlights
      const navMyBatches = document.getElementById('nav-my-batches');
      const navAllCourses = document.getElementById('nav-all-courses');
      
      if (hash.startsWith('/my-batches')) {
        navMyBatches.className = "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 bg-brand-600 text-white shadow-lg shadow-brand-600/10";
        navAllCourses.className = "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900";
      } else {
        navAllCourses.className = "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 bg-brand-600 text-white shadow-lg shadow-brand-600/10";
        navMyBatches.className = "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900";
      }

      for (const route of routes) {
        const match = hash.match(route.path);
        if (match) {
          route.action(...match.slice(1));
          return;
        }
      }
      
      // Fallback
      window.location.hash = '#/my-batches';
    }

    // ==========================================
    // UTILITY HELPER FUNCTIONS
    // ==========================================

    function getYouTubeID(url) {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }

    function getYoutubeThumbnail(url) {
      const id = getYouTubeID(url);
      if (id) {
        return "https://img.youtube.com/vi/" + id + "/mqdefault.jpg";
      }
      return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80"; // fallback
    }

    function generateCourseThumb(courseName, defaultUrl) {
      if (defaultUrl && defaultUrl !== "" && defaultUrl !== "null" && defaultUrl !== null) {
        return defaultUrl;
      }
      // Compute beautiful procedural thumbnail if classwalla sends empty string
      const colors = [
        ['from-indigo-600', 'to-violet-800'],
        ['from-purple-600', 'to-pink-800'],
        ['from-cyan-600', 'to-indigo-800'],
        ['from-slate-700', 'to-slate-900'],
        ['from-emerald-600', 'to-teal-800']
      ];
      const charCode = courseName.charCodeAt(0) || 0;
      const selectedColor = colors[charCode % colors.length];
      
      return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80';
    }

    function formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          return dateStr.split(' ')[0] || '';
        }
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch (e) {
        return dateStr;
      }
    }

    // Update Breadcrumbs based on active level
    function setBreadcrumbs(crumbs) {
      const container = document.getElementById('breadcrumbs');
      if (!container) return;
      
      let html = \`
        <a href="#/my-batches" class="hover:text-violet-400 flex items-center space-x-1 transition-colors">
          <i class="fa-solid fa-house text-xs"></i>
          <span>Home</span>
        </a>
      \`;

      crumbs.forEach((c, index) => {
        html += \`
          <span class="text-slate-600">/</span>
          \`;
        if (index === crumbs.length - 1) {
          html += \`<span class="text-slate-200 font-medium truncate max-w-[200px] md:max-w-xs inline-block">\${c.name}</span>\`;
        } else {
          html += \`<a href="\${c.link}" class="hover:text-violet-400 transition-colors truncate max-w-[150px] inline-block">\${c.name}</a>\`;
        }
      });

      container.innerHTML = html;
    }

    // Modal Video Controllers
    function playVideo(url, title) {
      const youtubeId = getYouTubeID(url);
      if (!youtubeId) {
        // Fallback to plain opening if not YT
        window.open(url, '_blank');
        return;
      }

      document.getElementById('modal-video-title').innerText = title;
      document.getElementById('modal-youtube-iframe').src = "https://www.youtube.com/embed/" + youtubeId + "?autoplay=1&rel=0";
      document.getElementById('modal-external-link').href = url;
      
      const modal = document.getElementById('video-modal');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }

    function closeVideoModal() {
      const modal = document.getElementById('video-modal');
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.getElementById('modal-youtube-iframe').src = "";
    }

    // Fetch dynamic content with API proxy routes
    async function apiFetch(endpoint) {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error("HTTP connection failed: " + response.status);
        }
        return await response.json();
      } catch (error) {
        console.error("API error fetching: " + endpoint, error);
        throw error;
      }
    }

    // Render global loading spinner
    function renderLoading(containerId) {
      document.getElementById(containerId).innerHTML = \`
        <div class="flex flex-col items-center justify-center py-20 space-y-4">
          <div class="relative w-12 h-12">
            <div class="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
          <p class="text-slate-400 text-sm font-medium animate-pulse">Syncing platform resources...</p>
        </div>
      \`;
    }

    // Render generalized Error message block
    function renderError(containerId, message, retryHash) {
      document.getElementById(containerId).innerHTML = \`
        <div class="max-w-md mx-auto text-center py-16 px-4">
          <div class="w-16 h-16 bg-red-900/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/10">
            <i class="fa-solid fa-triangle-exclamation text-2xl"></i>
          </div>
          <h3 class="text-lg font-bold text-slate-200 mb-2">Request Failed</h3>
          <p class="text-slate-400 text-sm mb-6">\${message}</p>
          <a href="\${retryHash}" class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-sm font-semibold transition-all">
            <i class="fa-solid fa-arrows-rotate mr-2"></i>Try Again
          </a>
        </div>
      \`;
    }

    // ==========================================
    // VIEW 1: MY BATCHES (HOME TAB)
    // ==========================================
    function viewMyBatches() {
      setBreadcrumbs([]);
      const container = document.getElementById('view-container');
      
      if (state.myBatches.length === 0) {
        container.innerHTML = \`
          <!-- Dashboard Greeting Hero -->
          <div class="relative bg-gradient-to-r from-brand-900/40 via-slate-900 to-indigo-950/20 rounded-2xl border border-slate-800/80 p-8 overflow-hidden">
            <div class="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="relative z-10 max-w-xl">
              <h2 class="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 text-slate-100">
                Welcome back to your Study Desk!
              </h2>
              <p class="text-slate-400 text-sm mb-6 leading-relaxed">
                You have not registered any batches inside your custom device locker yet. Navigate to the Explorer to discover live batches and save them offline!
              </p>
              <a href="#/all-courses" class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-brand-600/20 inline-flex items-center space-x-2 transition-all">
                <i class="fa-solid fa-magnifying-glass"></i>
                <span>Explore Catalog</span>
              </a>
            </div>
          </div>
          
          <!-- Empty Dashboard UI placeholder -->
          <div class="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <div class="w-16 h-16 bg-slate-900/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
              <i class="fa-solid fa-folder-open text-slate-500 text-xl"></i>
            </div>
            <h4 class="text-slate-300 font-bold text-base">Your Dashboard is Empty</h4>
            <p class="text-slate-500 text-xs mt-1 max-w-xs mx-auto">Explore courses and click "Add to My Batches" to persist lectures and materials inside this space.</p>
          </div>
        \`;
        return;
      }

      // Render interactive Dashboard UI
      let html = \`
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold tracking-tight text-slate-200">My Saved Batches</h2>
            <p class="text-slate-500 text-xs mt-1">Locker persistent storage verified on this browser workspace.</p>
          </div>
          
          <!-- Quick Status Dashboard Widget -->
          <div class="grid grid-cols-2 gap-4 bg-slate-900/40 border border-slate-800 p-3 rounded-xl divide-x divide-slate-800 max-w-sm w-full md:w-auto">
            <div class="px-4 text-center">
              <span class="text-[10px] text-slate-500 uppercase tracking-widest block">Active Batches</span>
              <span class="text-lg font-bold text-slate-200">\${state.myBatches.length}</span>
            </div>
            <div class="px-4 text-center">
              <span class="text-[10px] text-slate-500 uppercase tracking-widest block">Storage Sync</span>
              <span class="text-xs font-bold text-emerald-400 mt-1.5 inline-flex items-center">
                <i class="fa-solid fa-cloud mr-1"></i>Saved
              </span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      \`;

      state.myBatches.forEach(b => {
        const resolvedThumb = generateCourseThumb(b.courseName, b.cthumb || b.courseThumbnail);
        html += \`
          <div class="group bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden card-glowing flex flex-col h-full">
            <div class="relative aspect-video bg-slate-950 overflow-hidden">
              <img src="\${resolvedThumb}" alt="\${b.courseName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
              <div class="absolute top-3 left-3">
                <span class="px-2.5 py-1 bg-brand-600/90 blur-glass text-[10px] font-bold text-white uppercase tracking-wider rounded-md border border-brand-500/20">
                  ACTIVE BATCH
                </span>
              </div>
            </div>
            <div class="p-5 flex-grow flex flex-col justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                  \${b.courseName}
                </h3>
                <div class="mt-2.5 flex items-center space-x-1.5 text-xs text-slate-400">
                  <span class="text-violet-400 font-semibold">\${b.price === "0" ? "Free Batch" : "₹" + b.price}</span>
                </div>
              </div>
              <div class="mt-5 grid grid-cols-5 gap-2 border-t border-slate-800/80 pt-4">
                <a href="#/course/\${b.courseId}" class="col-span-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs text-center flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/15 transition-all">
                  <i class="fa-solid fa-graduation-cap"></i>
                  <span>Enter Lectures</span>
                </a>
                <button onclick="removeFromMyBatches('\${b.courseId}')" class="col-span-1 p-2 bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-xl text-xs border border-slate-700/50 hover:border-red-500/20 flex items-center justify-center transition-colors" title="Remove Batch from storage">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        \`;
      });

      html += \`</div>\`;
      container.innerHTML = html;
    }

    // ==========================================
    // VIEW 2: CATEGORIES (ALL BATCHES START POINT)
    // ==========================================
    async function viewAllCategories() {
      setBreadcrumbs([{ name: 'Explore Batches', link: '#/all-courses' }]);
      const container = document.getElementById('view-container');
      
      renderLoading('view-container');

      try {
        if (state.categoriesCache.length === 0) {
          const res = await apiFetch('/api/categories');
          state.categoriesCache = res?.data?.courseCategory || [];
        }

        if (state.categoriesCache.length === 0) {
          renderError('view-container', "No curriculum streams were resolved in backend databases.", '#/all-courses');
          return;
        }

        // Render Premium categories view grid
        let html = \`
          <div>
            <h2 class="text-xl font-bold text-slate-200">Curriculum Streams</h2>
            <p class="text-slate-500 text-xs mt-1">Select your targeted domain or specific academic board to view active batch modules.</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        \`;

        state.categoriesCache.forEach((cc, idx) => {
          // Unique design gradients for category tiles
          const gradients = [
            'from-violet-600/10 via-slate-900 to-slate-900 border-violet-500/20 hover:border-violet-500/40 text-violet-400',
            'from-indigo-600/10 via-slate-900 to-slate-900 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400',
            'from-cyan-600/10 via-slate-900 to-slate-900 border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400',
            'from-purple-600/10 via-slate-900 to-slate-900 border-purple-500/20 hover:border-purple-500/40 text-purple-400',
            'from-emerald-600/10 via-slate-900 to-slate-900 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
          ];
          const chosenGrad = gradients[idx % gradients.length];

          html += \`
            <a href="#/category/\${cc.categoryId}" class="group block p-6 rounded-2xl border bg-gradient-to-br \${chosenGrad} transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-950/10 flex items-center justify-between">
              <div class="space-y-1.5 pr-4">
                <h3 class="font-bold text-slate-200 group-hover:text-white transition-colors text-base leading-snug">
                  \${cc.courseCategory}
                </h3>
                <span class="inline-block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  Explore Stream Courses
                </span>
              </div>
              <div class="w-10 h-10 rounded-xl bg-slate-800/80 group-hover:bg-brand-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-all">
                <i class="fa-solid fa-arrow-right text-xs group-hover:translate-x-0.5 transition-transform"></i>
              </div>
            </a>
          \`;
        });

        html += \`</div>\`;
        container.innerHTML = html;

      } catch (err) {
        renderError('view-container', "Failed connecting proxy network pipelines. Verify system credentials.", '#/all-courses');
      }
    }

    // ==========================================
    // VIEW 3: COURSES WITHIN SPECIFIC CATEGORY
    // ==========================================
    async function viewCategoryCourses(categoryId) {
      renderLoading('view-container');

      try {
        // Resolve target Category title
        let categoryName = "Curriculum Streams";
        if (state.categoriesCache.length === 0) {
          const resCat = await apiFetch('/api/categories');
          state.categoriesCache = resCat?.data?.courseCategory || [];
        }
        const activeCat = state.categoriesCache.find(c => String(c.categoryId) === String(categoryId));
        if (activeCat) {
          categoryName = activeCat.courseCategory;
          state.currentCategory = activeCat;
        }

        setBreadcrumbs([
          { name: 'Explore Batches', link: '#/all-courses' },
          { name: categoryName, link: '#/category/' + categoryId }
        ]);

        // Query active courses for specified CategoryId
        if (!state.coursesCache[categoryId]) {
          const coursesRes = await apiFetch('/api/courses?categoryId=' + categoryId);
          
          let clists = [];
          if (coursesRes?.data?.candidateCourseList) {
            clists = coursesRes.data.candidateCourseList;
          } else if (coursesRes?.data?.layout?.[0]?.content) {
            clists = coursesRes.data.layout[0].content;
          }
          state.coursesCache[categoryId] = clists;
        }

        const courses = state.coursesCache[categoryId];
        const container = document.getElementById('view-container');

        if (!courses || courses.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 max-w-xl mx-auto">
              <div class="w-16 h-16 bg-slate-900/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <i class="fa-solid fa-graduation-cap text-slate-500 text-xl"></i>
              </div>
              <h4 class="text-slate-300 font-bold text-base">No Batches Available</h4>
              <p class="text-slate-500 text-xs mt-1 max-w-xs mx-auto">No currently active modules were compiled under this curriculum stream block.</p>
              <a href="#/all-courses" class="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg inline-block hover:bg-slate-800">
                <i class="fa-solid fa-arrow-left mr-1.5"></i>Return to All Streams
              </a>
            </div>
          \`;
          return;
        }

        // Render fully polished course cards list
        let html = \`
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold tracking-tight text-slate-200">\${categoryName}</h2>
              <p class="text-slate-500 text-xs mt-1">Browse active batches and register them to save to your local study cabinet.</p>
            </div>
            
            <!-- Quick Live Filter Search Bar -->
            <div class="relative max-w-xs w-full">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <i class="fa-solid fa-magnifying-glass text-xs"></i>
              </span>
              <input type="text" id="course-search-field" oninput="filterCourses(this.value)" placeholder="Search batch courses..." 
                     class="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="courses-grid-mount">
        \`;

        courses.forEach(c => {
          const isAdded = state.myBatches.some(b => String(b.courseId) === String(c.courseId));
          const resolvedThumb = generateCourseThumb(c.courseName, c.cthumb || c.courseThumbnail);
          
          html += \`
            <div class="group bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden card-glowing flex flex-col h-full course-search-card" data-title="\${c.courseName.toLowerCase()}">
              <div class="relative aspect-video bg-slate-950 overflow-hidden">
                <img src="\${resolvedThumb}" alt="\${c.courseName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90"></div>
                <div class="absolute top-3 left-3">
                  <span class="px-2.5 py-1 bg-slate-900/90 blur-glass text-[10px] font-bold text-slate-300 uppercase tracking-wider rounded-md border border-slate-700/20">
                    Live Session
                  </span>
                </div>
              </div>
              <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 class="text-sm font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-2 leading-snug">
                    \${c.courseName}
                  </h3>
                  <div class="mt-2 flex items-center space-x-1.5 text-xs text-slate-400">
                    <span class="text-violet-400 font-semibold">\${c.price === "0" ? "Free Admission" : "₹" + c.price}</span>
                  </div>
                </div>
                
                <div class="mt-5 grid grid-cols-5 gap-2 border-t border-slate-800/80 pt-4">
                  <a href="#/course/\${c.courseId}" class="col-span-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs text-center flex items-center justify-center space-x-1.5 transition-colors">
                    <span>View Chapters</span>
                  </a>
                  
                  <button id="add-btn-\${c.courseId}" onclick="toggleMyBatchRegister(\${JSON.stringify(c).replace(/"/g, '&quot;')})" 
                          class="col-span-2 py-2.5 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition-all \${isAdded ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20' : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/15'}"
                          \${isAdded ? 'title="Click to remove from dashboard"' : ''}>
                    \${isAdded ? '<i class="fa-solid fa-circle-check"></i> <span>Saved</span>' : '<i class="fa-solid fa-plus"></i> <span>Add</span>'}
                  </button>
                </div>
              </div>
            </div>
          \`;
        });

        html += \`</div>\`;
        container.innerHTML = html;

      } catch (err) {
        renderError('view-container', "Failed downloading list under category. Please re-authenticate.", '#/category/' + categoryId);
      }
    }

    // Interactive front-end filter for Course selection
    function filterCourses(query) {
      const formatted = query.toLowerCase().trim();
      const cards = document.getElementsByClassName('course-search-card');
      
      Array.from(cards).forEach(card => {
        const title = card.getAttribute('data-title');
        if (title.includes(formatted)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    }

    // Handles Adding & Removing courses from the local persistent storage (Dashboard)
    function toggleMyBatchRegister(courseObj) {
      const index = state.myBatches.findIndex(b => String(b.courseId) === String(courseObj.courseId));
      const btn = document.getElementById('add-btn-' + courseObj.courseId);
      
      if (index > -1) {
        // Remove
        state.myBatches.splice(index, 1);
        saveLocalStorage();
        if (btn) {
          btn.className = "col-span-2 py-2.5 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/15 transition-all";
          btn.innerHTML = '<i class="fa-solid fa-plus"></i> <span>Add</span>';
          btn.removeAttribute('title');
        }
      } else {
        // Add
        state.myBatches.push(courseObj);
        saveLocalStorage();
        if (btn) {
          btn.className = "col-span-2 py-2.5 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20 transition-all";
          btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Saved</span>';
          btn.setAttribute('title', 'Click to remove from dashboard');
        }
      }
    }

    function removeFromMyBatches(courseId) {
      state.myBatches = state.myBatches.filter(b => String(b.courseId) !== String(courseId));
      saveLocalStorage();
      viewMyBatches();
    }

    // ==========================================
    // VIEW 4: COURSE CHAPTERS STRUCTURE
    // ==========================================
    async function viewCourseStructure(courseId) {
      renderLoading('view-container');

      try {
        // Find course name context from cache or Storage
        let courseName = "Course Outline";
        let parentCategoryLink = "#/all-courses";
        
        let foundCourse = null;
        Object.values(state.coursesCache).flat().forEach(c => {
          if (c && String(c.courseId) === String(courseId)) foundCourse = c;
        });
        if (!foundCourse) {
          foundCourse = state.myBatches.find(b => String(b.courseId) === String(courseId));
        }

        if (foundCourse) {
          courseName = foundCourse.courseName;
          state.currentCourse = foundCourse;
          if (foundCourse.categoryId) {
            parentCategoryLink = "#/category/" + foundCourse.categoryId;
          }
        }

        setBreadcrumbs([
          { name: 'Explore Batches', link: '#/all-courses' },
          { name: courseName, link: '#/course/' + courseId }
        ]);

        if (!state.chaptersCache[courseId]) {
          const res = await apiFetch('/api/course-structure?courseId=' + courseId);
          
          // Formulate category/subcategory mapping
          const categories = [];
          const categoryList = res?.data?.categoryList || [];
          
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

          state.chaptersCache[courseId] = categories;
        }

        const chapters = state.chaptersCache[courseId];
        const container = document.getElementById('view-container');

        if (!chapters || chapters.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 max-w-xl mx-auto">
              <div class="w-16 h-16 bg-slate-900/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <i class="fa-solid fa-book-open text-slate-500 text-xl"></i>
              </div>
              <h4 class="text-slate-300 font-bold text-base">Chapters Not Found</h4>
              <p class="text-slate-500 text-xs mt-1 max-w-xs mx-auto">No chapters or sub-topic layouts are uploaded for this specific course feed yet.</p>
              <a href="#/all-courses" class="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg inline-block hover:bg-slate-800">
                <i class="fa-solid fa-arrow-left mr-1.5"></i>Return to Catalog
              </a>
            </div>
          \`;
          return;
        }

        // Group chapters logically by parent Chapter Topic for structured rendering
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

        let html = \`
          <div class="relative p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Lectures Feed Portal</span>
              <h2 class="text-lg font-bold text-slate-100 mt-1">\${courseName}</h2>
              <p class="text-slate-500 text-xs mt-0.5">Explore listed modules below. Select any chapter to access online classes and PDF resources.</p>
            </div>
            <div class="flex items-center space-x-3">
              <!-- Add to My Batches Quick Button inside view -->
              \${renderQuickLockerButton(foundCourse)}
            </div>
          </div>

          <div class="space-y-6">
        \`;

        for (const [categoryName, dataObj] of Object.entries(grouped)) {
          html += \`
            <div class="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div class="px-5 py-4 bg-slate-900 border-b border-slate-800/80 flex items-center space-x-3">
                <span class="w-8 h-8 bg-brand-900/30 text-brand-400 rounded-lg flex items-center justify-center text-sm font-bold border border-brand-500/15">
                  <i class="fa-solid fa-folder-closed"></i>
                </span>
                <h3 class="text-sm font-bold text-slate-200">\${categoryName}</h3>
              </div>
              <div class="divide-y divide-slate-800/60">
          \`;

          dataObj.subtopics.forEach(sub => {
            html += \`
              <a href="#/course/\${courseId}/chapter/\${sub.categoryId}/\${sub.subCategoryId}" 
                 class="px-5 py-4 flex items-center justify-between hover:bg-slate-900/60 transition-colors group">
                <div class="flex items-center space-x-4">
                  <span class="text-slate-500 group-hover:text-violet-400 transition-colors">
                    <i class="fa-regular fa-circle-play text-sm"></i>
                  </span>
                  <span class="text-xs font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">
                    \${sub.subCategoryName}
                  </span>
                </div>
                <div class="flex items-center space-x-2 text-slate-500 group-hover:text-slate-300 transition-colors text-xs">
                  <span>Enter Chapter</span>
                  <i class="fa-solid fa-angle-right text-[10px]"></i>
                </div>
              </a>
            \`;
          });

          html += \`
              </div>
            </div>
          \`;
        }

        html += \`</div>\`;
        container.innerHTML = html;

      } catch (err) {
        renderError('view-container', "Failed communicating chapters. Reload stream link.", '#/course/' + courseId);
      }
    }

    function renderQuickLockerButton(foundCourse) {
      if (!foundCourse) return "";
      const isAdded = state.myBatches.some(b => String(b.courseId) === String(foundCourse.courseId));
      
      return \`
        <button onclick="toggleMyBatchRegisterInsideChapters(\${JSON.stringify(foundCourse).replace(/"/g, '&quot;')})" 
                id="chapter-quick-add"
                class="px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all \${isAdded ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' : 'bg-brand-600 hover:bg-brand-500 text-white border-transparent'}">
          \${isAdded ? '<i class="fa-solid fa-check"></i><span>Locker Saved</span>' : '<i class="fa-solid fa-plus"></i><span>Save Batch</span>'}
        </button>
      \`;
    }

    function toggleMyBatchRegisterInsideChapters(courseObj) {
      const index = state.myBatches.findIndex(b => String(b.courseId) === String(courseObj.courseId));
      const btn = document.getElementById('chapter-quick-add');
      
      if (index > -1) {
        state.myBatches.splice(index, 1);
        saveLocalStorage();
        if (btn) {
          btn.className = "px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white border border-transparent transition-all";
          btn.innerHTML = '<i class="fa-solid fa-plus"></i><span>Save Batch</span>';
        }
      } else {
        state.myBatches.push(courseObj);
        saveLocalStorage();
        if (btn) {
          btn.className = "px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 transition-all";
          btn.innerHTML = '<i class="fa-solid fa-check"></i><span>Locker Saved</span>';
        }
      }
    }

    // ==========================================
    // VIEW 5: CHAPTER LESSONS (VIDEOS & PDFS)
    // ==========================================
    async function viewChapterLessons(courseId, categoryId, subCategoryId) {
      renderLoading('view-container');

      try {
        // Load parent outline metadata context
        let courseName = "Course Outline";
        let foundCourse = null;
        Object.values(state.coursesCache).flat().forEach(c => {
          if (c && String(c.courseId) === String(courseId)) foundCourse = c;
        });
        if (!foundCourse) {
          foundCourse = state.myBatches.find(b => String(b.courseId) === String(courseId));
        }
        if (foundCourse) courseName = foundCourse.courseName;

        // Resolve chapter name context
        let chapterName = "Topic Lectures";
        if (state.chaptersCache[courseId]) {
          const matchedChapter = state.chaptersCache[courseId].find(
            s => String(s.categoryId) === String(categoryId) && String(s.subCategoryId) === String(subCategoryId)
          );
          if (matchedChapter) chapterName = matchedChapter.subCategoryName;
        }

        setBreadcrumbs([
          { name: 'Explore Batches', link: '#/all-courses' },
          { name: courseName, link: '#/course/' + courseId },
          { name: chapterName, link: '#' }
        ]);

        const res = await apiFetch(\`/api/course-videos?courseId=\${courseId}&categoryId=\${categoryId}&subCategoryId=\${subCategoryId}\`);
        const videos = res?.data?.courseVideo || [];
        const container = document.getElementById('view-container');

        if (!videos || videos.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40 max-w-xl mx-auto">
              <div class="w-16 h-16 bg-slate-900/60 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
                <i class="fa-regular fa-file-video text-slate-500 text-xl"></i>
              </div>
              <h4 class="text-slate-300 font-bold text-base">Lectures Commencing Soon</h4>
              <p class="text-slate-500 text-xs mt-1 max-w-xs mx-auto">No published media feeds or PDF notes are present inside this category directory.</p>
              <a href="#/course/\${courseId}" class="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 rounded-lg inline-block hover:bg-slate-800">
                <i class="fa-solid fa-arrow-left mr-1.5"></i>Return to Syllabus
              </a>
            </div>
          \`;
          return;
        }

        let html = \`
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span class="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Chapter Streams Directory</span>
              <h2 class="text-lg font-bold text-slate-200 mt-0.5">\${chapterName}</h2>
              <p class="text-slate-500 text-xs">Access lessons in chronological order. Interactive YouTube streams and notes integrated.</p>
            </div>
            <a href="#/course/\${courseId}" class="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 rounded-xl transition-colors inline-flex items-center space-x-1.5">
              <i class="fa-solid fa-arrow-left"></i>
              <span>Back to Syllabus</span>
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        \`;

        // Loop array chronologically
        const chronologicalVideos = [...videos].reverse();

        chronologicalVideos.forEach(cv => {
          const title = cv.title || 'Untitled Session';
          const vlink = cv.url || cv.Url || '';
          const plink = cv.pdfUrl || '';
          const dateStr = cv.eventDateTime || '';
          const dateFormatted = formatDate(dateStr);
          
          const thumbImg = getYoutubeThumbnail(vlink);

          html += \`
            <div class="group bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden card-glowing flex flex-col h-full">
              <!-- Thumbnail Wrapper -->
              <div class="relative aspect-video bg-black overflow-hidden">
                <img src="\${thumbImg}" alt="\${title}" class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300">
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent"></div>
                
                \${vlink ? \`
                  <!-- Floating Play Indicator Overlay -->
                  <button onclick="playVideo('\${vlink}', '\${title.replace(/'/g, "\\'")}')" 
                          class="absolute inset-0 m-auto w-12 h-12 bg-brand-600/95 hover:bg-brand-500 rounded-full flex items-center justify-center text-white text-sm shadow-xl scale-95 group-hover:scale-100 transition-all border border-brand-400/20">
                    <i class="fa-solid fa-play translate-x-0.5"></i>
                  </button>
                \` : ''}

                <!-- Class Session Stamp Tag -->
                \${dateFormatted ? \`
                  <div class="absolute bottom-3 left-3">
                    <span class="px-2 py-0.5 bg-slate-950/80 blur-glass text-[10px] font-semibold text-slate-300 rounded-md border border-slate-800/50">
                      \${dateFormatted}
                    </span>
                  </div>
                \` : ''}
              </div>

              <!-- Main Card content space -->
              <div class="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 class="text-xs font-bold text-slate-100 line-clamp-2 leading-relaxed tracking-wide mb-3">
                    \${title}
                  </h3>
                </div>

                <!-- Footer Buttons -->
                <div class="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-4">
                  \${vlink ? \`
                    <button onclick="playVideo('\${vlink}', '\${title.replace(/'/g, "\\'")}')" 
                            class="py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-lg shadow-brand-600/10">
                      <i class="fa-regular fa-circle-play"></i>
                      <span>Watch video</span>
                    </button>
                  \` : \`
                    <span class="py-2.5 bg-slate-800/40 text-slate-500 rounded-xl text-xs font-semibold text-center select-none cursor-not-allowed">
                      No Video Link
                    </span>
                  \`}

                  \${plink ? \`
                    <a href="\${plink}" target="_blank" 
                       class="py-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700/50 font-semibold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors">
                      <i class="fa-regular fa-file-pdf text-red-400"></i>
                      <span>Board Notes</span>
                    </a>
                  \` : \`
                    <span class="py-2.5 bg-slate-850/30 text-slate-600 rounded-xl text-xs font-semibold text-center select-none cursor-not-allowed">
                      No PDF Notes
                    </span>
                  \`}
                </div>
              </div>
            </div>
          \`;
        });

        html += \`</div>\`;
        container.innerHTML = html;

      } catch (err) {
        renderError('view-container', "Failed downloading chapter lessons. Refresh network module.", '#/course/' + courseId + '/chapter/' + categoryId + '/' + subCategoryId);
      }
    }

    // Initialize listeners when document mounts
    window.addEventListener('DOMContentLoaded', () => {
      initLocalStorage();
      runRouter();
    });
    window.addEventListener('hashchange', runRouter);
  </script>
</body>
</html>`;
}