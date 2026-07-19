/**
 * TEACHERS ACADEMY - Server & Client Core Engine
 * Designed for Cloudflare Workers deployment (ta.js)
 * Implements server-side token injection and high-fidelity single-page-app delivery.
 */

const SECRET_TOKEN = "4fg1iZcgrW2X8QsF0DpX0ekBNZSNmugOWw9TJWVX5cTmYX4il3VIO%2B1lP6eCPAxoj93%2BhuIgNm03oQ1sCIkmv4zjcEdZwiTA5kpS8WG9VH9tQ6nsKQRDDjSzcQCQpASTHpGzOr%2F4vCIOahj4Z%2FMrQ2eud8PtLvIp1xit7EARO18%3D";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle Preflight OPTIONS requests for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    // Secure Server-Side API Proxy (Masks the API entirely & injects Token)
    if (url.pathname.startsWith("/api/")) {
      const targetPath = url.pathname.replace("/api/", "");
      return await handleAPIRequest(request, targetPath);
    }

    // Serve Client Web Application (HTML, Tailwind CSS, Javascript)
    return new Response(HTML_CONTENT, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

/**
 * Intercepts incoming API calls, injects the secret token on the server-side, 
 * packages the payload into a Classwalla-compatible form-data and fetches the remote server.
 */
async function handleAPIRequest(request, path) {
  const targetUrl = "https://backend.classwalla.com/" + path;
  
  let clientData = {};
  if (request.method === "POST") {
    try {
      clientData = await request.json();
    } catch (e) {
      clientData = {};
    }
  }

  // Pack payload into classwalla schema securely
  const payload = {
    data: clientData,
    token: SECRET_TOKEN
  };

  const formData = new FormData();
  formData.append('body', JSON.stringify(payload));

  const headers = new Headers();
  headers.set("Host", "backend.classwalla.com");
  headers.set("Connection", "Keep-Alive");
  headers.set("User-Agent", "okhttp/5.3.2");
  headers.set("Accept-Encoding", "gzip");

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: headers,
      body: formData
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: true, message: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

// ==========================================
// CLIENT-SIDE APPLICATION SOURCE CODE
// ==========================================
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="hi" class="h-full bg-slate-950 text-slate-100">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Teachers Academy - Interactive Classroom Portal</title>
    
    <!-- Tailwind CSS Engine -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        academy: {
                            50: '#f5f3ff',
                            100: '#edd9ff',
                            200: '#d9b3ff',
                            300: '#be80ff',
                            400: '#a14dff',
                            500: '#8c24f5',
                            600: '#7613d1',
                            700: '#5e0bab',
                            800: '#4c098c',
                            900: '#3e0970',
                            950: '#1b0238',
                        },
                        slate: {
                            950: '#060814',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', '-apple-system', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    
    <!-- Premium Google Fonts & FontAwesome -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
            scrollbar-width: thin;
            scrollbar-color: #8c24f5 #060814;
        }
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #060814;
        }
        ::-webkit-scrollbar-thumb {
            background: #8c24f5;
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #a14dff;
        }
        .glass-card {
            background: rgba(15, 17, 34, 0.75);
            backdrop-filter: blur(14px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .glass-nav {
            background: rgba(6, 8, 20, 0.85);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .shimmer {
            background: linear-gradient(90deg, #0e1124 25%, #1c1f3d 50%, #0e1124 75%);
            background-size: 200% 100%;
            animation: loading-shimmer 1.6s infinite;
        }
        @keyframes loading-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        .view-panel {
            transition: opacity 0.15s ease-in-out;
        }
    </style>
</head>
<body class="h-full flex flex-col overflow-hidden text-slate-100 select-none">

    <!-- GLOBAL PREMIUM TOP HEADER BAR -->
    <nav class="glass-nav sticky top-0 z-40 w-full flex-none">
        <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                
                <!-- Premium Logo & Brand Name "TEACHERS ACADEMY by Naveen" -->
                <div class="flex items-center gap-4 cursor-pointer group" onclick="TA.Router.navigate('#/')">
                    <div class="relative">
                        <div class="absolute -inset-1 bg-gradient-to-tr from-academy-600 to-indigo-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                        <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" 
                             alt="Teachers Academy Logo" 
                             class="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover border border-white/10 shadow-lg">
                    </div>
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[9px] font-extrabold text-academy-400 tracking-wider uppercase">by Naveen</span>
                            <span class="h-1 w-1 rounded-full bg-academy-500"></span>
                            <span class="text-[9px] font-medium text-slate-500 uppercase tracking-widest">LIVE CAMPUS</span>
                        </div>
                        <h1 class="text-lg sm:text-2xl font-black tracking-tight text-white group-hover:text-academy-300 transition-all">
                            TEACHERS <span class="bg-gradient-to-r from-academy-400 to-indigo-300 bg-clip-text text-transparent">ACADEMY</span>
                        </h1>
                    </div>
                </div>

                <!-- Simple Clean Navigation Button (Header) -->
                <div class="flex items-center gap-2">
                    <button onclick="TA.Router.navigate('#/all-courses')" class="hidden sm:flex bg-gradient-to-r from-academy-600 to-indigo-600 hover:from-academy-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg items-center gap-1.5">
                        <i class="fa-solid fa-compass"></i> Explore Courses
                    </button>
                </div>
                
            </div>
        </div>
    </nav>

    <!-- MAIN FRAME LAYOUT -->
    <div class="flex-1 flex overflow-hidden w-full">
        
        <!-- SIDEBAR (DESKTOP) -->
        <aside class="hidden lg:flex flex-col w-72 bg-slate-950 border-r border-slate-900/60 p-5 shrink-0 justify-between">
            <div class="space-y-6">
                <div class="space-y-2">
                    <p class="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navigation</p>
                    <nav class="space-y-1">
                        <button onclick="TA.Router.navigate('#/')" id="sidebar-home" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-academy-400 bg-academy-950/20 border-l-4 border-academy-500">
                            <i class="fa-solid fa-graduation-cap text-lg"></i> 
                            <span>My Batches</span>
                        </button>
                        <button onclick="TA.Router.navigate('#/all-courses')" id="sidebar-browse" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-slate-400 hover:text-white hover:bg-slate-900/40">
                            <i class="fa-solid fa-compass text-lg"></i> 
                            <span>All Courses</span>
                        </button>
                    </nav>
                </div>

                <!-- Academic Progress -->
                <div class="space-y-3">
                    <p class="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Course Progress</p>
                    <div class="bg-slate-900/40 border border-slate-900/80 p-4 rounded-2xl space-y-3">
                        <div class="space-y-1">
                            <div class="flex justify-between text-xs">
                                <span class="text-slate-400">Lessons Completed:</span>
                                <span id="desktop-lectures-done" class="font-bold text-white">0</span>
                            </div>
                            <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                <div id="desktop-progress-bar" class="bg-gradient-to-r from-academy-500 to-indigo-500 h-1.5 transition-all duration-500" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer signatures -->
            <div class="text-[10px] text-slate-500 border-t border-slate-900/60 pt-4">
                <p>&copy; 2026 Teachers Academy</p>
                <p class="mt-0.5">Design & Platform by <span class="text-slate-400 font-semibold">Naveen</span></p>
            </div>
        </aside>

        <!-- MAIN WORKSPACE -->
        <main class="flex-1 flex flex-col overflow-y-auto bg-slate-950 relative w-full">
            
            <!-- MASTER CONTROLS / TITLE BAR -->
            <div id="master-header" class="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-4 flex items-center justify-between gap-4 w-full">
                <div class="flex items-center gap-3">
                    <button id="btn-master-back" onclick="window.history.back()" class="hidden hover:bg-slate-900 bg-slate-950 p-2.5 rounded-xl text-slate-400 hover:text-white border border-slate-800 transition-all">
                        <i class="fa-solid fa-arrow-left"></i>
                    </button>
                    <div>
                        <h2 id="view-header-title" class="text-md sm:text-lg font-extrabold text-white">My Academic Batches</h2>
                        <p id="view-header-subtitle" class="text-[11px] text-slate-400">आपकी सक्रिय अध्ययन कक्षाएं</p>
                    </div>
                </div>

                <div>
                    <button id="master-btn-all-courses" onclick="TA.Router.navigate('#/all-courses')" class="bg-gradient-to-r from-academy-600 to-indigo-600 hover:from-academy-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-1.5">
                        <i class="fa-solid fa-plus-circle"></i> Browse All Courses
                    </button>
                </div>
            </div>

            <!-- VIEW 1: MY BATCHES (DASHBOARD) -->
            <div id="view-my-batches" class="view-panel p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6">
                <!-- Welcome Card -->
                <div class="bg-gradient-to-r from-slate-900 via-indigo-950/10 to-slate-900 p-6 rounded-3xl border border-indigo-950/20 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div class="space-y-1.5 relative z-10">
                        <span class="text-[9px] font-bold text-academy-400 bg-academy-950/60 px-3 py-1 rounded-full uppercase tracking-wider border border-academy-900/20">Classroom Portal</span>
                        <h3 class="text-xl sm:text-2xl font-black text-white">Welcome Back Student!</h3>
                        <p class="text-xs text-slate-400 max-w-lg">अपनी कक्षाएं चुनें और बिना किसी बाधा के अपनी परीक्षा की तैयारी सुचारू रूप से शुरू करें।</p>
                    </div>
                    <div class="flex gap-3 relative z-10">
                        <div class="bg-slate-950/85 border border-slate-900 p-4 rounded-2xl text-center min-w-[85px]">
                            <span id="stat-batch-count" class="text-lg font-black text-white">0</span>
                            <span class="text-[8px] text-slate-500 block uppercase font-bold mt-1">My Batches</span>
                        </div>
                        <div class="bg-slate-950/85 border border-slate-900 p-4 rounded-2xl text-center min-w-[85px]">
                            <span id="stat-lecture-progress" class="text-lg font-black text-academy-400">0%</span>
                            <span class="text-[8px] text-slate-500 block uppercase font-bold mt-1">Finished</span>
                        </div>
                    </div>
                </div>

                <!-- Empty Batches Frame -->
                <div id="panel-empty-batches" class="hidden text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-900 max-w-lg mx-auto space-y-5">
                    <div class="h-16 w-16 bg-academy-950/40 text-academy-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>
                    <div class="space-y-1">
                        <h3 class="text-md font-bold text-white">No Enrolled Batches</h3>
                        <p class="text-xs text-slate-400">आपकी लाइब्रेरी में अभी कोई बैच सेव नहीं है। "All Courses" बटन से कोर्सेज ढूंढें।</p>
                    </div>
                    <button onclick="TA.Router.navigate('#/all-courses')" class="bg-academy-600 hover:bg-academy-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md">
                        Browse Course Catalog
                    </button>
                </div>

                <!-- My Batches Grid -->
                <div id="my-batches-grid-canvas" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <!-- Dynamic -->
                </div>
            </div>

            <!-- VIEW 2: EXPLORE CATEGORIES (ALL COURSES ENTRY SCREEN) -->
            <div id="view-categories" class="view-panel hidden p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6">
                <div class="bg-slate-900/40 border border-slate-900 p-6 rounded-3xl space-y-3">
                    <h3 class="text-lg font-bold text-white">Choose Learning Path</h3>
                    <p class="text-xs text-slate-400">अपनी पसंदीदा कैटेगरी का चयन करें और उसके अंतर्गत उपलब्ध विशेष कोर्सेज देखें।</p>
                </div>

                <!-- Loader -->
                <div id="categories-shimmer" class="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <div class="shimmer h-32 rounded-2xl"></div>
                    <div class="shimmer h-32 rounded-2xl"></div>
                    <div class="shimmer h-32 rounded-2xl"></div>
                    <div class="shimmer h-32 rounded-2xl"></div>
                </div>

                <!-- Categories Grid -->
                <div id="categories-selection-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <!-- Dynamic -->
                </div>
            </div>

            <!-- VIEW 3: COURSE LIST UNDER SELECTION -->
            <div id="view-category-courses" class="view-panel hidden p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6">
                <div class="flex items-center justify-between border-b border-slate-900 pb-4">
                    <div class="space-y-1">
                        <h3 id="category-panel-title" class="text-md sm:text-lg font-extrabold text-white">Courses</h3>
                        <p class="text-xs text-slate-400">इस कैटेगरी के अंतर्गत चल रहे एक्टिव बैच</p>
                    </div>
                    <button onclick="TA.Router.navigate('#/all-courses')" class="text-xs text-academy-400 hover:text-academy-300 font-bold flex items-center gap-1.5">
                        <i class="fa-solid fa-chevron-left"></i> All Categories
                    </button>
                </div>

                <!-- Loader -->
                <div id="courses-shimmer" class="hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <div class="shimmer h-72 rounded-3xl"></div>
                    <div class="shimmer h-72 rounded-3xl"></div>
                </div>

                <!-- Courses Output -->
                <div id="courses-display-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <!-- Dynamic -->
                </div>
            </div>

            <!-- VIEW 4: ACTIVE CLASSROOM & LECTURE VIEW -->
            <div id="view-classroom" class="view-panel hidden flex-1 flex flex-col overflow-hidden w-full">
                <!-- Classroom Header Banner -->
                <div class="bg-slate-900/60 border-b border-slate-900 p-4 sm:p-6 flex-none w-full">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <img id="classroom-banner-img" src="" alt="Thumbnail" class="h-14 w-24 object-cover rounded-xl border border-slate-800 shadow">
                            <div>
                                <h3 id="classroom-banner-title" class="text-sm sm:text-md font-bold text-white line-clamp-1">Course Title</h3>
                                <p id="classroom-banner-id" class="text-xs text-slate-500">Batch ID: --</p>
                            </div>
                        </div>
                        <button id="btn-classroom-save-toggle" class="bg-academy-600 hover:bg-academy-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
                            <i class="fa-solid fa-bookmark"></i> Enrolled
                        </button>
                    </div>
                </div>

                <!-- Adaptive Full Screen Dual Panels (Syllabus Navigator / Playlist) -->
                <div class="flex-1 flex flex-col lg:flex-row overflow-hidden w-full">
                    
                    <!-- Syllabus Navigator Drawer (Full-Width on Mobile when no chapter is active) -->
                    <div id="classroom-syllabus-panel" class="w-full lg:w-80 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-900 p-4 shrink-0 overflow-y-auto space-y-4">
                        <div class="px-1 space-y-0.5">
                            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest">Syllabus Index</h4>
                            <p class="text-[10px] text-slate-500">विषयानुसार (Subject-wise) चैप्टर्स लोड करें</p>
                        </div>
                        
                        <!-- Accordion Loaders -->
                        <div id="syllabus-shimmer" class="hidden space-y-2">
                            <div class="shimmer h-12 rounded-xl"></div>
                            <div class="shimmer h-12 rounded-xl"></div>
                        </div>

                        <div id="syllabus-accordion-tree" class="space-y-2 w-full">
                            <!-- Dynamic -->
                        </div>
                    </div>

                    <!-- Playlist Display Area (Full-Width on Mobile when a chapter is selected) -->
                    <div id="classroom-lectures-panel" class="hidden lg:flex flex-1 flex-col overflow-hidden bg-slate-950/40 w-full">
                        <div class="p-4 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div class="flex items-center gap-3">
                                <!-- Mobile Only Back-To-Syllabus Button -->
                                <button onclick="TA.UI.showSyllabusIndexMobile()" class="lg:hidden bg-slate-900 hover:bg-slate-800 p-2 rounded-xl border border-slate-800 text-slate-300">
                                    <i class="fa-solid fa-chevron-left mr-1"></i> Chapters
                                </button>
                                <div>
                                    <h4 id="active-subject-header" class="text-xs sm:text-sm font-bold text-white">Select a Topic</h4>
                                    <p id="active-chapter-header" class="text-[11px] text-slate-500">चैप्टर के लेक्चर्स यहाँ दिखाई देंगे</p>
                                </div>
                            </div>
                            
                            <!-- Internal Search Filter -->
                            <div class="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-xl border border-slate-900 w-full sm:w-60">
                                <i class="fa-solid fa-magnifying-glass text-slate-650 text-xs"></i>
                                <input type="text" id="lecture-search-input" oninput="TA.UI.filterLectures()" placeholder="Search video or notes..." class="bg-transparent border-0 outline-none text-xs text-white focus:ring-0 w-full">
                            </div>
                        </div>

                        <!-- Scroller Grid -->
                        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                            <div id="lectures-shimmer" class="hidden grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                <div class="shimmer h-48 rounded-2xl"></div>
                                <div class="shimmer h-48 rounded-2xl"></div>
                            </div>

                            <!-- Empty playlist view -->
                            <div id="classroom-empty-state" class="text-center py-20 text-slate-500 space-y-3 max-w-xs mx-auto">
                                <i class="fa-solid fa-folder-open text-4xl text-slate-700"></i>
                                <p class="text-xs">पढ़ना शुरू करने के लिए लेफ्ट साइडबार से कोई भी chapter लोड करें।</p>
                            </div>

                            <div id="classroom-lectures-output-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                                <!-- Dynamic Lectures -->
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </main>
    </div>

    <!-- MOBILE NAVIGATION TAB-BAR (BOTTOM BAR) -->
    <nav class="lg:hidden glass-nav border-t border-slate-900 px-6 py-3.5 flex justify-around items-center shrink-0">
        <button onclick="TA.Router.navigate('#/')" id="mob-nav-home" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-all">
            <i class="fa-solid fa-graduation-cap text-lg"></i>
            <span class="text-[9px] font-bold">My Batches</span>
        </button>
        <button onclick="TA.Router.navigate('#/all-courses')" id="mob-nav-browse" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-all">
            <i class="fa-solid fa-compass text-lg"></i>
            <span class="text-[9px] font-bold">All Courses</span>
        </button>
    </nav>

    <!-- TOAST POPUP OUTLET -->
    <div id="toast-overlay-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>

    <!-- THEATER MODE POPUP PLAYER MODAL -->
    <div id="video-theater-modal" class="hidden fixed inset-0 z-50 bg-slate-950/98 backdrop-blur flex items-center justify-center p-4">
        <div class="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative">
            <button onclick="TA.UI.closeTheaterMode()" class="absolute top-4 right-4 z-10 bg-slate-950/80 hover:bg-slate-800 p-2 rounded-full border border-slate-850 text-slate-300 hover:text-white transition-all">
                <i class="fa-solid fa-xmark text-md"></i>
            </button>

            <!-- Video Player Embedded Context -->
            <div class="relative w-full aspect-video bg-black flex items-center justify-center">
                <iframe id="theater-iframe" src="" class="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                
                <div id="theater-restricted-fallback" class="hidden absolute inset-0 flex flex-col items-center justify-center bg-slate-950 p-6 text-center space-y-4">
                    <i class="fa-solid fa-circle-exclamation text-amber-500 text-5xl"></i>
                    <div>
                        <h4 class="text-md font-bold text-white">In-App Playback Restricted</h4>
                        <p class="text-xs text-slate-400 mt-1">सुरक्षा कारणों से यह वीडियो इस फ्रेम में लोड नहीं हो सकता। कृपया सीधे ब्राउज़र टैब में खोलें।</p>
                    </div>
                    <a id="theater-fallback-link-btn" href="#" target="_blank" class="bg-academy-600 hover:bg-academy-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all">
                        Open on YouTube <i class="fa-solid fa-external-link ml-1"></i>
                    </a>
                </div>
            </div>

            <!-- Media details header -->
            <div class="p-4 sm:p-5 bg-slate-950 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h4 id="theater-video-title" class="text-xs sm:text-sm font-bold text-white line-clamp-1">Classroom Lecture Video Title</h4>
                    <p class="text-[10px] text-slate-500 mt-0.5">Teachers Academy Interactive Streaming Client</p>
                </div>
                
                <div class="flex items-center gap-2 shrink-0">
                    <a id="theater-external-anchor" href="" target="_blank" class="bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-[10px] text-indigo-300 font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
                        Open Video <i class="fa-solid fa-up-right-from-square"></i>
                    </a>
                    <button id="btn-theater-mark-done" onclick="" class="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-[10px] text-emerald-300 font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5">
                        <i class="fa-solid fa-check"></i> Mark Completed
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- CORE JAVASCRIPT LOGIC -->
    <script>
        const appState = {
            categories: [],
            courses: {},
            activeCategory: null,
            activeCourseId: null,
            activeCourseName: null,
            activeCourseThumb: null,
            activeCoursePrice: null,
            
            myBatches: JSON.parse(localStorage.getItem('ta_enrolled_batches')) || [],
            completedLectures: JSON.parse(localStorage.getItem('ta_completed_indices')) || [],
            
            syllabusTree: [],
            activeLectures: []
        };

        // Router Interface with history state matching for back navs
        const Router = {
            init: function() {
                var self = this;
                window.addEventListener('hashchange', function() { self.handleRoute(); });
                window.addEventListener('load', function() { self.handleRoute(); });
            },

            navigate: function(hash) {
                if (window.location.hash === hash) {
                    this.handleRoute(); // Force re-render if clicked on the same tab
                } else {
                    window.location.hash = hash;
                }
            },

            handleRoute: async function() {
                const hash = window.location.hash || '#/';
                document.querySelector('main').scrollTop = 0;

                const btnBack = document.getElementById('btn-master-back');
                if (hash === '#/' || hash === '') {
                    btnBack.classList.add('hidden');
                } else {
                    btnBack.classList.remove('hidden');
                }

                TA.UI.closeTheaterMode();

                // Dynamic Full-Screen Router Mapping
                if (hash === '#/' || hash === '') {
                    this.switchPanel('view-my-batches');
                    TA.UI.updateHeaderMeta("My Academic Batches", "आपकी सक्रिय अध्ययन कक्षाएं");
                    TA.UI.renderMyBatchesGrid();
                    TA.UI.updateNavHighlighter('sidebar-home', 'mob-nav-home');
                }
                else if (hash === '#/all-courses') {
                    this.switchPanel('view-categories');
                    TA.UI.updateHeaderMeta("Teachers Academy Live Catalog", "कैटेगरी चुनें और कोर्सेज की लाइब्रेरी बनाएं");
                    TA.UI.updateNavHighlighter('sidebar-browse', 'mob-nav-browse');
                    await TA.API.fetchCategories();
                }
                else if (hash.startsWith('#/category/')) {
                    const categoryId = hash.split('#/category/')[1];
                    appState.activeCategory = categoryId;
                    this.switchPanel('view-category-courses');

                    const catObj = appState.categories.find(function(c) { return String(c.categoryId) === String(categoryId); });
                    const catTitle = catObj ? catObj.courseCategory : "Courses";
                    
                    document.getElementById('category-panel-title').innerText = catTitle;
                    TA.UI.updateHeaderMeta(catTitle, "सक्रिय कोर्सेज की सूची");
                    
                    await TA.API.fetchCourses(categoryId);
                }
                else if (hash.startsWith('#/course/')) {
                    const params = hash.split('#/course/')[1].split('/');
                    const courseId = params[0];
                    appState.activeCourseId = courseId;

                    this.switchPanel('view-classroom');
                    TA.UI.updateHeaderMeta("Interactive Classroom", "सब्जेक्ट्स, लेक्चर्स और क्लास नोट्स");

                    await TA.API.fetchCourseSyllabus(courseId);

                    if (params.length === 3) {
                        const catId = params[1];
                        const subId = params[2];
                        await TA.API.fetchLectures(courseId, catId, subId);
                        
                        // Show Playlist view and Hide Syllabus Index view on mobile screen
                        TA.UI.showLecturesPanelMobile();
                    } else {
                        // Clear active states and show only Syllabus index
                        document.getElementById('classroom-lectures-output-grid').innerHTML = '';
                        document.getElementById('classroom-empty-state').classList.remove('hidden');
                        document.getElementById('active-subject-header').innerText = "Select Classroom Chapter";
                        document.getElementById('active-chapter-header').innerText = "पढ़ना शुरू करने के लिए लेफ्ट साइडबार में उपलब्ध टॉपिक्स पर क्लिक करें।";
                        
                        // Show Chapters list and Hide Playlist on mobile
                        TA.UI.showSyllabusIndexMobile();
                    }
                }
            },

            switchPanel: function(id) {
                document.querySelectorAll('.view-panel').forEach(function(panel) { panel.classList.add('hidden'); });
                const active = document.getElementById(id);
                if (active) active.classList.remove('hidden');
            }
        };

        // Platform Main Engine
        const TA = {
            Router: Router,

            init: function() {
                this.Router.init();
                this.UI.updateGlobalStatistics();
            },

            API: {
                callPost: async function(path, dataPayload) {
                    const response = await fetch("/api/" + path, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(dataPayload)
                    });

                    if (!response.ok) {
                        throw new Error("API response failure: " + response.status);
                    }
                    return await response.json();
                },

                fetchCategories: async function() {
                    const shimmer = document.getElementById('categories-shimmer');
                    const grid = document.getElementById('categories-selection-grid');
                    shimmer.classList.remove('hidden');
                    grid.innerHTML = '';

                    try {
                        const json = await this.callPost('coursecategory/v1/getCourseCategory', { companyId: 46 });
                        appState.categories = json?.data?.courseCategory || [];
                        shimmer.classList.add('hidden');
                        TA.UI.renderCategories(appState.categories);
                    } catch (e) {
                        console.error(e);
                        shimmer.classList.add('hidden');
                        TA.UI.showToast("सर्वर से डेटा लोड करने में त्रुटि।", "danger");
                    }
                },

                fetchCourses: async function(categoryId) {
                    const shimmer = document.getElementById('courses-shimmer');
                    const grid = document.getElementById('courses-display-grid');
                    shimmer.classList.remove('hidden');
                    grid.innerHTML = '';

                    try {
                        const json = await this.callPost('coursecategory/v1/getLayoutV2', {
                            candidateId: "806386",
                            categoryId: parseInt(categoryId),
                            companyId: 46,
                            limit: "100",
                            offset: "0"
                        });
                        appState.courses[categoryId] = json?.data?.layout?.[0]?.content || [];
                        shimmer.classList.add('hidden');
                        TA.UI.renderCourses(appState.courses[categoryId]);
                    } catch (e) {
                        console.error(e);
                        shimmer.classList.add('hidden');
                        TA.UI.showToast("कोर्स की सूची लोड करने में विफल।", "danger");
                    }
                },

                fetchCourseSyllabus: async function(courseId) {
                    const shimmer = document.getElementById('syllabus-shimmer');
                    const tree = document.getElementById('syllabus-accordion-tree');
                    shimmer.classList.remove('hidden');
                    tree.innerHTML = '';

                    try {
                        const json = await this.callPost('course/course/getCourseCategories', { courseId: courseId });
                        const catList = json?.data?.categoryList || [];
                        
                        appState.syllabusTree = catList.map(function(cat) {
                            return {
                                categoryId: cat.id,
                                categoryName: cat.categoryName,
                                subCategories: (cat.subCategory || []).map(function(sub) {
                                    return {
                                        subCategoryId: sub.subCategoryId,
                                        subCategoryName: sub.subCategory
                                    };
                                })
                            };
                        });

                        shimmer.classList.add('hidden');
                        TA.UI.renderSyllabusTree();

                        // Set classroom header meta details dynamically
                        const savedObj = appState.myBatches.find(function(b) { return String(b.courseId) === String(courseId); });
                        if (savedObj) {
                            TA.UI.setClassroomMeta(savedObj.courseName, savedObj.courseId, savedObj.thumbnail);
                        } else {
                            let cached = null;
                            Object.values(appState.courses).forEach(function(arr) {
                                const matched = arr.find(function(c) { return String(c.courseId) === String(courseId); });
                                if (matched) cached = matched;
                            });
                            if (cached) {
                                TA.UI.setClassroomMeta(cached.courseName, cached.courseId, cached.thumbnail || cached.cthumb);
                            } else {
                                TA.UI.setClassroomMeta("Active Learning Class", courseId, "");
                            }
                        }
                    } catch (e) {
                        console.error(e);
                        shimmer.classList.add('hidden');
                    }
                },

                fetchLectures: async function(courseId, categoryId, subCategoryId) {
                    const shimmer = document.getElementById('lectures-shimmer');
                    const grid = document.getElementById('classroom-lectures-output-grid');
                    const empty = document.getElementById('classroom-empty-state');

                    shimmer.classList.remove('hidden');
                    grid.innerHTML = '';
                    empty.classList.add('hidden');

                    try {
                        const json = await this.callPost('candidate/candidate/getCourseVideos', {
                            courseId: String(courseId),
                            filters: {
                                videoCategory: String(categoryId),
                                videoSubCategory: String(subCategoryId)
                            },
                            limit: "1000",
                            offset: "0"
                        });

                        const fetched = json?.data?.courseVideo || [];
                        appState.activeLectures = fetched.reverse();
                        shimmer.classList.add('hidden');
                        TA.UI.renderLectures(appState.activeLectures);
                    } catch (e) {
                        console.error(e);
                        shimmer.classList.add('hidden');
                    }
                }
            },

            UI: {
                updateHeaderMeta: function(title, subtitle) {
                    document.getElementById('view-header-title').innerText = title;
                    document.getElementById('view-header-subtitle').innerText = subtitle;
                },

                updateNavHighlighter: function(sidebarId, mobId) {
                    document.querySelectorAll('aside button, nav button').forEach(function(btn) {
                        btn.className = "flex flex-col lg:flex-row items-center gap-1 lg:gap-3 px-4 py-1 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-all";
                    });

                    const activeSide = document.getElementById(sidebarId);
                    if (activeSide) {
                        activeSide.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-academy-400 bg-academy-950/20 border-l-4 border-academy-500";
                    }

                    const activeMob = document.getElementById(mobId);
                    if (activeMob) {
                        activeMob.className = "flex flex-col items-center gap-1 text-academy-400 transition-all font-bold";
                    }
                },

                updateGlobalStatistics: function() {
                    const doneCount = appState.completedLectures.length;
                    document.getElementById('desktop-lectures-done').innerText = doneCount;

                    const percent = Math.min(100, Math.round(doneCount * 12.5));
                    document.getElementById('desktop-progress-bar').style.width = percent + "%";
                    document.getElementById('stat-lecture-progress').innerText = percent + "%";
                },

                // Toggle views on mobile class layout
                showLecturesPanelMobile: function() {
                    if (window.innerWidth < 1024) {
                        document.getElementById('classroom-syllabus-panel').classList.add('hidden');
                        document.getElementById('classroom-lectures-panel').classList.remove('hidden');
                    }
                },

                showSyllabusIndexMobile: function() {
                    if (window.innerWidth < 1024) {
                        document.getElementById('classroom-syllabus-panel').classList.remove('hidden');
                        document.getElementById('classroom-lectures-panel').classList.add('hidden');
                    }
                },

                enrollBatch: function(courseObj) {
                    if (appState.myBatches.some(function(b) { return String(b.courseId) === String(courseObj.courseId); })) {
                        this.showToast("यह बैच पहले से ही एनरोल किया हुआ है।", "info");
                        return;
                    }

                    appState.myBatches.push(courseObj);
                    localStorage.setItem('ta_enrolled_batches', JSON.stringify(appState.myBatches));
                    this.updateGlobalStatistics();
                    this.showToast("सफलतापूर्वक एनरोल किया: " + courseObj.courseName, "success");

                    if (appState.activeCourseId === String(courseObj.courseId)) {
                        this.toggleEnrollmentButtonState(true);
                    }
                },

                unenrollBatch: function(courseId) {
                    appState.myBatches = appState.myBatches.filter(function(b) { return String(b.courseId) !== String(courseId); });
                    localStorage.setItem('ta_enrolled_batches', JSON.stringify(appState.myBatches));
                    this.updateGlobalStatistics();
                    this.showToast("बैच रिमूव कर दिया गया है।", "info");

                    if (window.location.hash === '#/' || window.location.hash === '') {
                        this.renderMyBatchesGrid();
                    }

                    if (appState.activeCourseId === String(courseId)) {
                        this.toggleEnrollmentButtonState(false);
                    }
                },

                toggleEnrollmentButtonState: function(isEnrolled) {
                    const btn = document.getElementById('btn-classroom-save-toggle');
                    if (!btn) return;

                    var self = this;
                    if (isEnrolled) {
                        btn.className = "bg-rose-950 hover:bg-rose-900 border border-rose-900 text-rose-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5";
                        btn.innerHTML = "<i class='fa-solid fa-trash-can'></i> Disenroll";
                        btn.onclick = function() { self.unenrollBatch(appState.activeCourseId); };
                    } else {
                        btn.className = "bg-academy-600 hover:bg-academy-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-academy-600/10";
                        btn.innerHTML = "<i class='fa-solid fa-bookmark'></i> Enroll Class";
                        
                        const courseObj = {
                            courseId: appState.activeCourseId,
                            courseName: appState.activeCourseName,
                            thumbnail: appState.activeCourseThumb,
                            price: appState.activeCoursePrice || 'Premium Access'
                        };
                        btn.onclick = function() { self.enrollBatch(courseObj); };
                    }
                },

                setClassroomMeta: function(name, id, thumb) {
                    appState.activeCourseName = name;
                    appState.activeCourseThumb = thumb;

                    document.getElementById('classroom-banner-title').innerText = name;
                    document.getElementById('classroom-banner-id').innerText = "Batch ID: " + id;
                    document.getElementById('classroom-banner-img').src = thumb || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';

                    const isEnrolled = appState.myBatches.some(function(b) { return String(b.courseId) === String(id); });
                    this.toggleEnrollmentButtonState(isEnrolled);
                },

                renderMyBatchesGrid: function() {
                    const grid = document.getElementById('my-batches-grid-canvas');
                    const empty = document.getElementById('panel-empty-batches');
                    grid.innerHTML = '';

                    if (appState.myBatches.length === 0) {
                        empty.classList.remove('hidden');
                        document.getElementById('stat-batch-count').innerText = "0";
                        return;
                    }
                    empty.classList.add('hidden');
                    document.getElementById('stat-batch-count').innerText = appState.myBatches.length;

                    appState.myBatches.forEach(function(b) {
                        const fallback = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';
                        const thumb = b.thumbnail || fallback;

                        const card = [
                            '<div class="glass-card rounded-2xl overflow-hidden group hover:border-academy-500/50 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">',
                            '    <div class="relative aspect-video overflow-hidden">',
                            '        <img src="' + thumb + '" onerror="this.src=\'' + fallback + '\'" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300">',
                            '        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>',
                            '        <span class="absolute top-3 right-3 bg-academy-600/90 text-white font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest shadow border border-white/10">',
                            '            Active Class',
                            '        </span>',
                            '    </div>',
                            '    ',
                            '    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">',
                            '        <div class="space-y-1.5">',
                            '            <div class="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">',
                            '                <span>BATCH ID: ' + b.courseId + '</span>',
                            '                <span class="text-academy-400 font-bold">' + b.price + '</span>',
                            '            </div>',
                            '            <h4 class="text-sm font-extrabold text-white group-hover:text-academy-300 transition-colors line-clamp-2">' + b.courseName + '</h4>',
                            '        </div>',
                            '        ',
                            '        <div class="flex items-center justify-between border-t border-slate-900/80 pt-4 gap-2">',
                            '            <button onclick="TA.UI.unenrollBatch(\'' + b.courseId + '\')" class="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5">',
                            '                <i class="fa-solid fa-trash"></i> Remove',
                            '            </button>',
                            '            <button onclick="TA.Router.navigate(\'#/course/' + b.courseId + '\')" class="bg-academy-600 hover:bg-academy-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5">',
                            '                 Enter Classroom <i class="fa-solid fa-arrow-right text-[10px]"></i>',
                            '            </button>',
                            '        </div>',
                            '    </div>',
                            '</div>'
                        ].join('');
                        grid.insertAdjacentHTML('beforeend', card);
                    });
                },

                renderCategories: function(list) {
                    const grid = document.getElementById('categories-selection-grid');
                    grid.innerHTML = '';

                    if (list.length === 0) {
                        grid.innerHTML = '<p class="col-span-full text-center py-10 text-xs text-slate-500">No categories found.</p>';
                        return;
                    }

                    const themeGradients = [
                        'from-violet-600/20 via-indigo-900/5 to-slate-950',
                        'from-emerald-600/20 via-teal-900/5 to-slate-950',
                        'from-rose-600/20 via-pink-900/5 to-slate-950',
                        'from-sky-600/20 via-blue-900/5 to-slate-950'
                    ];

                    list.forEach(function(cat, index) {
                        const gradient = themeGradients[index % themeGradients.length];
                        
                        const card = [
                            '<div onclick="TA.Router.navigate(\'#/category/' + cat.categoryId + '\')" class="glass-card bg-gradient-to-br ' + gradient + ' p-5 rounded-2xl cursor-pointer hover:-translate-y-1 hover:border-academy-500/50 transition-all duration-300 group flex flex-col justify-between h-36">',
                            '    <div class="flex justify-between items-start">',
                            '        <div class="p-2.5 bg-slate-900/95 rounded-xl border border-slate-800 group-hover:bg-academy-500/10 group-hover:border-academy-500/20 transition-all">',
                            '            <i class="fa-solid fa-graduation-cap text-lg text-academy-400"></i>',
                            '        </div>',
                            '        <span class="text-[9px] font-bold text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">ID: ' + cat.categoryId + '</span>',
                            '    </div>',
                            '    <h4 class="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-academy-300 transition-colors line-clamp-2">' + cat.courseCategory + '</h4>',
                            '</div>'
                        ].join('');
                        grid.insertAdjacentHTML('beforeend', card);
                    });
                },

                renderCourses: function(list) {
                    const grid = document.getElementById('courses-display-grid');
                    grid.innerHTML = '';

                    if (!list || list.length === 0) {
                        grid.innerHTML = [
                            '<div class="col-span-full text-center py-24 text-slate-500 space-y-3">',
                            '    <i class="fa-solid fa-face-frown text-4xl opacity-40"></i>',
                            '    <p class="text-sm font-bold">इस श्रेणी में कोई लाइव बैच उपलब्ध नहीं हैं।</p>',
                            '</div>'
                        ].join('');
                        return;
                    }

                    list.forEach(function(course) {
                        const rawThumb = course.cthumb || course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';
                        const price = course.price ? '₹' + course.price : 'Access Granted';
                        
                        const itemPayload = JSON.stringify({
                            courseId: course.courseId,
                            courseName: course.courseName,
                            thumbnail: rawThumb,
                            price: price
                        }).replace(/"/g, '&quot;');

                        const card = [
                            '<div class="glass-card rounded-2xl overflow-hidden group hover:border-academy-500/40 transition-all duration-300 flex flex-col justify-between">',
                            '    <div class="relative aspect-video overflow-hidden bg-slate-950">',
                            '        <img src="' + rawThumb + '" onerror="this.src=\'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80\'" class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300">',
                            '        <span class="absolute bottom-3 left-3 bg-emerald-600 border border-emerald-500 text-white font-extrabold text-[11px] px-3 py-1 rounded-lg shadow-md">',
                            '            ' + price,
                            '        </span>',
                            '    </div>',
                            '    <div class="p-5 flex-1 flex flex-col justify-between space-y-4">',
                            '        <div class="space-y-1.5">',
                            '            <p class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">BATCH ID: ' + course.courseId + '</p>',
                            '            <h4 class="text-xs sm:text-sm font-extrabold text-white line-clamp-2 group-hover:text-academy-300 transition-colors">' + course.courseName + '</h4>',
                            '        </div>',
                            '        <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-900">',
                            '            <button onclick="TA.UI.enrollBatch(' + itemPayload + ')" class="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-[10px] text-slate-300 font-extrabold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1">',
                            '                <i class="fa-solid fa-bookmark text-academy-400"></i> Enroll',
                            '            </button>',
                            '            <button onclick="TA.Router.navigate(\'#/course/' + course.courseId + '\')" class="bg-academy-600 hover:bg-academy-500 text-[10px] text-white font-extrabold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 shadow-lg">',
                            '                Classroom <i class="fa-solid fa-circle-arrow-right"></i>',
                            '            </button>',
                            '        </div>',
                            '    </div>',
                            '</div>'
                        ].join('');
                        grid.insertAdjacentHTML('beforeend', card);
                    });
                },

                renderSyllabusTree: function() {
                    const tree = document.getElementById('syllabus-accordion-tree');
                    tree.innerHTML = '';

                    if (appState.syllabusTree.length === 0) {
                        tree.innerHTML = '<p class="text-xs text-slate-500 p-4 text-center">No syllabus chapters.</p>';
                        return;
                    }

                    appState.syllabusTree.forEach(function(subject, idx) {
                        const chaptersButtons = subject.subCategories.map(function(chapter) {
                            return [
                                '<button onclick="TA.UI.selectChapter(' + subject.categoryId + ', \'' + subject.categoryName.replace(/'/g, "\\'") + '\', ' + chapter.subCategoryId + ', \'' + chapter.subCategoryName.replace(/'/g, "\\'") + '\')" id="btn-chap-' + chapter.subCategoryId + '" class="w-full text-left text-[11px] text-slate-400 hover:text-white hover:bg-slate-900/65 px-3 py-2.5 rounded-xl flex items-center gap-2.5 transition-all">',
                                '    <i class="fa-solid fa-circle-play text-slate-650"></i>',
                                '    <span class="truncate">' + chapter.subCategoryName + '</span>',
                                '</button>'
                            ].join('');
                        }).join('');

                        const accordionBlock = [
                            '<div class="border border-slate-900 rounded-2xl overflow-hidden bg-slate-950/40">',
                            '    <button onclick="TA.UI.toggleAccordionBlock(' + idx + ')" class="w-full flex items-center justify-between px-4 py-3 bg-slate-900/30 hover:bg-slate-900/50 transition-all text-xs font-bold text-slate-200">',
                            '        <span class="truncate pr-2 text-left flex items-center gap-2">',
                            '            <i class="fa-solid fa-folder text-academy-400"></i> ' + subject.categoryName,
                            '        </span>',
                            '        <i id="acc-arrow-' + idx + '" class="fa-solid fa-chevron-down transition-transform text-[9px] text-slate-500"></i>',
                            '    </button>',
                            '    <div id="acc-content-' + idx + '" class="hidden p-1.5 space-y-1 bg-slate-950 border-t border-slate-900">',
                            '        ' + (chaptersButtons || '<p class="text-[9px] text-slate-650 p-2 text-center">No lessons</p>'),
                            '    </div>',
                            '</div>'
                        ].join('');
                        tree.insertAdjacentHTML('beforeend', accordionBlock);
                    });
                },

                toggleAccordionBlock: function(idx) {
                    const el = document.getElementById("acc-content-" + idx);
                    const arrow = document.getElementById("acc-arrow-" + idx);
                    if (el.classList.contains('hidden')) {
                        el.classList.remove('hidden');
                        arrow.classList.add('rotate-180');
                    } else {
                        el.classList.add('hidden');
                        arrow.classList.remove('rotate-180');
                    }
                },

                selectChapter: function(catId, catName, subId, subName) {
                    document.querySelectorAll('#syllabus-accordion-tree button').forEach(function(b) {
                        b.classList.remove('bg-academy-950/30', 'text-academy-400');
                    });
                    const activeBtn = document.getElementById("btn-chap-" + subId);
                    if (activeBtn) activeBtn.classList.add('bg-academy-950/30', 'text-academy-400');

                    document.getElementById('active-subject-header').innerText = catName;
                    document.getElementById('active-chapter-header').innerText = subName;

                    window.location.hash = "#/course/" + appState.activeCourseId + "/" + catId + "/" + subId;
                },

                extractYoutubeId: function(url) {
                    if (!url) return null;
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                    const match = url.match(regExp);
                    return (match && match[2].length === 11) ? match[2] : null;
                },

                getYoutubeThumbnail: function(url) {
                    const id = this.extractYoutubeId(url);
                    if (id) {
                        return "https://img.youtube.com/vi/" + id + "/mqdefault.jpg";
                    }
                    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80';
                },

                formatLectureDate: function(dateStr) {
                    if (!dateStr) return 'Live Scheduled';
                    try {
                        const parts = dateStr.split(' ');
                        const dateOnly = parts[0].split('-');
                        return dateOnly[2] + "-" + dateOnly[1] + "-" + dateOnly[0];
                    } catch (e) {
                        return dateStr;
                    }
                },

                renderLectures: function(lectures) {
                    const grid = document.getElementById('classroom-lectures-output-grid');
                    const empty = document.getElementById('classroom-empty-state');
                    grid.innerHTML = '';

                    if (!lectures || lectures.length === 0) {
                        empty.classList.remove('hidden');
                        return;
                    }
                    empty.classList.add('hidden');

                    var self = this;
                    lectures.forEach(function(l) {
                        const title = l.title || 'Untitled Lesson';
                        const videoLink = l.url || l.Url || '';
                        const pdfLink = l.pdfUrl || '';
                        const thumb = self.getYoutubeThumbnail(videoLink);
                        const displayDate = self.formatLectureDate(l.eventDateTime);
                        
                        const lectureId = l.id || String(title).replace(/\s/g, '');
                        const isCompleted = appState.completedLectures.includes(String(lectureId));

                        const playButtonHtml = videoLink ? 
                            '<button onclick="TA.UI.openTheaterMode(\'' + videoLink + '\', \'' + title.replace(/'/g, "\\'") + '\', \'' + lectureId + '\')" class="h-11 w-11 bg-academy-600 hover:bg-academy-500 hover:scale-110 text-white rounded-full flex items-center justify-center transition-all shadow-lg"><i class="fa-solid fa-play ml-1 text-sm"></i></button>' 
                            : '<div class="h-11 w-11 bg-slate-900 border border-slate-800 text-slate-600 rounded-full flex items-center justify-center"><i class="fa-solid fa-lock text-xs"></i></div>';

                        const pdfBtnHtml = pdfLink ? 
                            '<a href="' + pdfLink + '" target="_blank" class="bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-800/40 text-[9px] text-emerald-300 font-extrabold py-2 rounded-xl transition-all flex items-center justify-center gap-1"><i class="fa-solid fa-file-pdf"></i> PDF Notes</a>' : '';

                        const extBtnHtml = videoLink ? 
                            '<a href="' + videoLink + '" target="_blank" class="bg-indigo-950/50 hover:bg-indigo-900 border border-indigo-800/40 text-[9px] text-indigo-300 font-extrabold py-2 rounded-xl transition-all flex items-center justify-center gap-1"><i class="fa-solid fa-external-link"></i> Play External</a>' : '';

                        const completedBadgeHtml = isCompleted ? 
                            '<span class="absolute bottom-2.5 right-2.5 bg-emerald-600 border border-emerald-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider">Completed <i class="fa-solid fa-check"></i></span>' : '';

                        const card = [
                            '<div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-800 transition-all duration-300">',
                            '    <div class="relative aspect-video overflow-hidden bg-slate-950">',
                            '        <img src="' + thumb + '" class="object-cover w-full h-full">',
                            '        <div class="absolute inset-0 bg-slate-950/70 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">',
                            '            ' + playButtonHtml,
                            '        </div>',
                            '        <span class="absolute top-2.5 left-2.5 bg-slate-950/90 border border-slate-800 text-[8px] font-bold text-slate-400 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase tracking-wider">',
                            '            <i class="fa-solid fa-calendar"></i> ' + displayDate,
                            '        </span>',
                            '        ' + completedBadgeHtml,
                            '    </div>',
                            '    <div class="p-4 flex-1 flex flex-col justify-between space-y-3">',
                            '        <h5 class="text-xs sm:text-sm font-bold text-slate-200 line-clamp-2">' + title + '</h5>',
                            '        <div class="grid ' + (videoLink && pdfLink ? 'grid-cols-2' : 'grid-cols-1') + ' gap-1.5 pt-3 border-t border-slate-900/60">',
                            '            ' + extBtnHtml,
                            '            ' + pdfBtnHtml,
                            '        </div>',
                            '    </div>',
                            '</div>'
                        ].join('');
                        grid.insertAdjacentHTML('beforeend', card);
                    });
                },

                filterLectures: function() {
                    const q = document.getElementById('lecture-search-input').value.toLowerCase();
                    const filtered = appState.activeLectures.filter(function(l) { return (l.title || '').toLowerCase().includes(q); });
                    this.renderLectures(filtered);
                },

                openTheaterMode: function(url, title, lectureId) {
                    const ytId = this.extractYoutubeId(url);
                    const iframe = document.getElementById('theater-iframe');
                    const fallback = document.getElementById('theater-restricted-fallback');
                    const fallbackBtn = document.getElementById('theater-fallback-link-btn');
                    const externalAnchor = document.getElementById('theater-external-anchor');
                    const doneBtn = document.getElementById('btn-theater-mark-done');

                    document.getElementById('theater-video-title').innerText = title;
                    externalAnchor.href = url;

                    if (ytId) {
                        fallback.classList.add('hidden');
                        iframe.classList.remove('hidden');
                        iframe.src = "https://www.youtube.com/embed/" + ytId + "?autoplay=1&rel=0";
                    } else {
                        iframe.classList.add('hidden');
                        fallback.classList.remove('hidden');
                        fallbackBtn.href = url;
                    }

                    const isDone = appState.completedLectures.includes(String(lectureId));
                    var self = this;
                    if (isDone) {
                        doneBtn.className = "bg-rose-950 hover:bg-rose-900 border border-rose-900 text-rose-300 text-[10px] font-bold px-4 py-2 rounded-xl transition-all";
                        doneBtn.innerHTML = "Undo Complete";
                        doneBtn.onclick = function() { self.toggleLectureCompletion(lectureId, false); };
                    } else {
                        doneBtn.className = "bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all";
                        doneBtn.innerHTML = "Complete Lesson";
                        doneBtn.onclick = function() { self.toggleLectureCompletion(lectureId, true); };
                    }

                    document.getElementById('video-theater-modal').classList.remove('hidden');
                },

                closeTheaterMode: function() {
                    document.getElementById('video-theater-modal').classList.add('hidden');
                    document.getElementById('theater-iframe').src = '';
                },

                toggleLectureCompletion: function(lectureId, status) {
                    if (status) {
                        if (!appState.completedLectures.includes(String(lectureId))) {
                            appState.completedLectures.push(String(lectureId));
                        }
                        this.showToast("पाठ्यक्रम की प्रोग्रेस सहेजी गई।", "success");
                    } else {
                        appState.completedLectures = appState.completedLectures.filter(function(id) { return String(id) !== String(lectureId); });
                        this.showToast("पाठ्यक्रम प्रोग्रेस रोलबैक की गई।", "info");
                    }

                    localStorage.setItem('ta_completed_indices', JSON.stringify(appState.completedLectures));
                    this.updateGlobalStatistics();
                    this.closeTheaterMode();
                    this.renderLectures(appState.activeLectures);
                },

                showToast: function(message, type) {
                    const container = document.getElementById('toast-overlay-container');
                    const toastId = Date.now();

                    const configurations = {
                        success: "bg-emerald-950 border-emerald-500 text-emerald-300",
                        danger: "bg-rose-950 border-rose-500 text-rose-300",
                        info: "bg-indigo-950 border-indigo-500 text-indigo-300"
                    }[type] || "bg-slate-900 border-slate-700 text-slate-300";

                    const html = [
                        '<div id="toast-' + toastId + '" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl border ' + configurations + ' shadow-2xl pointer-events-auto transition-all transform translate-y-3 opacity-0 max-w-sm">',
                        '    <i class="fa-solid fa-circle-info text-md shrink-0"></i>',
                        '    <span class="text-xs font-bold leading-normal">' + message + '</span>',
                        '</div>'
                    ].join('');

                    container.insertAdjacentHTML('beforeend', html);
                    const el = document.getElementById("toast-" + toastId);

                    setTimeout(function() {
                        el.classList.remove('translate-y-3', 'opacity-0');
                    }, 50);

                    setTimeout(function() {
                        el.classList.add('opacity-0', 'translate-y-3');
                        setTimeout(function() { el.remove(); }, 400);
                    }, 4000);
                }
            }
        };

        window.addEventListener('DOMContentLoaded', function() {
            TA.init();
        });
    </script>
</body>
</html>`;