/**
 * TEACHERS ACADEMY - Unified Cloudflare Worker Script (ta.js)
 * Is ek file me complete Proxy APIs aur Frontend Application fully bundled hain.
 * Deploy hone par ye directly browser me static HTML serve karega aur API requests ko mask karega.
 */

const DEFAULT_TOKEN = "4fg1iZcgrW2X8QsF0DpX0ekBNZSNmugOWw9TJWVX5cTmYX4il3VIO%2B1lP6eCPAxoj93%2BhuIgNm03oQ1sCIkmv4zjcEdZwiTA5kpS8WG9VH9tQ6nsKQRDDjSzcQCQpASTHpGzOr%2F4vCIOahj4Z%2FMrQ2eud8PtLvIp1xit7EARO18%3D";

// Classwalla APIs ke liye headers
const BASE_HEADERS = {
  'Host': 'backend.classwalla.com',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip',
  'User-Agent': 'okhttp/5.3.2'
};

const LEGACY_HEADERS = {
  'Host': 'backend.classwalla.com',
  'Connection': 'Keep-Alive',
  'Accept-Encoding': 'gzip',
  'User-Agent': 'okhttp/4.9.2'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight requests ko handle karne ke liye handler
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    // --- API PROXY ROUTES ---

    // 1. Get Categories List
    if (path === "/api/categories") {
      try {
        const boundary = "f30abafb-92e2-4b52-bf44-12df495babc3";
        const body_cat = JSON.stringify({ data: { companyId: 46 }, token: DEFAULT_TOKEN });
        const data_cat = 
          `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="body"\r\n\r\n` +
          `${body_cat}\r\n` +
          `--${boundary}--\r\n`;

        const resp = await fetch("https://backend.classwalla.com/coursecategory/v1/getCourseCategory", {
          method: "POST",
          headers: {
            ...BASE_HEADERS,
            'Content-Type': `multipart/form-data; boundary=${boundary}`
          },
          body: data_cat
        });

        const data = await resp.json();
        return corsResponse(data);
      } catch (err) {
        return errorResponse(err);
      }
    }

    // 2. Get Courses list by Category (Chained getLayoutV2 & getCoursesBySubCat)
    if (path === "/api/courses") {
      try {
        const categoryId = url.searchParams.get("categoryId");
        if (!categoryId) {
          return corsResponse({ error: "Missing categoryId" }, 400);
        }

        // Phase A: Get Layout V2 se subcategoryId extract karna
        const boundary_layout = "276b3148-2c4f-406a-9d76-a4379e9e122c";
        const body_layout = JSON.stringify({
          data: {
            candidateId: "",
            categoryId: parseInt(categoryId, 10),
            companyId: 46,
            limit: "100",
            offset: "0"
          },
          token: DEFAULT_TOKEN
        });
        const data_layout = 
          `--${boundary_layout}\r\n` +
          `Content-Disposition: form-data; name="body"\r\n\r\n` +
          `${body_layout}\r\n` +
          `--${boundary_layout}--\r\n`;

        const resp_layout = await fetch("https://backend.classwalla.com/coursecategory/v1/getLayoutV2", {
          method: "POST",
          headers: {
            ...BASE_HEADERS,
            'Content-Type': `multipart/form-data; boundary=${boundary_layout}`
          },
          body: data_layout
        });

        const layout_json = await resp_layout.json();
        const subcategoryId = layout_json?.data?.layout?.[0]?.id;

        if (!subcategoryId) {
          return corsResponse({ data: { candidateCourseList: [] } });
        }

        // Phase B: Subcat ID se active courses pull karna
        const boundary_subcat = "1af43917-9fc4-43d6-8f6a-dc58aaa6ccef";
        const body_subcat = JSON.stringify({
          data: {
            limit: "100",
            offset: "0",
            searchString: "",
            subcatId: String(subcategoryId)
          },
          token: DEFAULT_TOKEN
        });
        const data_subcat = 
          `--${boundary_subcat}\r\n` +
          `Content-Disposition: form-data; name="body"\r\n\r\n` +
          `${body_subcat}\r\n` +
          `--${boundary_subcat}--\r\n`;

        const resp_subcat = await fetch("https://backend.classwalla.com/coursecategory/v1/getCoursesBySubCat", {
          method: "POST",
          headers: {
            ...BASE_HEADERS,
            'Content-Type': `multipart/form-data; boundary=${boundary_subcat}`
          },
          body: data_subcat
        });

        const subcat_json = await resp_subcat.json();
        return corsResponse(subcat_json);
      } catch (err) {
        return errorResponse(err);
      }
    }

    // 3. Course Categories/Syllabus chapters fetch karna
    if (path === "/api/course-categories") {
      try {
        const courseId = url.searchParams.get("courseId");
        if (!courseId) {
          return corsResponse({ error: "Missing courseId" }, 400);
        }

        const body_str = JSON.stringify({
          data: { courseId: String(courseId) },
          token: DEFAULT_TOKEN
        });
        const form_body = `body=${encodeURIComponent(body_str)}`;

        const resp = await fetch("https://backend.classwalla.com/course/course/getCourseCategories", {
          method: "POST",
          headers: {
            ...LEGACY_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form_body
        });

        const data = await resp.json();
        return corsResponse(data);
      } catch (err) {
        return errorResponse(err);
      }
    }

    // 4. Topic videos aur study material PDFs retrieve karna
    if (path === "/api/videos") {
      try {
        const courseId = url.searchParams.get("courseId");
        const categoryId = url.searchParams.get("categoryId");
        const subCategoryId = url.searchParams.get("subCategoryId");

        if (!courseId || !categoryId || !subCategoryId) {
          return corsResponse({ error: "Parameters match missing" }, 400);
        }

        const body_str = JSON.stringify({
          data: {
            courseId: String(courseId),
            filters: {
              videoCategory: String(categoryId),
              videoSubCategory: String(subCategoryId)
            },
            limit: "1000",
            offset: "0"
          },
          token: DEFAULT_TOKEN
        });
        const form_body = `body=${encodeURIComponent(body_str)}`;

        const resp = await fetch("https://backend.classwalla.com/candidate/candidate/getCourseVideos", {
          method: "POST",
          headers: {
            ...LEGACY_HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form_body
        });

        const data = await resp.json();
        return corsResponse(data);
      } catch (err) {
        return errorResponse(err);
      }
    }

    // --- FRONTEND APP INJECTION ---
    // Koi bhi unknown route par complete single page HTML load hoga (No separate CSS/JS files needed)
    return new Response(HTML_PAGE, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

// --- HELPERS FOR API ROUTES ---
function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

function errorResponse(err) {
  return corsResponse({
    error: "Proxy route pe error aayi hai",
    details: err.message
  }, 500);
}

// --- FRONTEND HTML, CSS & CLIENT JAVASCRIPT BUNDLED TOGETHER ---
// Is section me koi backtick syntax error na hone dene ke liye humne traditional JS strings aur static tags use kiye hain.
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teachers Academy | Dashboard</title>
    <!-- Tailwind CSS dynamic loading -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: {
                            50: '#f0f7ff',
                            100: '#e0effe',
                            500: '#0284c7',
                            600: '#0369a1',
                            700: '#075985',
                            800: '#0c4a6e',
                            900: '#0f172a',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
        }
        .tab-link {
            color: #475569;
        }
        .tab-link:hover {
            color: #0284c7;
            background-color: #f1f5f9;
        }
        .tab-link.active-tab {
            color: #ffffff;
            background-color: #0284c7;
            box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2);
        }
        .loader-spinner {
            animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .accordion-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .accordion-item.active .accordion-content {
            max-height: 500px;
        }
        .accordion-header svg {
            transition: transform 0.25s ease;
        }
        .accordion-item.active .accordion-header svg {
            transform: rotate(180deg);
        }
        .hover-card-trigger {
            transition: transform 0.22s ease, box-shadow 0.22s ease;
        }
        .hover-card-trigger:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 20px -8px rgba(0,0,0,0.08);
        }
        .aspect-video-box {
            position: relative;
            padding-bottom: 56.25%;
            height: 0;
            overflow: hidden;
        }
        .aspect-video-box img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        #confirm-modal.show {
            display: flex;
        }
        #confirm-modal.show #confirm-modal-box {
            transform: scale(1);
            opacity: 1;
        }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800">

    <!-- Premium Branding Navigation Bar -->
    <header class="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-sm backdrop-blur-md bg-white/95">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer" onclick="window.location.hash = '#/batches'">
                <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
                     alt="[Teachers Academy Logo]" 
                     class="w-10 h-10 rounded-xl shadow-sm border border-slate-100 object-cover"
                     onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80'">
                <div>
                    <h1 class="text-lg font-bold tracking-tight text-primary-900 leading-tight">TEACHERS ACADEMY</h1>
                    <p class="text-xs font-semibold text-amber-500 tracking-wider uppercase">Premium Branding by Naveen</p>
                </div>
            </div>

            <!-- Header Desktop Navigation Tabs -->
            <nav class="hidden md:flex items-center space-x-1">
                <a href="#/batches" id="nav-btn-batches" class="tab-link px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200">
                    My Batches
                    <span id="batches-count-badge" class="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-600">0</span>
                </a>
                <a href="#/all" id="nav-btn-all" class="tab-link px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200">
                    All Courses
                </a>
            </nav>
        </div>
    </header>

    <!-- Mobile Bottom Navigation Bar -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 px-6 py-2 flex justify-around">
        <a href="#/batches" id="mobile-nav-batches" class="flex flex-col items-center gap-1 text-slate-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span class="text-[10px] font-medium">My Batches</span>
        </a>
        <a href="#/all" id="mobile-nav-all" class="flex flex-col items-center gap-1 text-slate-500 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span class="text-[10px] font-medium">All Courses</span>
        </a>
    </div>

    <!-- Main Content Workspace -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 mb-16 md:mb-0">
        
        <!-- SECTION 1: MY BATCHES TAB -->
        <section id="section-batches" class="hidden space-y-6">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-2xl font-bold tracking-tight text-slate-900">Aapke Batches</h2>
                    <p class="text-sm text-slate-500">Apne enrolled batches aur files ko yahan se access karein.</p>
                </div>
            </div>

            <!-- Batches Grid -->
            <div id="batches-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>

            <!-- Empty Placeholder -->
            <div id="batches-empty-placeholder" class="hidden flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </div>
                <h3 class="text-lg font-semibold text-slate-900">Koi Batch Add Nahi Kiya Hai</h3>
                <p class="text-sm text-slate-500 mt-1 mb-6">Niche diye button se aap hamare premium streams ko browse kar sakte hain.</p>
                <a href="#/all" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition">
                    Browse All Courses
                </a>
            </div>
        </section>

        <!-- SECTION 2: ALL COURSES CATALOG TAB -->
        <section id="section-all" class="hidden space-y-6">
            <div>
                <h2 class="text-2xl font-bold tracking-tight text-slate-900">Course Categories Dekhein</h2>
                <p class="text-sm text-slate-500">Category chun kar naye aur interactive batches explore karein.</p>
            </div>

            <!-- Categories Filter -->
            <div id="catalog-categories-container" class="flex flex-wrap gap-2 py-1"></div>

            <!-- Grid Catalog -->
            <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"></div>

            <!-- Welcome Placeholder if not selected -->
            <div id="catalog-welcome-placeholder" class="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                <svg class="w-16 h-16 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                <p class="text-base font-medium">Upar di gayi category me se kisi ek par click karke courses load karein.</p>
            </div>
        </section>

        <!-- SECTION 3: BATCH DETAIL VIEW -->
        <section id="section-batch-detail" class="hidden space-y-6">
            <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="space-y-1.5">
                    <div class="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <a href="#/batches" class="hover:text-primary-600 transition">Aapke Batches</a>
                        <span>/</span>
                        <span id="detail-breadcrumb-course-name" class="text-slate-900 font-semibold truncate max-w-[200px] inline-block">Syllabus Details</span>
                    </div>
                    <h2 id="detail-course-title" class="text-2xl font-bold tracking-tight text-slate-900">Batch Syllabus...</h2>
                </div>
                <a href="#/batches" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 transition border border-slate-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Wapas Jayein
                </a>
            </div>

            <!-- Main Dynamic Panel -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Left Chapter List Panel -->
                <aside class="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-fit max-h-[80vh] overflow-y-auto">
                    <h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase px-2 mb-3">Syllabus Index</h3>
                    <div id="syllabus-chapters-list" class="space-y-2"></div>
                </aside>

                <!-- Right Workspace Resource Panel -->
                <section class="lg:col-span-8 space-y-6">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 id="workspace-topic-name" class="text-xl font-bold tracking-tight text-slate-900">Topic select karein</h3>
                            <p id="workspace-topic-stat" class="text-xs text-slate-500 font-medium mt-0.5">Left panel me se topic chapter choose karein.</p>
                        </div>
                        
                        <!-- Search lessons -->
                        <div class="relative w-full sm:w-64">
                            <input type="text" id="workspace-search-input" placeholder="Lessons dhoondhein..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition shadow-sm">
                            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>

                    <!-- Video / PDF List Grid -->
                    <div id="lessons-list" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>

                    <!-- Placeholders inside workspace -->
                    <div id="workspace-empty-placeholder" class="hidden flex flex-col items-center justify-center py-16 text-slate-400">
                        <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                        <p class="text-sm font-semibold">Is chapter me abhi koi materials published nahi hain.</p>
                    </div>

                    <div id="workspace-selection-placeholder" class="flex flex-col items-center justify-center py-16 text-slate-400">
                        <svg class="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7h8m0 0V9a2 2 0 01-2 2H10a2 2 0 01-2-2V7" /></svg>
                        <p class="text-sm font-semibold">Topic syllabus load karne ke liye left panel me se ek subcategory select karein.</p>
                    </div>
                </section>
            </div>
        </section>
    </main>

    <!-- Global Full-Screen loader -->
    <div id="loader-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm transition-all duration-300 pointer-events-none opacity-0">
        <div class="flex flex-col items-center gap-3">
            <div class="loader-spinner w-10 h-10 border-4 border-slate-200 border-t-primary-600 rounded-full"></div>
            <p class="text-sm font-semibold text-slate-600">LMS channel connect ho raha hai...</p>
        </div>
    </div>

    <!-- Customized Toast alert container -->
    <div id="toast-wrapper" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full px-4 md:px-0 pointer-events-none"></div>

    <!-- Custom Delete Confirmation modal box -->
    <div id="confirm-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 p-6 transform transition duration-200 scale-95 opacity-0 animate-scale" id="confirm-modal-box">
            <h3 class="text-lg font-bold text-slate-900">Batch delete karein?</h3>
            <p class="text-sm text-slate-500 mt-2">Kya aap waqai is batch course ko apni list se hatana chahte hain?</p>
            <div class="flex items-center justify-end gap-3 mt-6">
                <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                <button id="modal-confirm-btn" class="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm transition">Delete Karein</button>
            </div>
        </div>
    </div>

    <!-- Client-side Logic (Uses pure strings to bypass escaping issues) -->
    <script>
        // Global dynamic state variable representation
        var state = {
            currentTab: 'batches',
            myBatches: [],
            selectedCourseId: null,
            selectedCourseName: null,
            categories: [],
            courseCategories: [],
            lessons: [],
            activeCategoryId: null,
            activeSubCategoryId: null
        };

        window.addEventListener('DOMContentLoaded', function() {
            initStorage();
            bindGlobalEvents();
            routeHandler();
            window.addEventListener('hashchange', routeHandler);
        });

        // Sync items cleanly with browser storage
        function initStorage() {
            var localData = localStorage.getItem('ta_my_batches');
            if (localData) {
                try {
                    state.myBatches = JSON.parse(localData);
                } catch (e) {
                    state.myBatches = [];
                }
            } else {
                state.myBatches = [];
            }
            updateTabBadges();
        }

        function saveStorage() {
            localStorage.setItem('ta_my_batches', JSON.stringify(state.myBatches));
            updateTabBadges();
        }

        function bindGlobalEvents() {
            var mBatches = document.getElementById('mobile-nav-batches');
            if (mBatches) {
                mBatches.addEventListener('click', function() {
                    window.location.hash = '#/batches';
                });
            }
            var mAll = document.getElementById('mobile-nav-all');
            if (mAll) {
                mAll.addEventListener('click', function() {
                    window.location.hash = '#/all';
                });
            }
            var searchInp = document.getElementById('workspace-search-input');
            if (searchInp) {
                searchInp.addEventListener('input', function(e) {
                    renderFilteredLessons(e.target.value.trim());
                });
            }
        }

        // Router controls state flow from url
        async function routeHandler() {
            var hash = window.location.hash || '#/batches';
            var parts = hash.split('/');
            
            var searchBar = document.getElementById('workspace-search-input');
            if (searchBar) {
                searchBar.value = '';
            }

            document.querySelectorAll('.tab-link').forEach(function(el) {
                el.classList.remove('active-tab');
            });
            var mobBatches = document.getElementById('mobile-nav-batches');
            var mobAll = document.getElementById('mobile-nav-all');
            if (mobBatches) mobBatches.classList.remove('text-primary-600');
            if (mobAll) mobAll.classList.remove('text-primary-600');

            document.getElementById('section-batches').classList.add('hidden');
            document.getElementById('section-all').classList.add('hidden');
            document.getElementById('section-batch-detail').classList.add('hidden');

            if (parts[1] === 'batches') {
                state.currentTab = 'batches';
                var btnB = document.getElementById('nav-btn-batches');
                if (btnB) btnB.classList.add('active-tab');
                if (mobBatches) mobBatches.classList.add('text-primary-600');
                document.getElementById('section-batches').classList.remove('hidden');
                renderMyBatches();
            } 
            else if (parts[1] === 'all') {
                state.currentTab = 'all';
                var btnA = document.getElementById('nav-btn-all');
                if (btnA) btnA.classList.add('active-tab');
                if (mobAll) mobAll.classList.add('text-primary-600');
                document.getElementById('section-all').classList.remove('hidden');
                await loadCatalogCategories();
            } 
            else if (parts[1] === 'batch' && parts[2]) {
                state.currentTab = 'batches';
                var btnB = document.getElementById('nav-btn-batches');
                if (btnB) btnB.classList.add('active-tab');
                if (mobBatches) mobBatches.classList.add('text-primary-600');
                document.getElementById('section-batch-detail').classList.remove('hidden');
                
                var courseId = parts[2];
                var catId = parts[3] || null;
                var subCatId = parts[4] || null;
                await openBatchSyllabus(courseId, catId, subCatId);
            }
        }

        // Loader operations
        function setLoaderState(isActive) {
            var overlay = document.getElementById('loader-overlay');
            if (overlay) {
                if (isActive) {
                    overlay.classList.remove('pointer-events-none', 'opacity-0');
                    overlay.classList.add('opacity-100');
                } else {
                    overlay.classList.remove('opacity-100');
                    overlay.classList.add('pointer-events-none', 'opacity-0');
                }
            }
        }

        // Elegant alerts
        function showToast(message, type) {
            var toastType = type || 'success';
            var wrapper = document.getElementById('toast-wrapper');
            if (!wrapper) return;
            var id = 'toast_' + Date.now();

            var colorStyles = 'bg-emerald-600 text-white';
            if (toastType === 'warning') colorStyles = 'bg-amber-500 text-white';
            if (toastType === 'error') colorStyles = 'bg-red-600 text-white';

            var iconMarkup = '';
            if (toastType === 'success') {
                iconMarkup = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
            } else {
                iconMarkup = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
            }

            var toastHtml = '<div id="' + id + '" class="flex items-center p-4 rounded-xl shadow-xl border border-white/10 ' + colorStyles + ' transform translate-y-2 opacity-0 transition duration-300 pointer-events-auto">' +
                iconMarkup + '<span class="text-xs font-semibold">' + message + '</span></div>';

            wrapper.insertAdjacentHTML('beforeend', toastHtml);
            
            var toastElement = document.getElementById(id);
            setTimeout(function() {
                if (toastElement) toastElement.classList.remove('translate-y-2', 'opacity-0');
            }, 50);

            setTimeout(function() {
                if (toastElement) {
                    toastElement.classList.add('translate-y-2', 'opacity-0');
                    setTimeout(function() {
                        toastElement.remove();
                    }, 300);
                }
            }, 3500);
        }

        function updateTabBadges() {
            var badges = document.getElementById('batches-count-badge');
            if (badges) {
                badges.innerText = state.myBatches.length;
            }
        }

        // --- SECTION MY BATCHES RENDER ENGINE ---
        function renderMyBatches() {
            var grid = document.getElementById('batches-grid');
            var emptyPlaceholder = document.getElementById('batches-empty-placeholder');
            if (!grid || !emptyPlaceholder) return;
            grid.innerHTML = '';

            if (state.myBatches.length === 0) {
                emptyPlaceholder.classList.remove('hidden');
                return;
            }
            emptyPlaceholder.classList.add('hidden');

            state.myBatches.forEach(function(batch) {
                var card = '<article class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover-card-trigger relative">' +
                    '<div class="relative aspect-video-box">' +
                    '<img src="' + batch.thumbnail + '" alt="' + batch.courseName + '" class="w-full h-full object-cover" onerror="this.src=\\'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80\\'"> ' +
                    '<span class="absolute top-3 left-3 bg-primary-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">ACTIVE BATCH</span>' +
                    '</div>' +
                    '<div class="p-5 flex-grow flex flex-col justify-between gap-4">' +
                    '<div>' +
                    '<h3 class="text-base font-bold text-slate-900 line-clamp-2">' + batch.courseName + '</h3>' +
                    '<p class="text-xs font-semibold text-primary-500 mt-1">₹ ' + batch.price + '</p>' +
                    '</div>' +
                    '<div class="flex items-center gap-2 mt-auto">' +
                    '<a href="#/batch/' + batch.courseId + '" class="flex-grow inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition">' +
                    'Syllabus Open Karein' +
                    '</a>' +
                    '<button onclick="promptDeleteBatch(\\'' + batch.courseId + '\\')" title="Delete Course" class="p-2 border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">' +
                    '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>' +
                    '</button>' +
                    '</div>' +
                    '</div>' +
                    '</article>';
                grid.insertAdjacentHTML('beforeend', card);
            });
        }

        window.promptDeleteBatch = function(courseId) {
            var modal = document.getElementById('confirm-modal');
            if (!modal) return;
            modal.classList.add('show');

            var cancelBtn = document.getElementById('modal-cancel-btn');
            var confirmBtn = document.getElementById('modal-confirm-btn');

            var cleanModal = function() {
                modal.classList.remove('show');
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
            };

            var onCancel = function() { cleanModal(); };
            var onConfirm = function() {
                state.myBatches = state.myBatches.filter(function(b) {
                    return String(b.courseId) !== String(courseId);
                });
                saveStorage();
                showToast('Batch list se hata diya gaya.', 'warning');
                cleanModal();
                routeHandler();
            };

            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
        };

        // --- SECTION ALL COURSES RENDER ENGINE ---
        async function loadCatalogCategories() {
            if (state.categories.length > 0) {
                renderCategoryFilter();
                return;
            }

            setLoaderState(true);
            try {
                var res = await fetch('/api/categories');
                var json = await res.json();
                state.categories = json?.data?.courseCategory || [];
                renderCategoryFilter();
            } catch (err) {
                showToast('Streams load karne me samasya aayi', 'error');
            } finally {
                setLoaderState(false);
            }
        }

        function renderCategoryFilter() {
            var container = document.getElementById('catalog-categories-container');
            if (!container) return;
            container.innerHTML = '';

            state.categories.forEach(function(cat) {
                var isActive = String(state.activeCategoryId) === String(cat.categoryId);
                var buttonClass = isActive 
                    ? 'bg-primary-600 text-white shadow-sm border-transparent' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';

                var pill = '<button onclick="selectCatalogCategory(\\'' + cat.categoryId + '\\')" class="px-4 py-2 border rounded-full text-xs font-semibold transition ' + buttonClass + '">' +
                    cat.courseCategory + '</button>';
                container.insertAdjacentHTML('beforeend', pill);
            });
        }

        window.selectCatalogCategory = async function(catId) {
            state.activeCategoryId = catId;
            renderCategoryFilter();
            var welcomePH = document.getElementById('catalog-welcome-placeholder');
            if (welcomePH) welcomePH.classList.add('hidden');
            
            var grid = document.getElementById('catalog-grid');
            if (!grid) return;
            
            // Loading Skeletons Setup
            grid.innerHTML = '<div class="animate-pulse bg-white border border-slate-100 rounded-2xl overflow-hidden h-72 p-4 flex flex-col justify-between">' +
                '<div class="bg-slate-200 h-32 rounded-lg w-full mb-4"></div>' +
                '<div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>' +
                '<div class="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>' +
                '<div class="h-8 bg-slate-200 rounded w-full"></div>' +
                '</div>';

            try {
                var res = await fetch('/api/courses?categoryId=' + catId);
                var json = await res.json();
                
                var originalCourses = [];
                if (json?.data?.candidateCourseList) {
                    originalCourses = json.data.candidateCourseList;
                } else if (json?.data?.layout?.[0]?.content) {
                    originalCourses = json.data.layout[0].content;
                }

                var parsedCourses = originalCourses.map(function(item) {
                    return {
                        courseId: String(item.courseId || item.id),
                        courseName: item.courseName || item.title || "Unnamed Course",
                        price: item.price || "Free",
                        thumbnail: item.cThumb || item.cthumb || item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"
                    };
                });

                renderCatalogGrid(parsedCourses);
            } catch (err) {
                showToast('Stream databases se connection toot gaya', 'error');
                grid.innerHTML = '';
            }
        };

        function renderCatalogGrid(courses) {
            var grid = document.getElementById('catalog-grid');
            if (!grid) return;
            grid.innerHTML = '';

            if (courses.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-12 flex flex-col items-center text-slate-400 text-center">' +
                    '<svg class="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>' +
                    '<p class="text-sm font-semibold">Koi active batch is stream me nahi mila.</p></div>';
                return;
            }

            courses.forEach(function(course) {
                var isEnrolled = state.myBatches.some(function(b) {
                    return String(b.courseId) === String(course.courseId);
                });
                
                var actionBtn = '';
                if (isEnrolled) {
                    actionBtn = '<button disabled class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-400 bg-slate-50 rounded-lg cursor-not-allowed">' +
                        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>' +
                        'Added In Batches</button>';
                } else {
                    actionBtn = '<button onclick="enrollIntoBatches(\\'' + encodeURIComponent(JSON.stringify(course)) + '\\')" class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm transition">' +
                        'Batches me Add Karein</button>';
                }

                var card = '<article class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover-card-trigger">' +
                    '<div class="relative aspect-video-box bg-slate-100">' +
                    '<img src="' + course.thumbnail + '" alt="' + course.courseName + '" class="w-full h-full object-cover" onerror="this.src=\\'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80\\'"></div>' +
                    '<div class="p-5 flex-grow flex flex-col justify-between gap-4">' +
                    '<div><h3 class="text-sm font-bold text-slate-900 line-clamp-2">' + course.courseName + '</h3>' +
                    '<p class="text-xs font-bold text-emerald-600 mt-1">₹ ' + course.price + '</p></div>' +
                    '<div class="mt-auto pt-2">' + actionBtn + '</div></div></article>';
                grid.insertAdjacentHTML('beforeend', card);
            });
        }

        window.enrollIntoBatches = function(encodedStr) {
            var course = JSON.parse(decodeURIComponent(encodedStr));
            var alreadyExists = state.myBatches.some(function(b) {
                return String(b.courseId) === String(course.courseId);
            });

            if (alreadyExists) {
                showToast('Pehle se add kiya hua batch hai.', 'warning');
                return;
            }

            state.myBatches.push(course);
            saveStorage();
            showToast('Batch successfully add ho gaya!');
            selectCatalogCategory(state.activeCategoryId);
        };

        // --- SECTION SYLLABUS DETAIL CONTROLLERS ---
        async function openBatchSyllabus(courseId, initialCatId, initialSubCatId) {
            state.selectedCourseId = courseId;
            var currentBatch = state.myBatches.find(function(b) {
                return String(b.courseId) === String(courseId);
            });
            var courseTitle = currentBatch ? currentBatch.courseName : "Class Batch Study";
            
            document.getElementById('detail-breadcrumb-course-name').innerText = courseTitle;
            document.getElementById('detail-course-title').innerText = courseTitle;

            document.getElementById('workspace-topic-name').innerText = "Topic select karein";
            document.getElementById('workspace-topic-stat').innerText = "Left panel me se chapter chunayein.";
            var selPH = document.getElementById('workspace-selection-placeholder');
            if (selPH) selPH.classList.remove('hidden');
            var empPH = document.getElementById('workspace-empty-placeholder');
            if (empPH) empPH.classList.add('hidden');
            
            var lessonsList = document.getElementById('lessons-list');
            if (lessonsList) lessonsList.innerHTML = '';

            setLoaderState(true);
            try {
                var res = await fetch('/api/course-categories?courseId=' + courseId);
                var json = await res.json();
                
                var categories = [];
                var list = json?.data?.categoryList || [];
                
                list.forEach(function(c) {
                    var subCategories = (c.subCategory || []).map(function(s) {
                        return {
                            subCategoryId: s.subCategoryId,
                            subCategoryName: s.subCategory
                        };
                    });
                    categories.push({
                        categoryId: c.id,
                        categoryName: c.categoryName,
                        subCategories: subCategories
                    });
                });

                state.courseCategories = categories;
                renderSyllabusAccordion(initialCatId, initialSubCatId);

                if (initialCatId && initialSubCatId) {
                    await selectTopicLesson(initialCatId, initialSubCatId);
                }
            } catch (err) {
                showToast('Syllabus load karne me rukawat aayi', 'error');
            } finally {
                setLoaderState(false);
            }
        }

        function renderSyllabusAccordion(initialCatId, initialSubCatId) {
            var container = document.getElementById('syllabus-chapters-list');
            if (!container) return;
            container.innerHTML = '';

            if (state.courseCategories.length === 0) {
                container.innerHTML = '<p class="text-xs font-semibold text-slate-400 p-2">Syllabus abhi publish nahi hua hai.</p>';
                return;
            }

            state.courseCategories.forEach(function(cat) {
                var isAccordionActive = initialCatId && String(cat.categoryId) === String(initialCatId);
                var activeClass = isAccordionActive ? 'active' : '';

                var sublist = '';
                cat.subCategories.forEach(function(sub) {
                    var isSubActive = initialSubCatId && String(sub.subCategoryId) === String(initialSubCatId);
                    var activeItemStyle = isSubActive 
                        ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600 pl-3 font-semibold' 
                        : 'text-slate-600 hover:bg-slate-50 pl-4 hover:text-slate-900';

                    sublist += '<button onclick="triggerSelectTopic(\\'' + cat.categoryId + '\\', \\'' + sub.subCategoryId + '\\')" class="w-full text-left py-2 pr-3 text-xs rounded-r-md transition ' + activeItemStyle + '">' +
                        sub.subCategoryName + '</button>';
                });

                var item = '<div id="accordion_item_' + cat.categoryId + '" class="accordion-item border border-slate-100 rounded-xl overflow-hidden ' + activeClass + '">' +
                    '<button onclick="toggleAccordion(\\'' + cat.categoryId + '\\')" class="accordion-header w-full flex items-center justify-between p-3 bg-slate-50/70 hover:bg-slate-50 transition">' +
                    '<span class="text-xs font-bold text-slate-700 text-left line-clamp-1">' + cat.categoryName + '</span>' +
                    '<svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>' +
                    '</button>' +
                    '<div class="accordion-content bg-white border-t border-slate-50"><div class="py-1 space-y-0.5">' +
                    (sublist || '<p class="text-[10px] text-slate-400 p-3">No topics available.</p>') +
                    '</div></div></div>';
                container.insertAdjacentHTML('beforeend', item);
            });
        }

        window.toggleAccordion = function(catId) {
            var accordion = document.getElementById('accordion_item_' + catId);
            if (accordion) {
                if (accordion.classList.contains('active')) {
                    accordion.classList.remove('active');
                } else {
                    accordion.classList.add('active');
                }
            }
        };

        window.triggerSelectTopic = function(catId, subCatId) {
            window.location.hash = '#/batch/' + state.selectedCourseId + '/' + catId + '/' + subCatId;
        };

        async function selectTopicLesson(catId, subCatId) {
            state.activeCategoryId = catId;
            state.activeSubCategoryId = subCatId;

            var resolvedCat = state.courseCategories.find(function(c) {
                return String(c.categoryId) === String(catId);
            });
            var resolvedSub = resolvedCat ? resolvedCat.subCategories.find(function(s) {
                return String(s.subCategoryId) === String(subCatId);
            }) : null;
            
            var topicTitle = resolvedSub ? resolvedSub.subCategoryName : "Syllabus Topic";
            var parentTitle = resolvedCat ? resolvedCat.categoryName : "Category";

            document.getElementById('workspace-topic-name').innerText = topicTitle;
            document.getElementById('workspace-topic-stat').innerText = parentTitle + ' ➤ ' + topicTitle;
            
            var selPH = document.getElementById('workspace-selection-placeholder');
            if (selPH) selPH.classList.add('hidden');
            var empPH = document.getElementById('workspace-empty-placeholder');
            if (empPH) empPH.classList.add('hidden');

            var lessonsGrid = document.getElementById('lessons-list');
            if (!lessonsGrid) return;

            // Lesson Skeletons
            lessonsGrid.innerHTML = '<div class="animate-pulse bg-white border border-slate-100 rounded-xl p-4 flex gap-4 h-32">' +
                '<div class="bg-slate-200 w-28 rounded-lg shrink-0 h-full"></div>' +
                '<div class="flex-grow space-y-2 py-1"><div class="h-3 bg-slate-200 rounded w-1/4"></div>' +
                '<div class="h-4 bg-slate-200 rounded w-3/4"></div>' +
                '<div class="h-3 bg-slate-200 rounded w-1/2 mt-auto"></div></div></div>';

            try {
                var res = await fetch('/api/videos?courseId=' + state.selectedCourseId + '&categoryId=' + catId + '&subCategoryId=' + subCatId);
                var json = await res.json();
                var list = json?.data?.courseVideo || [];
                
                state.lessons = list.slice().reverse();
                renderFilteredLessons('');
            } catch (err) {
                showToast('Lessons sync fail ho gaya', 'error');
                lessonsGrid.innerHTML = '';
            }
        }

        function renderFilteredLessons(filterQuery) {
            var container = document.getElementById('lessons-list');
            if (!container) return;
            container.innerHTML = '';

            var cleanQuery = filterQuery.toLowerCase();
            var listToRender = state.lessons.filter(function(item) {
                return item.title && item.title.toLowerCase().indexOf(cleanQuery) !== -1;
            });

            var empPH = document.getElementById('workspace-empty-placeholder');
            if (listToRender.length === 0) {
                if (empPH) empPH.classList.remove('hidden');
                return;
            }
            if (empPH) empPH.classList.add('hidden');

            listToRender.forEach(function(lesson) {
                var videoUrl = lesson.url || lesson.Url || '';
                var pdfUrl = lesson.pdfUrl || '';
                var formattedDate = formatDateString(lesson.eventDateTime);

                var yId = getYoutubeId(videoUrl);
                var thumbUrl = yId 
                    ? 'https://img.youtube.com/vi/' + yId + '/hqdefault.jpg'
                    : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&q=80';

                var actionVideo = '';
                if (videoUrl) {
                    actionVideo = '<a href="' + videoUrl + '" target="_blank" class="flex-grow inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition">' +
                        '<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" /></svg>' +
                        'Video Dekhein</a>';
                }

                var actionPdf = '';
                if (pdfUrl) {
                    actionPdf = '<a href="' + pdfUrl + '" target="_blank" class="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition">' +
                        '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>' +
                        'PDF Open Karein</a>';
                }

                var noteBadge = pdfUrl ? '<span class="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">BOARD PDF</span>' : '';

                var card = '<article class="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm hover:border-slate-200 transition-colors flex flex-col md:flex-row gap-4 p-4">' +
                    '<div class="relative w-full md:w-32 shrink-0 rounded-lg overflow-hidden bg-slate-50 aspect-video md:aspect-auto md:h-full">' +
                    '<img src="' + thumbUrl + '" alt="Thumbnail" class="w-full h-full object-cover">' +
                    (videoUrl ? '<div class="absolute inset-0 flex items-center justify-center bg-black/25"><span class="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-red-600 shadow-sm"><svg class="w-4 h-4 fill-current pl-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></span></div>' : '') +
                    '</div>' +
                    '<div class="flex-grow flex flex-col justify-between gap-3 py-0.5">' +
                    '<div><div class="flex flex-wrap items-center gap-2"><span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">LESSON</span>' +
                    noteBadge + '</div>' +
                    '<h4 class="text-sm font-bold text-slate-900 mt-1.5 line-clamp-2">' + lesson.title + '</h4></div>' +
                    '<div class="flex items-center justify-between gap-4">' +
                    '<span class="text-[10px] font-medium text-slate-500 shrink-0">' + formattedDate + '</span>' +
                    '<div class="flex items-center gap-1.5 justify-end w-full">' + actionVideo + actionPdf + '</div></div></div>' +
                    '</article>';
                container.insertAdjacentHTML('beforeend', card);
            });
        }

        // --- UTILS ---
        function getYoutubeId(url) {
            if (!url) return null;
            var regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|&v=)([^#&?]*).*/;
            var match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        }

        function formatDateString(dateStr) {
            if (!dateStr) return '';
            try {
                var parts = dateStr.trim().split(' ');
                if (parts.length > 0) {
                    var dateParts = parts[0].split('-');
                    if (dateParts.length === 3) {
                        return dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
                    }
                }
                return dateStr;
            } catch (err) {
                return dateStr;
            }
        }
    </script>
</body>
</html>`;