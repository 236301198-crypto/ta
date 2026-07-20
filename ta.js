/**
 * TEACHERS ACADEMY - Premium EdTech Platform V3 (Pro)
 * Unified Cloudflare Worker Script - Fullscreen, Notch Optimized, Premium UI
 */

const DEFAULT_TOKEN = "4fg1iZcgrW2X8QsF0DpX0ekBNZSNmugOWw9TJWVX5cTmYX4il3VIO%2B1lP6eCPAxoj93%2BhuIgNm03oQ1sCIkmv4zjcEdZwiTA5kpS8WG9VH9tQ6nsKQRDDjSzcQCQpASTHpGzOr%2F4vCIOahj4Z%2FMrQ2eud8PtLvIp1xit7EARO18%3D";

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

    if (path === "/api/categories") {
      try {
        const boundary = "f30abafb-92e2-4b52-bf44-12df495babc3";
        const body_cat = JSON.stringify({ data: { companyId: 46 }, token: DEFAULT_TOKEN });
        const data_cat = `--${boundary}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${body_cat}\r\n--${boundary}--\r\n`;

        const resp = await fetch("https://backend.classwalla.com/coursecategory/v1/getCourseCategory", {
          method: "POST", headers: { ...BASE_HEADERS, 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body: data_cat
        });
        return corsResponse(await resp.json());
      } catch (err) { return errorResponse(err); }
    }

    if (path === "/api/courses") {
      try {
        const categoryId = url.searchParams.get("categoryId");
        if (!categoryId) return corsResponse({ error: "Missing categoryId" }, 400);

        const boundary_layout = "276b3148-2c4f-406a-9d76-a4379e9e122c";
        const body_layout = JSON.stringify({ data: { candidateId: "", categoryId: parseInt(categoryId, 10), companyId: 46, limit: "100", offset: "0" }, token: DEFAULT_TOKEN });
        const data_layout = `--${boundary_layout}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${body_layout}\r\n--${boundary_layout}--\r\n`;

        const resp_layout = await fetch("https://backend.classwalla.com/coursecategory/v1/getLayoutV2", {
          method: "POST", headers: { ...BASE_HEADERS, 'Content-Type': `multipart/form-data; boundary=${boundary_layout}` }, body: data_layout
        });
        const layout_json = await resp_layout.json();
        const subcategoryId = layout_json?.data?.layout?.[0]?.id;

        if (!subcategoryId) return corsResponse({ data: { candidateCourseList: [] } });

        const boundary_subcat = "1af43917-9fc4-43d6-8f6a-dc58aaa6ccef";
        const body_subcat = JSON.stringify({ data: { limit: "100", offset: "0", searchString: "", subcatId: String(subcategoryId) }, token: DEFAULT_TOKEN });
        const data_subcat = `--${boundary_subcat}\r\nContent-Disposition: form-data; name="body"\r\n\r\n${body_subcat}\r\n--${boundary_subcat}--\r\n`;

        const resp_subcat = await fetch("https://backend.classwalla.com/coursecategory/v1/getCoursesBySubCat", {
          method: "POST", headers: { ...BASE_HEADERS, 'Content-Type': `multipart/form-data; boundary=${boundary_subcat}` }, body: data_subcat
        });
        return corsResponse(await resp_subcat.json());
      } catch (err) { return errorResponse(err); }
    }

    if (path === "/api/course-categories") {
      try {
        const courseId = url.searchParams.get("courseId");
        if (!courseId) return corsResponse({ error: "Missing courseId" }, 400);

        const body_str = JSON.stringify({ data: { courseId: String(courseId) }, token: DEFAULT_TOKEN });
        const form_body = `body=${encodeURIComponent(body_str)}`;

        const resp = await fetch("https://backend.classwalla.com/course/course/getCourseCategories", {
          method: "POST", headers: { ...LEGACY_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form_body
        });
        return corsResponse(await resp.json());
      } catch (err) { return errorResponse(err); }
    }

    if (path === "/api/videos") {
      try {
        const courseId = url.searchParams.get("courseId");
        const categoryId = url.searchParams.get("categoryId");
        const subCategoryId = url.searchParams.get("subCategoryId");
        if (!courseId || !categoryId || !subCategoryId) return corsResponse({ error: "Parameters match missing" }, 400);

        const body_str = JSON.stringify({
          data: { courseId: String(courseId), filters: { videoCategory: String(categoryId), videoSubCategory: String(subCategoryId) }, limit: "1000", offset: "0" },
          token: DEFAULT_TOKEN
        });
        const form_body = `body=${encodeURIComponent(body_str)}`;

        const resp = await fetch("https://backend.classwalla.com/candidate/candidate/getCourseVideos", {
          method: "POST", headers: { ...LEGACY_HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form_body
        });
        return corsResponse(await resp.json());
      } catch (err) { return errorResponse(err); }
    }

    // --- FRONTEND APP INJECTION ---
    return new Response(HTML_PAGE, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }
};

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
  return corsResponse({ error: "Proxy route error", details: err.message }, 500);
}

// --- FRONTEND HTML, CSS & CLIENT JAVASCRIPT BUNDLED TOGETHER ---
const HTML_PAGE = `<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#ffffff">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <title>Teachers Academy | Premium Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' }
                    },
                    fontFamily: {
                        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --safe-top: env(safe-area-inset-top);
            --safe-bottom: env(safe-area-inset-bottom);
        }
        body { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; overscroll-behavior-y: none; }
        
        /* Dynamic Header for Notch */
        header { padding-top: var(--safe-top); }
        .bottom-nav { padding-bottom: max(var(--safe-bottom), 0.5rem); }
        
        .tab-link { color: #64748b; }
        .tab-link:hover { color: #0284c7; background-color: #f1f5f9; }
        .tab-link.active-tab { color: #ffffff; background-color: #0284c7; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2); }
        .loader-spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .accordion-content { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .accordion-item.active .accordion-content { max-height: 2000px; }
        .accordion-header svg { transition: transform 0.3s ease; }
        .accordion-item.active .accordion-header svg { transform: rotate(180deg); }
        
        .hover-card-trigger { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
        .hover-card-trigger:hover { transform: translateY(-4px); box-shadow: 0 12px 30px -8px rgba(0,0,0,0.15); border-color: #cbd5e1; }
        
        .aspect-video-box { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; }
        .aspect-video-box img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; }
        
        /* Active Lesson Highlight - Thicker border and pronounced background */
        .lesson-card { transition: all 0.25s ease; border: 2px solid transparent; }
        .lesson-card.active-lesson { 
            border-color: #0284c7; 
            background-color: #f0f9ff; 
            box-shadow: 0 8px 25px rgba(2, 132, 199, 0.2); 
            transform: scale(1.015) translateY(-2px); 
        }
        
        /* Topic Card Hover */
        .topic-card { transition: all 0.2s ease; }
        .topic-card:hover { transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left-color: #0284c7; }

        #confirm-modal.show { display: flex; }
        #confirm-modal.show #confirm-modal-box { transform: scale(1); opacity: 1; }
        
        .section-view { display: none; animation: fadeIn 0.35s ease; }
        .section-view.active-view { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="flex flex-col min-h-screen text-slate-800 pb-20 md:pb-0 bg-slate-50">

    <!-- Premium Header -->
    <header class="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-3 cursor-pointer" onclick="window.location.hash = '#/batches'">
                <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
                     class="w-10 h-10 rounded-lg shadow-sm border border-slate-100 object-cover" onerror="this.src='https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&q=80'">
                <div>
                    <h1 class="text-lg font-black tracking-tight text-slate-900 leading-tight">TEACHERS ACADEMY</h1>
                    <p class="text-[10px] font-bold text-amber-500 tracking-widest uppercase">Premium Branding by Naveen</p>
                </div>
            </div>
            
            <div class="flex items-center gap-4">
                <nav class="hidden md:flex space-x-2">
                    <a href="#/batches" id="nav-btn-batches" class="tab-link px-4 py-2 rounded-lg font-bold text-sm transition">My Batches <span id="batches-count-badge" class="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full">0</span></a>
                    <a href="#/all" id="nav-btn-all" class="tab-link px-4 py-2 rounded-lg font-bold text-sm transition">All Courses</a>
                </nav>
                
                <!-- Fullscreen Toggle Button -->
                <button onclick="toggleFullScreen()" title="Toggle Fullscreen" class="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all focus:outline-none">
                    <svg id="fs-icon-expand" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <svg id="fs-icon-compress" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    </header>

    <!-- Mobile Navigation (Notch Optimized) -->
    <div class="bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-50 px-6 pt-2 flex justify-around">
        <a href="#/batches" id="mobile-nav-batches" class="flex flex-col items-center gap-1 text-slate-400 transition pb-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <span class="text-[10px] font-bold uppercase tracking-wider">My Batches</span>
        </a>
        <a href="#/all" id="mobile-nav-all" class="flex flex-col items-center gap-1 text-slate-400 transition pb-1">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            <span class="text-[10px] font-bold uppercase tracking-wider">All Courses</span>
        </a>
    </div>

    <!-- Main Workspace -->
    <main class="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        <!-- VIEW 1: MY BATCHES -->
        <section id="view-batches" class="section-view space-y-6">
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight uppercase border-l-4 border-primary-600 pl-3">Aapke Batches</h2>
            <div id="batches-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
            <div id="batches-empty" class="hidden flex flex-col items-center justify-center py-20 text-center">
                <div class="w-24 h-24 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </div>
                <h3 class="text-2xl font-black text-slate-900 uppercase">Koi Batch Nahi Hai</h3>
                <p class="text-sm font-semibold text-slate-500 mt-2 mb-8">Niche diye button se naye premium batches explore karein.</p>
                <a href="#/all" class="px-8 py-4 font-black tracking-wider uppercase rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition shadow-xl shadow-primary-600/30">Browse Courses</a>
            </div>
        </section>

        <!-- VIEW 2: ALL CATEGORIES LIST -->
        <section id="view-all-categories" class="section-view space-y-6">
            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight uppercase border-l-4 border-primary-600 pl-3">Course Categories</h2>
            <p class="text-sm font-semibold text-slate-500">Category chun kar naye batches load karein.</p>
            <div id="categories-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"></div>
        </section>

        <!-- VIEW 3: COURSES IN A SPECIFIC CATEGORY -->
        <section id="view-category-courses" class="section-view space-y-6">
            <div class="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                <a href="#/all" class="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm self-start">
                    <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>
                </a>
                <h2 id="cat-courses-title" class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">Loading Courses...</h2>
            </div>
            <div id="catalog-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"></div>
        </section>

        <!-- VIEW 4: BATCH SYLLABUS INDEX (PREMIUM CHAPTERS) -->
        <section id="view-batch-syllabus" class="section-view space-y-6">
            <div class="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div>
                    <h2 id="syllabus-course-title" class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase">Batch Syllabus</h2>
                    <p class="text-xs font-black text-primary-600 tracking-widest uppercase mt-2">Syllabus Index Overview</p>
                </div>
                <a href="#/batches" class="inline-flex items-center gap-2 px-5 py-3 text-sm font-black tracking-widest uppercase rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition shadow-sm">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Wapas Jayein
                </a>
            </div>
            <div class="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm">
                <div id="syllabus-chapters-list" class="space-y-4"></div>
            </div>
        </section>

        <!-- VIEW 5: TOPIC LESSONS (VIDEOS/PDFS) -->
        <section id="view-topic-lessons" class="section-view space-y-6">
            <div class="bg-gradient-to-r from-primary-700 to-primary-600 rounded-3xl p-6 md:p-8 shadow-xl shadow-primary-600/20 text-white flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div class="flex items-start gap-4">
                    <button onclick="goBackToSyllabus()" class="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition backdrop-blur-md shrink-0 mt-1 shadow-inner">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <div>
                        <h2 id="lessons-topic-title" class="text-3xl sm:text-4xl font-black tracking-tight uppercase leading-tight drop-shadow-md">Topic Name</h2>
                        <p id="lessons-parent-title" class="text-sm font-black text-primary-200 tracking-widest uppercase mt-2">Subject Name</p>
                    </div>
                </div>
                <!-- Search Box -->
                <div class="relative w-full lg:w-72 shrink-0 mt-4 lg:mt-0">
                    <input type="text" id="lessons-search" placeholder="Search videos..." class="w-full pl-12 pr-4 py-3.5 bg-black/15 border border-white/20 rounded-xl text-sm font-bold tracking-wide text-white placeholder-white/60 focus:outline-none focus:bg-white/25 focus:ring-2 focus:ring-white/50 transition">
                    <svg class="w-5 h-5 text-white/70 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>
            
            <div id="lessons-list" class="grid grid-cols-1 gap-5 max-w-5xl mx-auto mt-8"></div>
            
            <div id="lessons-empty" class="hidden flex flex-col items-center justify-center py-20 text-center">
                <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-100 mb-6">
                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" /></svg>
                </div>
                <h3 class="text-2xl font-black uppercase text-slate-900">Koi Data Nahi Hai</h3>
                <p class="text-sm font-bold text-slate-500 mt-2">Is topic me abhi videos/PDFs upload nahi huye hain.</p>
            </div>
        </section>
    </main>

    <!-- Global Loader -->
    <div id="loader-overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-none opacity-0">
        <div class="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
            <div class="loader-spinner w-12 h-12 border-4 border-slate-100 border-t-primary-600 rounded-full"></div>
            <p class="text-sm font-black text-slate-800 tracking-widest uppercase mt-2">Loading...</p>
        </div>
    </div>

    <!-- Toast Alerts -->
    <div id="toast-wrapper" class="fixed bottom-24 md:bottom-8 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 md:px-0 pointer-events-none"></div>

    <!-- Delete Modal -->
    <div id="confirm-modal" class="fixed inset-0 z-50 hidden items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div class="bg-white rounded-[2rem] max-w-sm w-full shadow-2xl p-8 transform transition duration-200 scale-95 opacity-0" id="confirm-modal-box">
            <div class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 class="text-2xl font-black text-slate-900 uppercase">Delete Batch?</h3>
            <p class="text-sm font-bold text-slate-500 mt-3 leading-relaxed">Kya aap waqai is premium batch ko apni list se hatana chahte hain?</p>
            <div class="flex items-center gap-3 mt-8">
                <button id="modal-cancel-btn" class="flex-1 py-3.5 text-sm font-black uppercase tracking-wider rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Cancel</button>
                <button id="modal-confirm-btn" class="flex-1 py-3.5 text-sm font-black uppercase tracking-wider rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/30 transition">Delete</button>
            </div>
        </div>
    </div>

    <script>
        var state = {
            myBatches: [],
            selectedCourseId: null,
            categories: [],
            courseCategories: [],
            lessons: [],
            activeCategoryId: null,
            activeSubCategoryId: null
        };

        window.addEventListener('DOMContentLoaded', function() {
            initStorage();
            bindEvents();
            routeHandler();
            window.addEventListener('hashchange', routeHandler);
            
            // Auto Fullscreen Setup Trigger on first touch/click
            window.addEventListener('click', attemptAutoFullscreen, { once: true });
            window.addEventListener('touchstart', attemptAutoFullscreen, { once: true });
            
            // Listen to fullscreen changes to update icon
            document.addEventListener('fullscreenchange', updateFullscreenIcons);
            document.addEventListener('webkitfullscreenchange', updateFullscreenIcons);
        });

        // --- FULLSCREEN LOGIC ---
        function toggleFullScreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                var docElm = document.documentElement;
                if (docElm.requestFullscreen) docElm.requestFullscreen();
                else if (docElm.webkitRequestFullscreen) docElm.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            }
        }

        function attemptAutoFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                var docElm = document.documentElement;
                if (docElm.requestFullscreen) docElm.requestFullscreen().catch(e => console.log(e));
                else if (docElm.webkitRequestFullscreen) docElm.webkitRequestFullscreen().catch(e => console.log(e));
            }
        }

        function updateFullscreenIcons() {
            var expandIcon = document.getElementById('fs-icon-expand');
            var compressIcon = document.getElementById('fs-icon-compress');
            if (document.fullscreenElement || document.webkitFullscreenElement) {
                expandIcon.classList.add('hidden');
                compressIcon.classList.remove('hidden');
            } else {
                expandIcon.classList.remove('hidden');
                compressIcon.classList.add('hidden');
            }
        }

        // --- DATA LOGIC ---
        function initStorage() {
            var localData = localStorage.getItem('ta_batches_pro');
            if (localData) {
                try { state.myBatches = JSON.parse(localData); } catch (e) { state.myBatches = []; }
            }
            updateBadges();
        }

        function saveStorage() {
            localStorage.setItem('ta_batches_pro', JSON.stringify(state.myBatches));
            updateBadges();
        }

        function bindEvents() {
            var searchInp = document.getElementById('lessons-search');
            if (searchInp) searchInp.addEventListener('input', function(e) { renderLessons(e.target.value.trim()); });
        }

        async function routeHandler() {
            var hash = window.location.hash || '#/batches';
            var parts = hash.split('/');
            
            var searchBar = document.getElementById('lessons-search');
            if (searchBar) searchBar.value = '';

            document.querySelectorAll('.tab-link').forEach(function(el) { el.classList.remove('active-tab'); });
            var mobB = document.getElementById('mobile-nav-batches');
            var mobA = document.getElementById('mobile-nav-all');
            if(mobB) { mobB.classList.remove('text-primary-600'); mobB.classList.add('text-slate-400'); }
            if(mobA) { mobA.classList.remove('text-primary-600'); mobA.classList.add('text-slate-400'); }

            document.querySelectorAll('.section-view').forEach(function(el) { el.classList.remove('active-view'); });

            if (parts[1] === 'batches') {
                document.getElementById('nav-btn-batches')?.classList.add('active-tab');
                if(mobB) { mobB.classList.add('text-primary-600'); mobB.classList.remove('text-slate-400'); }
                document.getElementById('view-batches').classList.add('active-view');
                renderMyBatches();
            } 
            else if (parts[1] === 'all') {
                document.getElementById('nav-btn-all')?.classList.add('active-tab');
                if(mobA) { mobA.classList.add('text-primary-600'); mobA.classList.remove('text-slate-400'); }
                document.getElementById('view-all-categories').classList.add('active-view');
                await loadAllCategories();
            }
            else if (parts[1] === 'category' && parts[2]) {
                document.getElementById('nav-btn-all')?.classList.add('active-tab');
                if(mobA) { mobA.classList.add('text-primary-600'); mobA.classList.remove('text-slate-400'); }
                document.getElementById('view-category-courses').classList.add('active-view');
                await loadCategoryCourses(parts[2]);
            }
            else if (parts[1] === 'batch' && parts[2]) {
                document.getElementById('nav-btn-batches')?.classList.add('active-tab');
                if(mobB) { mobB.classList.add('text-primary-600'); mobB.classList.remove('text-slate-400'); }
                document.getElementById('view-batch-syllabus').classList.add('active-view');
                await loadBatchSyllabus(parts[2]);
            }
            else if (parts[1] === 'lessons' && parts[2] && parts[3] && parts[4]) {
                document.getElementById('nav-btn-batches')?.classList.add('active-tab');
                if(mobB) { mobB.classList.add('text-primary-600'); mobB.classList.remove('text-slate-400'); }
                document.getElementById('view-topic-lessons').classList.add('active-view');
                await loadTopicLessons(parts[2], parts[3], parts[4]);
            }
        }

        function setLoader(isActive) {
            var overlay = document.getElementById('loader-overlay');
            if (!overlay) return;
            if (isActive) {
                overlay.classList.remove('pointer-events-none', 'opacity-0');
                overlay.classList.add('opacity-100');
            } else {
                overlay.classList.remove('opacity-100');
                overlay.classList.add('pointer-events-none', 'opacity-0');
            }
        }

        function showToast(msg, type) {
            var wrapper = document.getElementById('toast-wrapper');
            if (!wrapper) return;
            var id = 'toast_' + Date.now();
            var bg = (type === 'error') ? 'bg-red-600' : (type === 'warning' ? 'bg-amber-500' : 'bg-slate-900');
            var html = '<div id="' + id + '" class="flex items-center p-4 rounded-2xl shadow-2xl ' + bg + ' text-white transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto">' +
                '<span class="text-sm font-black tracking-widest uppercase">' + msg + '</span></div>';
            wrapper.insertAdjacentHTML('beforeend', html);
            
            setTimeout(function() { document.getElementById(id)?.classList.remove('translate-y-4', 'opacity-0'); }, 50);
            setTimeout(function() { 
                var el = document.getElementById(id);
                if(el) { el.classList.add('translate-y-4', 'opacity-0'); setTimeout(function(){el.remove();},300); }
            }, 3000);
        }

        function updateBadges() {
            var bdg = document.getElementById('batches-count-badge');
            if (bdg) bdg.innerText = state.myBatches.length;
        }

        // --- RENDER FUNCTIONS ---
        function renderMyBatches() {
            var grid = document.getElementById('batches-grid');
            var empty = document.getElementById('batches-empty');
            grid.innerHTML = '';
            if (state.myBatches.length === 0) { empty.classList.remove('hidden'); return; }
            empty.classList.add('hidden');

            state.myBatches.forEach(function(batch) {
                var card = '<div class="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm flex flex-col hover-card-trigger">' +
                    '<div class="relative aspect-video-box bg-slate-100 border-b border-slate-100">' +
                    '<img src="' + batch.thumbnail + '" class="w-full h-full object-cover" onerror="this.src=\\'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80\\'"> ' +
                    '<span class="absolute top-4 left-4 bg-primary-600 text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg shadow-lg uppercase">Enrolled</span>' +
                    '</div>' +
                    '<div class="p-6 flex flex-col flex-grow">' +
                    '<h3 class="text-xl font-black text-slate-900 leading-tight mb-2 uppercase tracking-wide">' + batch.courseName + '</h3>' +
                    '<div class="mt-auto pt-6 flex gap-3">' +
                    '<a href="#/batch/' + batch.courseId + '" class="flex-grow text-center px-4 py-3.5 text-sm font-black uppercase tracking-wider text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-xl shadow-primary-600/30 transition">Open Syllabus</a>' +
                    '<button onclick="promptDelete(\\'' + batch.courseId + '\\')" class="px-5 py-3.5 border-2 border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 rounded-xl transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>' +
                    '</div></div></div>';
                grid.insertAdjacentHTML('beforeend', card);
            });
        }

        window.promptDelete = function(courseId) {
            var modal = document.getElementById('confirm-modal');
            modal.classList.add('show');
            var cancel = document.getElementById('modal-cancel-btn');
            var confirm = document.getElementById('modal-confirm-btn');

            var clean = function() { modal.classList.remove('show'); cancel.removeEventListener('click', onCancel); confirm.removeEventListener('click', onConfirm); };
            var onCancel = function() { clean(); };
            var onConfirm = function() {
                state.myBatches = state.myBatches.filter(function(b) { return String(b.courseId) !== String(courseId); });
                saveStorage();
                showToast('Batch removed', 'warning');
                clean();
                routeHandler();
            };
            cancel.addEventListener('click', onCancel);
            confirm.addEventListener('click', onConfirm);
        };

        async function loadAllCategories() {
            var container = document.getElementById('categories-list');
            if (state.categories.length === 0) {
                setLoader(true);
                try {
                    var res = await fetch('/api/categories');
                    var json = await res.json();
                    state.categories = json?.data?.courseCategory || [];
                } catch(e) { showToast('Error loading categories', 'error'); }
                setLoader(false);
            }
            
            container.innerHTML = '';
            state.categories.forEach(function(cat) {
                var card = '<a href="#/category/' + cat.categoryId + '" class="group flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-[1.5rem] hover:border-primary-500 hover:shadow-xl hover:shadow-primary-500/10 transition-all">' +
                    '<span class="font-black text-slate-800 text-sm tracking-widest uppercase">' + cat.courseCategory + '</span>' +
                    '<div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary-50 transition">' +
                    '<svg class="w-6 h-6 text-slate-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>' +
                    '</div></a>';
                container.insertAdjacentHTML('beforeend', card);
            });
        }

        async function loadCategoryCourses(catId) {
            var grid = document.getElementById('catalog-grid');
            grid.innerHTML = '';
            
            var catName = "Courses";
            var found = state.categories.find(function(c) { return String(c.categoryId) === String(catId); });
            if(found) catName = found.courseCategory;
            document.getElementById('cat-courses-title').innerText = catName;

            setLoader(true);
            try {
                var res = await fetch('/api/courses?categoryId=' + catId);
                var json = await res.json();
                var rawList = json?.data?.candidateCourseList || json?.data?.layout?.[0]?.content || [];
                
                if (rawList.length === 0) {
                    grid.innerHTML = '<div class="col-span-full py-20 text-center text-slate-400 font-black uppercase tracking-widest text-lg">No Active Batches Here</div>';
                } else {
                    rawList.forEach(function(item) {
                        var course = {
                            courseId: String(item.courseId || item.id),
                            courseName: item.courseName || item.title || "Unnamed",
                            price: item.price || "Free",
                            thumbnail: item.cThumb || item.cthumb || item.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80"
                        };
                        var isEn = state.myBatches.some(function(b) { return String(b.courseId) === String(course.courseId); });
                        
                        var btn = isEn ? '<button disabled class="w-full py-4 bg-slate-100 text-slate-400 font-black tracking-wider uppercase rounded-xl cursor-not-allowed border border-slate-200">Added</button>'
                                       : '<button onclick="enrollBatch(\\'' + encodeURIComponent(JSON.stringify(course)) + '\\')" class="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black tracking-wider uppercase rounded-xl shadow-lg transition">Add to Batches</button>';

                        var card = '<div class="bg-white border border-slate-200 rounded-[2rem] overflow-hidden flex flex-col hover-card-trigger shadow-sm">' +
                            '<div class="aspect-video-box bg-slate-100"><img src="' + course.thumbnail + '" class="w-full h-full object-cover"></div>' +
                            '<div class="p-6 flex flex-col flex-grow">' +
                            '<h3 class="text-lg font-black text-slate-900 leading-tight mb-2 uppercase">' + course.courseName + '</h3>' +
                            '<p class="text-xl font-black text-emerald-600 mb-6">₹ ' + course.price + '</p>' +
                            '<div class="mt-auto">' + btn + '</div></div></div>';
                        grid.insertAdjacentHTML('beforeend', card);
                    });
                }
            } catch(e) { showToast('Error loading courses', 'error'); }
            setLoader(false);
        }

        window.enrollBatch = function(enc) {
            var c = JSON.parse(decodeURIComponent(enc));
            if (state.myBatches.some(function(b) { return String(b.courseId) === String(c.courseId); })) return;
            state.myBatches.push(c);
            saveStorage();
            showToast('Added to My Batches');
            var hash = window.location.hash.split('/');
            loadCategoryCourses(hash[2]);
        };

        // --- VIEW 4: SYLLABUS INDEX (PREMIUM UI ENHANCEMENT) ---
        async function loadBatchSyllabus(courseId) {
            state.selectedCourseId = courseId;
            var current = state.myBatches.find(function(b) { return String(b.courseId) === String(courseId); });
            if (current) document.getElementById('syllabus-course-title').innerText = current.courseName;

            var container = document.getElementById('syllabus-chapters-list');
            container.innerHTML = '';
            setLoader(true);
            
            try {
                var res = await fetch('/api/course-categories?courseId=' + courseId);
                var json = await res.json();
                var list = json?.data?.categoryList || [];
                state.courseCategories = list.map(function(c) {
                    return {
                        id: c.id, name: c.categoryName,
                        subs: (c.subCategory || []).map(function(s) { return { id: s.subCategoryId, name: s.subCategory }; })
                    };
                });

                if (state.courseCategories.length === 0) {
                    container.innerHTML = '<div class="py-16 text-center text-slate-400 font-black uppercase tracking-widest">Syllabus Not Available</div>';
                } else {
                    state.courseCategories.forEach(function(cat) {
                        var sublist = '';
                        cat.subs.forEach(function(sub) {
                            // Premium Topic Cards inside the accordion
                            sublist += '<button onclick="window.location.hash=\\'#/lessons/' + courseId + '/' + cat.id + '/' + sub.id + '\\'" class="topic-card w-full text-left p-4 mb-3 bg-white border border-slate-200 border-l-4 border-l-transparent rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-between group">' +
                                '<div class="flex items-center gap-4">' +
                                '<div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">' +
                                '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253"/></svg>' +
                                '</div>' +
                                '<span class="text-sm font-black text-slate-700 group-hover:text-primary-700 uppercase tracking-widest">' + sub.name + '</span>' +
                                '</div>' +
                                '<svg class="w-6 h-6 text-slate-300 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"/></svg>' +
                                '</button>';
                        });

                        var acc = '<div id="acc_' + cat.id + '" class="accordion-item bg-slate-50/50 border border-slate-200 rounded-[2rem] overflow-hidden mb-4">' +
                            '<button onclick="toggleAcc(\\'' + cat.id + '\\')" class="accordion-header w-full flex items-center justify-between p-6 hover:bg-slate-100/50 transition">' +
                            '<span class="text-lg font-black text-slate-900 uppercase tracking-widest">' + cat.name + '</span>' +
                            '<div class="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">' +
                            '<svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>' +
                            '</div></button>' +
                            '<div class="accordion-content bg-slate-50 border-t border-slate-200"><div class="p-4 sm:p-6">' + (sublist || '<div class="p-4 text-xs font-black tracking-widest text-slate-400 uppercase text-center">Empty Subject</div>') + '</div></div></div>';
                        container.insertAdjacentHTML('beforeend', acc);
                    });
                }
            } catch(e) { showToast('Error loading syllabus', 'error'); }
            setLoader(false);
        }

        window.toggleAcc = function(id) {
            var el = document.getElementById('acc_' + id);
            if (el) el.classList.toggle('active');
        };

        // --- VIEW 5: TOPIC LESSONS ---
        window.goBackToSyllabus = function() {
            window.location.hash = '#/batch/' + state.selectedCourseId;
        };

        async function loadTopicLessons(courseId, catId, subCatId) {
            state.activeCategoryId = catId;
            state.activeSubCategoryId = subCatId;
            state.selectedCourseId = courseId;
            
            var cName = "Subject"; var sName = "Topic";
            var foundCat = state.courseCategories.find(function(c) { return String(c.id) === String(catId); });
            if (foundCat) {
                cName = foundCat.name;
                var foundSub = foundCat.subs.find(function(s) { return String(s.id) === String(subCatId); });
                if (foundSub) sName = foundSub.name;
            }
            document.getElementById('lessons-parent-title').innerText = cName;
            document.getElementById('lessons-topic-title').innerText = sName;

            var container = document.getElementById('lessons-list');
            container.innerHTML = '';
            setLoader(true);

            try {
                var res = await fetch('/api/videos?courseId=' + courseId + '&categoryId=' + catId + '&subCategoryId=' + subCatId);
                var json = await res.json();
                state.lessons = (json?.data?.courseVideo || []).slice().reverse(); 
                renderLessons('');
            } catch(e) { showToast('Error loading videos', 'error'); }
            setLoader(false);
        }

        window.markWatched = function(idx) {
            document.querySelectorAll('.lesson-card').forEach(function(el) { el.classList.remove('active-lesson'); });
            var clickedEl = document.getElementById('lesson_card_' + idx);
            if (clickedEl) clickedEl.classList.add('active-lesson');
            localStorage.setItem('last_vid_' + state.selectedCourseId, idx);
        };

        function renderLessons(query) {
            var container = document.getElementById('lessons-list');
            var empty = document.getElementById('lessons-empty');
            container.innerHTML = '';
            
            var q = query.toLowerCase();
            var filtered = state.lessons.filter(function(l) { return (l.title || '').toLowerCase().indexOf(q) !== -1; });
            
            if (filtered.length === 0) { empty.classList.remove('hidden'); return; }
            empty.classList.add('hidden');

            var lastWatchedIdx = localStorage.getItem('last_vid_' + state.selectedCourseId);

            filtered.forEach(function(lesson, idx) {
                var vid = lesson.url || lesson.Url || '';
                var pdf = lesson.pdfUrl || '';
                var date = (lesson.eventDateTime || '').split(' ')[0] || '';
                
                var thumb = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&q=80';
                if (vid) {
                    var m = vid.match(/^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|&v=)([^#&?]*).*/);
                    if (m && m[2].length === 11) thumb = 'https://img.youtube.com/vi/' + m[2] + '/hqdefault.jpg';
                }

                var activeCls = (String(lastWatchedIdx) === String(idx)) ? 'active-lesson' : '';
                
                var mediaHTML = '';
                if (vid) {
                    mediaHTML = '<a href="' + vid + '" target="_blank" onclick="markWatched(\\'' + idx + '\\')" class="block relative w-full sm:w-56 shrink-0 bg-slate-100 aspect-video sm:aspect-auto sm:h-full overflow-hidden group">' +
                        '<img src="' + thumb + '" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">' +
                        '<div class="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition">' +
                        '<div class="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center text-red-600 shadow-xl group-hover:scale-110 transition"><svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>' +
                        '</div></a>';
                } else {
                    mediaHTML = '<div class="w-full sm:w-56 shrink-0 bg-slate-100 aspect-video sm:aspect-auto sm:h-full overflow-hidden border-r border-slate-100"><img src="' + thumb + '" class="w-full h-full object-cover opacity-70 grayscale"></div>';
                }

                // Professional Premium PDF Button Icon and Styles
                var pdfBtn = pdf ? '<a href="' + pdf + '" target="_blank" class="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-black text-[10px] uppercase tracking-widest rounded-xl transition flex items-center gap-2 shadow-sm">' +
                    '<svg class="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg> Open PDF</a>' : '';
                
                var noteBadge = pdf ? '<span class="px-2.5 py-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-md">PDF Note</span>' : '';

                var card = '<article id="lesson_card_' + idx + '" class="lesson-card ' + activeCls + ' bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden flex flex-col sm:flex-row hover-card-trigger shadow-sm">' +
                    mediaHTML +
                    '<div class="p-5 flex flex-col flex-grow justify-between gap-3">' +
                    '<div><div class="flex items-center gap-2 mb-2"><span class="px-2.5 py-1 bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-md">Lesson</span>' + noteBadge + '</div>' +
                    '<h4 class="text-lg font-black text-slate-900 leading-snug line-clamp-2 uppercase tracking-wide">' + lesson.title + '</h4></div>' +
                    '<div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">' +
                    '<span class="text-xs font-black text-slate-400 tracking-widest">' + date + '</span>' +
                    '<div class="flex gap-2">' + pdfBtn + '</div>' +
                    '</div></div></article>';
                container.insertAdjacentHTML('beforeend', card);
            });
        }
    </script>
</body>
</html>`;