// TEACHERS ACADEMY - Cloudflare Worker SPA
// By Naveen – Full HTML SPA + API proxy

const DEFAULT_TOKEN = "4fg1iZcgrW2X8QsF0DpX0ekBNZSNmugOWw9TJWVX5cTmYX4il3VIO%2B1lP6eCPAxoj93%2BhuIgNm03oQ1sCIkmv4zjcEdZwiTA5kpS8WG9VH9tQ6nsKQRDDjSzcQCQpASTHpGzOr%2F4vCIOahj4Z%2FMrQ2eud8PtLvIp1xit7EARO18%3D";

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // SPA HTML shell
  if (path === "/" || path === "/index.html") {
    return new Response(buildHTML(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // API proxy routes – mask backend.classwalla.com
  if (path.startsWith("/api/")) {
    return handleApiProxy(request, url);
  }

  // Fallback 404
  return new Response("Not Found", { status: 404 });
}

/**
 * Proxy all API calls to backend.classwalla.com
 * and inject default token into payload.
 */
async function handleApiProxy(request, url) {
  const endpoint = url.pathname.replace("/api/", "");
  const targetBase = "https://backend.classwalla.com/";

  // Map our internal paths to real endpoints
  let targetUrl = null;
  let method = "POST";
  let headers = {};
  let body = null;

  const search = url.searchParams;

  // Common headers
  const BASE_HEADERS = {
    "Accept-Encoding": "gzip",
    "User-Agent": "okhttp/5.3.2"
  };

  const LEGACY_HEADERS = {
    "Accept-Encoding": "gzip",
    "User-Agent": "okhttp/4.9.2"
  };

  // Router for API proxy
  if (endpoint === "coursecategory/v1/getCourseCategory") {
    targetUrl = targetBase + "coursecategory/v1/getCourseCategory";
    // multipart/form-data body with token
    const payload = {
      data: { companyId: 46 },
      token: DEFAULT_TOKEN
    };
    const boundary = "cfw-boundary-cat";
    const formBody =
      `--${boundary}\n` +
      `Content-Disposition: form-data; name="body"\n\n` +
      JSON.stringify(payload) +
      `\n--${boundary}--\n`;
    headers = {
      ...BASE_HEADERS,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    };
    body = formBody;
  } else if (endpoint === "coursecategory/v1/getLayoutV2") {
    targetUrl = targetBase + "coursecategory/v1/getLayoutV2";
    const categoryId = search.get("categoryId") || "";
    const payload = {
      data: {
        candidateId: "",
        categoryId: Number(categoryId),
        companyId: 46,
        limit: "100",
        offset: "0"
      },
      token: DEFAULT_TOKEN
    };
    const boundary = "cfw-boundary-layout";
    const formBody =
      `--${boundary}\n` +
      `Content-Disposition: form-data; name="body"\n\n` +
      JSON.stringify(payload) +
      `\n--${boundary}--\n`;
    headers = {
      ...BASE_HEADERS,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    };
    body = formBody;
  } else if (endpoint === "coursecategory/v1/getCoursesBySubCat") {
    targetUrl = targetBase + "coursecategory/v1/getCoursesBySubCat";
    const subcatId = search.get("subcatId") || "";
    const payload = {
      data: {
        limit: "100",
        offset: "0",
        searchString: "",
        subcatId: String(subcatId)
      },
      token: DEFAULT_TOKEN
    };
    const boundary = "cfw-boundary-subcat";
    const formBody =
      `--${boundary}\n` +
      `Content-Disposition: form-data; name="body"\n\n` +
      JSON.stringify(payload) +
      `\n--${boundary}--\n`;
    headers = {
      ...BASE_HEADERS,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    };
    body = formBody;
  } else if (endpoint === "course/course/getCourseCategories") {
    targetUrl = targetBase + "course/course/getCourseCategories";
    const courseId = search.get("courseId") || "";
    const payload = {
      data: { courseId: String(courseId) },
      token: DEFAULT_TOKEN
    };
    const form = new URLSearchParams();
    form.set("body", JSON.stringify(payload));
    headers = {
      ...LEGACY_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    body = form.toString();
  } else if (endpoint === "candidate/candidate/getCourseVideos") {
    targetUrl = targetBase + "candidate/candidate/getCourseVideos";
    const courseId = search.get("courseId") || "";
    const categoryId = search.get("categoryId") || "";
    const subCategoryId = search.get("subCategoryId") || "";
    const payload = {
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
    };
    const form = new URLSearchParams();
    form.set("body", JSON.stringify(payload));
    headers = {
      ...LEGACY_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded"
    };
    body = form.toString();
  } else {
    return new Response(
      JSON.stringify({ error: "Unknown endpoint" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" }
      }
    );
  }

  const resp = await fetch(targetUrl, {
    method,
    headers,
    body
  });

  const text = await resp.text();
  const contentType = resp.headers.get("Content-Type") || "application/json";

  return new Response(text, {
    status: resp.status,
    headers: { "Content-Type": contentType }
  });
}

/**
 * Build SPA HTML with embedded CSS and JS
 */
function buildHTML() {
  // HTML shell with embedded CSS & JS
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>TEACHERS ACADEMY - Learning Platform</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --accent: #10b981;
      --bg: #f3f4f6;
      --nav-bg: #ffffff;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --danger: #ef4444;
      --card-bg: #ffffff;
      --shadow: 0 10px 25px rgba(15, 23, 42, 0.1);
      --radius: 12px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      background: linear-gradient(90deg, #0f172a, #1e293b);
      color: #f9fafb;
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.5);
      background: #0f172a;
      flex-shrink: 0;
    }

    .brand-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title {
      font-weight: 700;
      letter-spacing: 0.08em;
      font-size: 0.95rem;
      text-transform: uppercase;
    }

    .brand-subtitle {
      font-size: 0.7rem;
      color: #9ca3af;
    }

    .brand-subtitle span {
      opacity: 0.9;
    }

    .nav-tabs {
      display: flex;
      gap: 8px;
      background: rgba(15, 23, 42, 0.8);
      padding: 4px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    .nav-tab {
      border: none;
      background: transparent;
      color: #e5e7eb;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .nav-tab span {
      font-weight: 500;
    }

    .nav-tab-active {
      background: #f9fafb;
      color: #111827;
    }

    .nav-tab-active span {
      color: var(--primary);
    }

    main {
      flex: 1;
      max-width: 1200px;
      margin: 18px auto;
      padding: 0 16px 36px;
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .sidebar {
      width: 260px;
      max-width: 100%;
      background: #0f172a;
      color: #e5e7eb;
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: var(--shadow);
      position: sticky;
      top: 72px;
      align-self: flex-start;
      display: none; /* make visible if you want left nav */
    }

    .sidebar-title {
      font-size: 0.9rem;
      margin-bottom: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #9ca3af;
    }

    .sidebar-section {
      margin-bottom: 18px;
    }

    .sidebar-section h4 {
      font-size: 0.8rem;
      margin: 0 0 6px;
      color: #cbd5f5;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .sidebar-section p {
      font-size: 0.8rem;
      margin: 0 0 4px;
      color: #9ca3af;
    }

    .content {
      flex: 1;
      min-width: 0;
    }

    .content-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .content-title {
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .content-title span {
      color: var(--primary);
    }

    .content-subtitle {
      font-size: 0.85rem;
      color: var(--muted);
    }

    .breadcrumb {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: var(--muted);
    }

    .breadcrumb span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .breadcrumb a {
      color: var(--primary);
      cursor: pointer;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .section-card {
      background: var(--card-bg);
      border-radius: var(--radius);
      padding: 16px 18px;
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
    }

    .section-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 180px;
    }

    .search-box input {
      width: 100%;
      padding: 8px 32px 8px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-size: 0.85rem;
      outline: none;
      background: #f9fafb;
    }

    .search-box span {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      color: var(--muted);
    }

    .btn {
      border-radius: 999px;
      border: none;
      padding: 7px 13px;
      font-size: 0.8rem;
      cursor: pointer;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s, color 0.15s, box-shadow 0.15s;
    }

    .btn-primary {
      background: var(--primary);
      color: #f9fafb;
      box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
    }

    .btn-primary:hover {
      background: var(--primary-dark);
    }

    .btn-outline {
      background: transparent;
      color: var(--primary);
      border: 1px solid var(--primary);
    }

    .btn-outline:hover {
      background: rgba(37, 99, 235, 0.08);
    }

    .btn-ghost {
      background: transparent;
      color: var(--muted);
      border: 1px dashed var(--border);
    }

    .btn-ghost:hover {
      background: #f3f4f6;
      color: var(--text);
    }

    .badge {
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 0.7rem;
      background: #e5f3ff;
      color: var(--primary);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .badge-secondary {
      background: #ecfdf5;
      color: var(--accent);
    }

    .badge-small {
      font-size: 0.65rem;
      padding: 2px 6px;
    }

    .list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .course-card {
      background: #f9fafb;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      min-height: 100px;
      transition: transform 0.15s, box-shadow 0.15s;
    }

    .course-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow);
    }

    .course-thumb {
      position: relative;
      width: 100%;
      padding-top: 56.25%;
      overflow: hidden;
      background: #111827;
    }

    .course-thumb img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .course-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.8);
      color: #e5e7eb;
      font-size: 0.7rem;
    }

    .course-body {
      padding: 10px 12px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .course-title {
      font-size: 0.95rem;
      font-weight: 600;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--muted);
    }

    .course-meta span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .course-price {
      font-weight: 600;
      color: var(--accent);
    }

    .course-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    .course-actions .btn {
      flex: 1;
      justify-content: center;
      min-width: 0;
    }

    .course-actions .btn-secondary {
      background: #e5e7eb;
      color: #111827;
    }

    .course-actions .btn-secondary:hover {
      background: #d1d5db;
    }

    .pill {
      background: #f3f4f6;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--muted);
    }

    .empty-state {
      text-align: center;
      padding: 24px 12px;
      color: var(--muted);
      font-size: 0.85rem;
    }

    .empty-state strong {
      color: var(--primary);
    }

    .video-list {
      margin-top: 10px;
      border-top: 1px solid var(--border);
      padding-top: 10px;
    }

    .chapter {
      border-radius: 10px;
      border: 1px solid var(--border);
      background: #f9fafb;
      margin-bottom: 8px;
      overflow: hidden;
    }

    .chapter-header {
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      background: linear-gradient(90deg, #eff6ff, #f1f5f9);
    }

    .chapter-header-title {
      font-size: 0.85rem;
      font-weight: 500;
      display: flex;
      flex-direction: column;
    }

    .chapter-header-title span:nth-child(2) {
      font-size: 0.75rem;
      color: var(--muted);
    }

    .chapter-header-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chapter-body {
      padding: 8px 10px 10px;
      display: none;
      background: #ffffff;
    }

    .chapter-open .chapter-body {
      display: block;
    }

    .chapter-open .chapter-header {
      border-bottom: 1px solid var(--border);
    }

    .video-row {
      display: flex;
      gap: 8px;
      border-radius: 8px;
      padding: 6px;
      margin-bottom: 6px;
      border: 1px dashed var(--border);
      background: #f9fafb;
    }

    .video-thumb {
      width: 96px;
      min-width: 96px;
      border-radius: 6px;
      overflow: hidden;
      background: #111827;
    }

    .video-thumb img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
    }

    .video-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .video-title {
      font-size: 0.85rem;
      font-weight: 500;
    }

    .video-meta {
      font-size: 0.75rem;
      color: var(--muted);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .video-actions {
      display: flex;
      gap: 6px;
      margin-top: 3px;
      flex-wrap: wrap;
    }

    .video-actions a {
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--primary);
      background: #f3f4f6;
    }

    .video-actions a:hover {
      background: #e5e7eb;
    }

    .pill-date {
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 0.7rem;
      background: #eff6ff;
      color: var(--primary);
    }

    .badge-pdf {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-video {
      background: #e0f2fe;
      color: #0369a1;
    }

    .badge-chapter {
      background: #e5e7eb;
      color: #111827;
    }

    .inline-icon {
      font-size: 0.8rem;
    }

    .status-bar {
      font-size: 0.75rem;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #4ade80;
    }

    .status-dot-busy {
      background: #f97316;
    }

    .status-dot-error {
      background: #f87171;
    }

    .toast {
      position: fixed;
      bottom: 18px;
      right: 18px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #111827;
      color: #f9fafb;
      font-size: 0.8rem;
      display: flex;
      gap: 8px;
      align-items: center;
      box-shadow: var(--shadow);
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
      transition: opacity 0.2s, transform 0.2s;
      z-index: 100;
    }

    .toast-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .toast span {
      font-weight: 500;
    }

    .toast button {
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.8rem;
    }

    .tab-sections {
      display: none;
    }

    .tab-sections-active {
      display: block;
    }

    .hidden {
      display: none !important;
    }

    .chip-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .chip {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      font-size: 0.7rem;
      color: var(--muted);
      cursor: pointer;
      background: #f9fafb;
    }

    .chip-active {
      background: var(--primary);
      color: #f9fafb;
      border-color: var(--primary);
    }

    .small {
      font-size: 0.75rem;
    }

    .muted {
      color: var(--muted);
    }

    .scroll-section {
      max-height: 520px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .scroll-section::-webkit-scrollbar {
      width: 6px;
    }

    .scroll-section::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 999px;
    }

    footer {
      padding: 10px 16px 20px;
      text-align: center;
      font-size: 0.75rem;
      color: var(--muted);
    }

    footer span {
      color: var(--primary);
      font-weight: 500;
    }

    @media (max-width: 900px) {
      main {
        flex-direction: column;
      }
      .sidebar {
        position: static;
      }
    }

    @media (max-width: 640px) {
      header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .nav-tabs {
        align-self: stretch;
        justify-content: space-between;
      }

      .content-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
      }

      .section-card {
        padding: 14px;
      }

      .course-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  </style>
</head>
<body>
  <div class="app-shell">
    <header>
      <div class="brand">
        <div class="brand-logo">
          <img src="https://play-lh.googleusercontent.com/x8XlorPIOcczsf2PNlrcW03SkziHQs-tqTMQegTMfWrthvLOmADAnbdxSKAJBaJN8CB8tuLQ80L1mmtb-YAHtNU" alt="TEACHERS ACADEMY Logo" />
        </div>
        <div class="brand-text">
          <div class="brand-title">TEACHERS ACADEMY</div>
          <div class="brand-subtitle"><span>by Naveen</span> • Premium Learning Platform</div>
        </div>
      </div>
      <nav class="nav-tabs" id="navTabs">
        <button class="nav-tab nav-tab-active" data-tab="allCourses">
          <span>All Courses</span> | Explore
        </button>
        <button class="nav-tab" data-tab="allBatches">
          <span>All Batches</span> | Layout
        </button>
        <button class="nav-tab" data-tab="myBatches">
          <span>My Batches</span> | Saved
        </button>
      </nav>
    </header>

    <main>
      <div class="content">
        <div class="content-header">
          <div>
            <div class="content-title" id="contentTitle">
              <span>All Courses</span> / Teachers Academy
            </div>
            <div class="content-subtitle" id="contentSubtitle">
              Choose a category, then select a course. Add to <strong>My Batches</strong> to keep it saved in this browser.
            </div>
          </div>
          <div class="breadcrumb" id="breadcrumb">
            <span><a data-bc-root="true">Home</a> ▸ <span id="breadcrumbTrail">All Courses</span></span>
          </div>
        </div>

        <!-- ALL COURSES TAB -->
        <section id="tabAllCourses" class="tab-sections tab-sections-active">
          <div class="section-card">
            <div class="section-toolbar">
              <div class="search-box">
                <input type="text" id="searchAllCourses" placeholder="Search courses by name..." />
                <span>⌕</span>
              </div>
              <div class="chip-group" id="allCoursesChipGroup">
                <!-- dynamic category chips -->
              </div>
            </div>
            <div class="scroll-section">
              <div id="allCoursesList" class="list-grid"></div>
              <div id="allCoursesEmpty" class="empty-state hidden">
                No courses found. Try another category or search term.
              </div>
            </div>
            <div class="status-bar" id="allCoursesStatus">
              <span class="status-dot"></span>
              <span id="allCoursesStatusText">Ready. Select a category to load courses.</span>
            </div>
          </div>
        </section>

        <!-- ALL BATCHES TAB -->
        <section id="tabAllBatches" class="tab-sections">
          <div class="section-card">
            <div class="section-toolbar">
              <div class="search-box">
                <input type="text" id="searchAllBatches" placeholder="Search batches by name..." />
                <span>⌕</span>
              </div>
              <button class="btn btn-outline" id="btnReloadBatches">
                ⟳ Refresh categories
              </button>
            </div>
            <div class="scroll-section">
              <div id="allBatchesCategoryList" class="list-grid"></div>
              <div id="allBatchesCourseList" class="list-grid" style="margin-top: 16px;"></div>
              <div id="allBatchesEmpty" class="empty-state hidden">
                Select a category to view batches/courses.
              </div>
            </div>
            <div class="status-bar" id="allBatchesStatus">
              <span class="status-dot"></span>
              <span id="allBatchesStatusText">Ready. Loading categories...</span>
            </div>
          </div>

          <div class="section-card" style="margin-top: 16px;">
            <div class="section-toolbar">
              <div>
                <strong>Batch Details</strong>
                <div class="small muted">Click a batch to view subjects, topics and videos.</div>
              </div>
              <span class="pill small">
                /bid/:courseId/subid/:catId/topic/:subId
              </span>
            </div>
            <div class="scroll-section">
              <div id="batchDetail" class="video-list"></div>
              <div id="batchDetailEmpty" class="empty-state">
                Select a batch from above to see topic-wise video listing.
              </div>
            </div>
          </div>
        </section>

        <!-- MY BATCHES TAB -->
        <section id="tabMyBatches" class="tab-sections">
          <div class="section-card">
            <div class="section-toolbar">
              <div>
                <strong>My Batches (This Browser)</strong>
                <div class="small muted">Saved in local browser storage. Use same browser to see again.</div>
              </div>
              <button class="btn btn-ghost" id="btnClearMyBatches">
                ✕ Clear all
              </button>
            </div>

            <div class="scroll-section">
              <div id="myBatchesList" class="list-grid"></div>
              <div id="myBatchesEmpty" class="empty-state">
                You have no saved batches. Go to <strong>All Courses</strong> or <strong>All Batches</strong> and click “Add to My Batches”.
              </div>
            </div>

            <div class="status-bar">
              <span class="status-dot"></span>
              <span>Local storage is used; no data leaves your browser.</span>
            </div>
          </div>

          <div class="section-card" style="margin-top: 16px;">
            <div class="section-toolbar">
              <div>
                <strong>Batch Content</strong>
                <div class="small muted">Click a saved batch to fetch latest subjects and videos.</div>
              </div>
            </div>
            <div class="scroll-section">
              <div id="myBatchDetail" class="video-list"></div>
              <div id="myBatchDetailEmpty" class="empty-state">
                Select a batch from your saved list for full details.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer>
      © <span>TEACHERS ACADEMY</span> — Powered by <span>Naveen</span>. All course data served through secure Worker API.
    </footer>

    <div class="toast" id="toast">
      <span id="toastMessage"></span>
      <button id="toastClose">Close</button>
    </div>
  </div>

  <script>
    // ==============================
    // Utility Functions
    // ==============================
    const apiBase = "/api";

    function showToast(message) {
      const toast = document.getElementById("toast");
      const text = document.getElementById("toastMessage");
      const closeBtn = document.getElementById("toastClose");

      text.textContent = message;
      toast.classList.add("toast-visible");

      let timer = setTimeout(() => {
        toast.classList.remove("toast-visible");
      }, 2500);

      closeBtn.onclick = () => {
        toast.classList.remove("toast-visible");
        clearTimeout(timer);
      };
    }

    function formatPrice(price) {
      if (!price && price !== 0) return "Free";
      const p = Number(price);
      if (isNaN(p)) return price;
      return "₹" + p.toLocaleString("en-IN");
    }

    function formatDate(dateStr) {
      if (!dateStr) return "";
      // python code: '%Y-%m-%d %H:%M:%S' -> 'DD-MM-YYYY'
      const parts = dateStr.split(" ");
      if (parts.length === 0) return dateStr;
      const d = parts[0].split("-");
      if (d.length !== 3) return dateStr;
      return d[2] + "-" + d[1] + "-" + d[0];
    }

    function parseJSONSafe(text) {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }

    function getYouTubeThumbnailFromUrl(url) {
      // Pattern: https://www.youtube.com/watch?v=VIDEO_ID
      // Thumbnails: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
      // Fallback to hqdefault if needed.
      try {
        const u = new URL(url);
        const vid = u.searchParams.get("v");
        if (!vid) return "";
        return "https://img.youtube.com/vi/" + vid + "/hqdefault.jpg";
      } catch (e) {
        return "";
      }
    }

    function setStatus(sectionId, status, type) {
      const container = document.getElementById(sectionId);
      if (!container) return;
      const dot = container.querySelector(".status-dot");
      const text = container.querySelector("span:nth-child(2)");
      if (!dot || !text) return;

      dot.classList.remove("status-dot-busy", "status-dot-error");
      if (type === "busy") dot.classList.add("status-dot-busy");
      else if (type === "error") dot.classList.add("status-dot-error");

      text.textContent = status;
    }

    function saveMyBatches(batches) {
      try {
        localStorage.setItem("teachersAcademyMyBatches", JSON.stringify(batches));
      } catch (e) {
        console.error("Unable to save in localStorage", e);
      }
    }

    function loadMyBatches() {
      try {
        const data = localStorage.getItem("teachersAcademyMyBatches");
        if (!data) return [];
        return JSON.parse(data);
      } catch {
        return [];
      }
    }

    function addToMyBatches(batch) {
      const current = loadMyBatches();
      const exists = current.find(b => b.courseId === batch.courseId);
      if (!exists) {
        current.push(batch);
        saveMyBatches(current);
        renderMyBatches();
        showToast("Batch added to My Batches");
      } else {
        showToast("Batch already saved");
      }
    }

    function clearMyBatches() {
      saveMyBatches([]);
      renderMyBatches();
      showToast("All saved batches cleared");
    }

    function setActiveTab(tabId) {
      const tabs = document.querySelectorAll(".nav-tab");
      const sections = document.querySelectorAll(".tab-sections");
      tabs.forEach(t => {
        if (t.dataset.tab === tabId) t.classList.add("nav-tab-active");
        else t.classList.remove("nav-tab-active");
      });
      sections.forEach(s => {
        if ((tabId === "allCourses" && s.id === "tabAllCourses") ||
            (tabId === "allBatches" && s.id === "tabAllBatches") ||
            (tabId === "myBatches" && s.id === "tabMyBatches")) {
          s.classList.add("tab-sections-active");
        } else {
          s.classList.remove("tab-sections-active");
        }
      });

      const title = document.getElementById("contentTitle");
      const subtitle = document.getElementById("contentSubtitle");
      const bcTrail = document.getElementById("breadcrumbTrail");
      if (tabId === "allCourses") {
        title.innerHTML = "<span>All Courses</span> / Teachers Academy";
        subtitle.textContent = "Choose category and course, then add to My Batches.";
        bcTrail.textContent = "All Courses";
      } else if (tabId === "allBatches") {
        title.innerHTML = "<span>All Batches</span> / Layout";
        subtitle.textContent = "Browse course categories, batches and topics with full video listing.";
        bcTrail.textContent = "All Batches";
      } else if (tabId === "myBatches") {
        title.innerHTML = "<span>My Batches</span> / Saved locally";
        subtitle.textContent = "Your saved batches. Click to load subjects and videos.";
        bcTrail.textContent = "My Batches";
      }
    }

    // ======================================
    // API Helpers – Worker proxy endpoints
    // ======================================
    async function apiGetCourseCategory() {
      const resp = await fetch(apiBase + "/coursecategory/v1/getCourseCategory", {
        method: "POST"
      });
      const text = await resp.text();
      const json = parseJSONSafe(text);
      if (!json || !json.data) throw new Error("Invalid getCourseCategory response");
      return json.data.courseCategory || [];
    }

    async function apiGetLayoutV2(categoryId) {
      const resp = await fetch(apiBase + "/coursecategory/v1/getLayoutV2?categoryId=" + encodeURIComponent(categoryId), {
        method: "POST"
      });
      const text = await resp.text();
      const json = parseJSONSafe(text);
      if (!json || !json.data) throw new Error("Invalid getLayoutV2 response");
      return json.data.layout || [];
    }

    async function apiGetCoursesBySubCat(subcatId) {
      const resp = await fetch(apiBase + "/coursecategory/v1/getCoursesBySubCat?subcatId=" + encodeURIComponent(subcatId), {
        method: "POST"
      });
      const text = await resp.text();
      const json = parseJSONSafe(text);
      if (!json || !json.data) throw new Error("Invalid getCoursesBySubCat response");
      let clists = [];
      if (json.data.candidateCourseList) clists = json.data.candidateCourseList;
      else if (json.data.layout && json.data.layout[0] && json.data.layout[0].content) {
        clists = json.data.layout[0].content;
      }
      return clists;
    }

    async function apiGetCourseCategories(courseId) {
      const resp = await fetch(
        apiBase + "/course/course/getCourseCategories?courseId=" + encodeURIComponent(courseId),
        { method: "POST" }
      );
      const text = await resp.text();
      const json = parseJSONSafe(text);
      if (!json || !json.data) throw new Error("Invalid getCourseCategories response");
      const categories = [];
      const list = json.data.categoryList || [];
      for (const c of list) {
        const categoryId = c.id;
        const categoryName = c.categoryName;
        const subList = c.subCategory || [];
        for (const s of subList) {
          categories.push({
            categoryId,
            categoryName,
            subCategoryId: s.subCategoryId,
            subCategoryName: s.subCategory
          });
        }
      }
      return categories;
    }

    async function apiGetCourseVideos(courseId, categoryId, subCategoryId) {
      const url = apiBase + "/candidate/candidate/getCourseVideos?courseId=" + encodeURIComponent(
        courseId
      ) + "&categoryId=" + encodeURIComponent(categoryId) + "&subCategoryId=" + encodeURIComponent(
        subCategoryId
      );
      const resp = await fetch(url, { method: "POST" });
      const text = await resp.text();
      const json = parseJSONSafe(text);
      if (!json || !json.data) throw new Error("Invalid getCourseVideos response");
      return json.data.courseVideo || [];
    }

    // ==============================
    // Render: My Batches
    // ==============================
    function renderMyBatches() {
      const listEl = document.getElementById("myBatchesList");
      const emptyEl = document.getElementById("myBatchesEmpty");
      listEl.innerHTML = "";
      const batches = loadMyBatches();
      if (!batches.length) {
        emptyEl.classList.remove("hidden");
        return;
      }
      emptyEl.classList.add("hidden");

      for (const batch of batches) {
        const card = document.createElement("div");
        card.className = "course-card";
        card.dataset.courseId = batch.courseId;

        const thumbUrl = batch.thumb || "";
        const thumbHtml = thumbUrl
          ? '<img src="' + thumbUrl + '" alt="thumbnail" />'
          : "";

        card.innerHTML = \`
          <div class="course-thumb">
            \${thumbHtml}
            <div class="course-tag">Saved Batch</div>
          </div>
          <div class="course-body">
            <div class="course-title">\${batch.courseName || "Course"}</div>
            <div class="course-meta">
              <span><span class="inline-icon">📂</span>\${batch.categoryName || "Batch"}</span>
              <span class="course-price">\${formatPrice(batch.price)}</span>
            </div>
            <div class="course-actions">
              <button class="btn btn-primary btn-open-batch">
                Open
              </button>
              <button class="btn btn-ghost btn-remove-batch">
                Remove
              </button>
            </div>
          </div>
        \`;

        card.querySelector(".btn-open-batch").addEventListener("click", () => {
          // Load full details for this saved batch
          loadBatchDetail(batch.courseId, batch.courseName, true);
        });

        card.querySelector(".btn-remove-batch").addEventListener("click", () => {
          const current = loadMyBatches().filter(b => b.courseId !== batch.courseId);
          saveMyBatches(current);
          renderMyBatches();
          showToast("Batch removed from My Batches");
        });

        listEl.appendChild(card);
      }
    }

    // ==============================
    // Render: All Courses tab
    // ==============================
    let allCoursesCategories = [];  // coursecategory list
    let allCoursesSelectedCategoryId = null;
    let allCoursesCourses = [];     // candidateCourseList for current subcat
    let allCoursesFilterTerm = "";

    async function initAllCourses() {
      try {
        setStatus("allCoursesStatus", "Loading categories...", "busy");
        allCoursesCategories = await apiGetCourseCategory();
        setStatus("allCoursesStatus", "Categories loaded. Select to view courses.", null);
        renderAllCoursesCategoryChips();
      } catch (e) {
        console.error(e);
        setStatus("allCoursesStatus", "Failed to load categories.", "error");
      }
    }

    function renderAllCoursesCategoryChips() {
      const container = document.getElementById("allCoursesChipGroup");
      container.innerHTML = "";
      if (!allCoursesCategories.length) {
        const span = document.createElement("span");
        span.className = "small muted";
        span.textContent = "No categories found.";
        container.appendChild(span);
        return;
      }
      allCoursesCategories.forEach((cc, idx) => {
        const chip = document.createElement("div");
        chip.className = "chip" + (idx === 0 ? " chip-active" : "");
        chip.textContent = cc.courseCategory || "Category " + (idx + 1);
        chip.dataset.categoryId = cc.categoryId;
        chip.addEventListener("click", () => {
          document.querySelectorAll("#allCoursesChipGroup .chip").forEach(c => c.classList.remove("chip-active"));
          chip.classList.add("chip-active");
          loadAllCoursesForCategory(cc.categoryId);
        });
        container.appendChild(chip);
      });
      // Auto load first category
      loadAllCoursesForCategory(allCoursesCategories[0].categoryId);
    }

    async function loadAllCoursesForCategory(categoryId) {
      allCoursesSelectedCategoryId = categoryId;
      allCoursesCourses = [];
      const listEl = document.getElementById("allCoursesList");
      const emptyEl = document.getElementById("allCoursesEmpty");
      listEl.innerHTML = "";
      emptyEl.classList.add("hidden");

      try {
        setStatus("allCoursesStatus", "Loading layout...", "busy");
        const layout = await apiGetLayoutV2(categoryId);
        if (!layout.length) {
          setStatus("allCoursesStatus", "No layout found for this category.", null);
          emptyEl.classList.remove("hidden");
          return;
        }
        // Use first layout row to get subcat id
        const subcategoryId = layout[0].id;
        setStatus("allCoursesStatus", "Loading courses...", "busy");
        const courses = await apiGetCoursesBySubCat(subcategoryId);
        allCoursesCourses = courses;
        setStatus("allCoursesStatus", "Courses loaded.", null);
        renderAllCoursesList();
      } catch (e) {
        console.error(e);
        emptyEl.classList.remove("hidden");
        setStatus("allCoursesStatus", "Failed to load courses.", "error");
      }
    }

    function renderAllCoursesList() {
      const listEl = document.getElementById("allCoursesList");
      const emptyEl = document.getElementById("allCoursesEmpty");
      listEl.innerHTML = "";
      let filtered = allCoursesCourses;

      if (allCoursesFilterTerm.trim()) {
        const term = allCoursesFilterTerm.trim().toLowerCase();
        filtered = filtered.filter(c => {
          const name = (c.courseName || "").toLowerCase();
          return name.includes(term);
        });
      }

      if (!filtered.length) {
        emptyEl.classList.remove("hidden");
        return;
      }
      emptyEl.classList.add("hidden");

      filtered.forEach(course => {
        const courseId = course.courseId;
        const courseName = course.courseName || "Course";
        const price = course.price;
        const thumb = course.cthumb || "";

        const card = document.createElement("div");
        card.className = "course-card";
        card.dataset.courseId = courseId;

        const thumbHtml = thumb
          ? '<img src="' + thumb + '" alt="course thumbnail" />'
          : "";

        card.innerHTML = \`
          <div class="course-thumb">
            \${thumbHtml}
            <div class="course-tag">Course</div>
          </div>
          <div class="course-body">
            <div class="course-title">\${courseName}</div>
            <div class="course-meta">
              <span><span class="inline-icon">📘</span>Course ID: \${courseId}</span>
              <span class="course-price">\${formatPrice(price)}</span>
            </div>
            <div class="course-actions">
              <button class="btn btn-primary btn-add-mybatch">
                + Add to My Batches
              </button>
              <button class="btn btn-secondary btn-open-layout">
                Open Batch Layout
              </button>
            </div>
          </div>
        \`;

        // Add to My Batches
        card.querySelector(".btn-add-mybatch").addEventListener("click", () => {
          addToMyBatches({
            courseId,
            courseName,
            price,
            thumb,
            categoryName: "Course"
          });
        });

        // Open Layout (subjects/topics)
        card.querySelector(".btn-open-layout").addEventListener("click", () => {
          setActiveTab("allBatches");
          loadBatchDetail(courseId, courseName, false);
        });

        listEl.appendChild(card);
      });
    }

    // ==============================
    // Render: All Batches tab
    // ==============================
    let allBatchesCategories = [];
    let allBatchesCourses = [];
    let allBatchesFilterTerm = "";

    async function initAllBatches() {
      try {
        setStatus("allBatchesStatus", "Loading categories...", "busy");
        allBatchesCategories = await apiGetCourseCategory();
        setStatus("allBatchesStatus", "Categories loaded. Click to view batches.", null);
        renderAllBatchesCategoryList();
      } catch (e) {
        console.error(e);
        setStatus("allBatchesStatus", "Failed to load categories.", "error");
      }
    }

    function renderAllBatchesCategoryList() {
      const listEl = document.getElementById("allBatchesCategoryList");
      listEl.innerHTML = "";
      if (!allBatchesCategories.length) {
        const empty = document.getElementById("allBatchesEmpty");
        empty.classList.remove("hidden");
        return;
      }

      allBatchesCategories.forEach(cc => {
        const card = document.createElement("div");
        card.className = "course-card";
        const name = cc.courseCategory || "Category";
        card.innerHTML = \`
          <div class="course-body">
            <div class="course-title">\${name}</div>
            <div class="course-meta">
              <span><span class="inline-icon">📂</span>ID: \${cc.categoryId}</span>
              <span class="badge badge-secondary">Category</span>
            </div>
            <div class="course-actions">
              <button class="btn btn-primary btn-open-category">
                Open Layout
              </button>
            </div>
          </div>
        \`;

        card.querySelector(".btn-open-category").addEventListener("click", () => {
          loadAllBatchesForCategory(cc.categoryId, name);
        });

        listEl.appendChild(card);
      });
    }

    async function loadAllBatchesForCategory(categoryId, categoryName) {
      const courseListEl = document.getElementById("allBatchesCourseList");
      const empty = document.getElementById("allBatchesEmpty");
      courseListEl.innerHTML = "";
      empty.classList.add("hidden");
      allBatchesCourses = [];

      try {
        setStatus("allBatchesStatus", "Loading layout...", "busy");
        const layout = await apiGetLayoutV2(categoryId);
        if (!layout.length) {
          setStatus("allBatchesStatus", "No layout for this category.", null);
          empty.classList.remove("hidden");
          return;
        }
        const subcategoryId = layout[0].id;
        const courses = await apiGetCoursesBySubCat(subcategoryId);
        allBatchesCourses = courses;
        setStatus("allBatchesStatus", "Batches loaded.", null);
        renderAllBatchesCourseList(categoryName);
      } catch (e) {
        console.error(e);
        setStatus("allBatchesStatus", "Failed to load batches.", "error");
      }
    }

    function renderAllBatchesCourseList(categoryName) {
      const listEl = document.getElementById("allBatchesCourseList");
      listEl.innerHTML = "";
      let filtered = allBatchesCourses;

      if (allBatchesFilterTerm.trim()) {
        const term = allBatchesFilterTerm.trim().toLowerCase();
        filtered = filtered.filter(c => {
          const name = (c.courseName || "").toLowerCase();
          return name.includes(term);
        });
      }

      if (!filtered.length) {
        const empty = document.getElementById("allBatchesEmpty");
        empty.classList.remove("hidden");
        return;
      }

      filtered.forEach(course => {
        const courseId = course.courseId;
        const courseName = course.courseName || "Course";
        const price = course.price;
        const thumb = course.cthumb || "";

        const card = document.createElement("div");
        card.className = "course-card";
        card.dataset.courseId = courseId;

        const thumbHtml = thumb
          ? '<img src="' + thumb + '" alt="course thumbnail" />'
          : "";

        card.innerHTML = \`
          <div class="course-thumb">
            \${thumbHtml}
            <div class="course-tag">\${categoryName}</div>
          </div>
          <div class="course-body">
            <div class="course-title">\${courseName}</div>
            <div class="course-meta">
              <span><span class="inline-icon">📚</span>Course ID: \${courseId}</span>
              <span class="course-price">\${formatPrice(price)}</span>
            </div>
            <div class="course-actions">
              <button class="btn btn-primary btn-open-batch-detail">
                Open Batch
              </button>
              <button class="btn btn-outline btn-add-mybatch">
                + Add to My Batches
              </button>
            </div>
          </div>
        \`;

        // Add to my batches
        card.querySelector(".btn-add-mybatch").addEventListener("click", () => {
          addToMyBatches({
            courseId,
            courseName,
            price,
            thumb,
            categoryName
          });
        });

        // Open batch detail
        card.querySelector(".btn-open-batch-detail").addEventListener("click", () => {
          loadBatchDetail(courseId, courseName, false);
        });

        listEl.appendChild(card);
      });
    }

    // ==============================
    // Batch Detail (subjects/topics/videos)
    // /bid/:courseId/subid/:subCategoryId/topic/:topicId
    // ==============================
    async function loadBatchDetail(courseId, courseName, fromMyBatch) {
      const detailEl = fromMyBatch
        ? document.getElementById("myBatchDetail")
        : document.getElementById("batchDetail");
      const emptyEl = fromMyBatch
        ? document.getElementById("myBatchDetailEmpty")
        : document.getElementById("batchDetailEmpty");

      detailEl.innerHTML = "";
      emptyEl.classList.add("hidden");

      const statusSectionId = fromMyBatch ? null : "allBatchesStatus";
      if (statusSectionId) setStatus(statusSectionId, "Loading batch structure...", "busy");

      try {
        const categories = await apiGetCourseCategories(courseId);
        if (!categories.length) {
          emptyEl.classList.remove("hidden");
          if (statusSectionId) setStatus(statusSectionId, "No categories found for this batch.", null);
          return;
        }

        const byCategory = {};
        for (const c of categories) {
          if (!byCategory[c.categoryId]) {
            byCategory[c.categoryId] = {
              categoryName: c.categoryName,
              sub: []
            };
          }
          byCategory[c.categoryId].sub.push(c);
        }

        for (const categoryId in byCategory) {
          const cat = byCategory[categoryId];
          const chapterDiv = document.createElement("div");
          chapterDiv.className = "chapter";

          const chapterId = categoryId;

          chapterDiv.innerHTML = \`
            <div class="chapter-header">
              <div class="chapter-header-title">
                <span>\${cat.categoryName}</span>
                <span>Subject / Chapter • \${cat.sub.length} topics</span>
              </div>
              <div class="chapter-header-meta">
                <span class="badge badge-chapter">ID: \${chapterId}</span>
                <span class="inline-icon">▼</span>
              </div>
            </div>
            <div class="chapter-body"></div>
          \`;

          const header = chapterDiv.querySelector(".chapter-header");
          const body = chapterDiv.querySelector(".chapter-body");

          header.addEventListener("click", () => {
            const isOpen = chapterDiv.classList.contains("chapter-open");
            if (isOpen) {
              chapterDiv.classList.remove("chapter-open");
            } else {
              chapterDiv.classList.add("chapter-open");
              if (!body.dataset.loaded) {
                body.dataset.loaded = "1";
                loadChapterVideos(courseId, chapterId, cat.sub, body, courseName, fromMyBatch);
              }
            }
          });

          detailEl.appendChild(chapterDiv);
        }

        if (statusSectionId) setStatus(statusSectionId, "Batch structure loaded. Click a chapter to reveal videos.", null);
        const title = document.getElementById("contentTitle");
        if (fromMyBatch) {
          title.innerHTML = "<span>My Batches</span> / " + courseName;
        } else {
          title.innerHTML = "<span>All Batches</span> / " + courseName;
        }
      } catch (e) {
        console.error(e);
        emptyEl.classList.remove("hidden");
        if (statusSectionId) setStatus(statusSectionId, "Failed to load batch details.", "error");
      }
    }

    async function loadChapterVideos(courseId, categoryId, subList, container, courseName, fromMyBatch) {
      container.innerHTML = "";
      for (const s of subList) {
        const subId = s.subCategoryId;
        const subName = s.subCategoryName;

        const topicDiv = document.createElement("div");
        topicDiv.className = "chapter";
        const topicId = subId;

        topicDiv.innerHTML = \`
          <div class="chapter-header">
            <div class="chapter-header-title">
              <span>\${subName}</span>
              <span>Topic ID: \${topicId}</span>
            </div>
            <div class="chapter-header-meta">
              <span class="badge badge-secondary">Topic</span>
              <span class="inline-icon">▼</span>
            </div>
          </div>
          <div class="chapter-body"></div>
        \`;

        const header = topicDiv.querySelector(".chapter-header");
        const body = topicDiv.querySelector(".chapter-body");

        header.addEventListener("click", async () => {
          const isOpen = topicDiv.classList.contains("chapter-open");
          if (isOpen) {
            topicDiv.classList.remove("chapter-open");
            return;
          }
          topicDiv.classList.add("chapter-open");
          if (body.dataset.loaded) return;
          body.dataset.loaded = "1";

          const urlPath = "/bid/" + courseId + "/subid/" + subId + "/topic/" + topicId;
          const bcTrail = document.getElementById("breadcrumbTrail");
          if (bcTrail) bcTrail.textContent = urlPath;

          try {
            const videos = await apiGetCourseVideos(courseId, categoryId, subId);
            if (!videos.length) {
              body.innerHTML = '<div class="empty-state small">No videos/PDFs found for this topic.</div>';
              return;
            }

            videos.slice().reverse().forEach(cv => {
              const title = cv.title || "No Title";
              const vlink = cv.url || cv.Url || "";
              const plink = cv.pdfUrl || "";
              const dateFormatted = formatDate(cv.eventDateTime || "");

              const row = document.createElement("div");
              row.className = "video-row";

              const thumbUrl = vlink ? getYouTubeThumbnailFromUrl(vlink) : "";

              const thumbHtml = thumbUrl
                ? '<img src="' + thumbUrl + '" alt="video thumb" />'
                : "";

              row.innerHTML = \`
                <div class="video-thumb">\text{thumbHtml}</div>
                <div class="video-body">
                  <div class="video-title">\${title}</div>
                  <div class="video-meta">
                    <span class="pill-date">\${dateFormatted || "No date"}</span>
                    \text{vlink ? '<span class="badge badge-video">Video</span>' : ""}
                    \text{plink ? '<span class="badge badge-pdf">Board PDF</span>' : ""}
                  </div>
                  <div class="video-actions">
                    \text{vlink ? '<a href="' + vlink + '" target="_blank">Open Video</a>' : ""}
                    \text{plink ? '<a href="' + plink + '" target="_blank">Open PDF</a>' : ""}
                  </div>
                </div>
              \`;

              container.appendChild(row);
            });
          } catch (e) {
            console.error(e);
            body.innerHTML = '<div class="empty-state small">Failed to load videos.</div>';
          }
        });

        container.appendChild(topicDiv);
      }
    }

    // ==============================
    // Event Listeners & Init
    // ==============================
    document.addEventListener("DOMContentLoaded", () => {
      const navTabs = document.getElementById("navTabs");
      navTabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".nav-tab");
        if (!btn) return;
        const tab = btn.dataset.tab;
        setActiveTab(tab);
        if (tab === "allCourses") {
          initAllCourses();
        } else if (tab === "allBatches") {
          initAllBatches();
        } else if (tab === "myBatches") {
          renderMyBatches();
        }
      });

      const searchAllCourses = document.getElementById("searchAllCourses");
      searchAllCourses.addEventListener("input", () => {
        allCoursesFilterTerm = searchAllCourses.value;
        renderAllCoursesList();
      });

      const searchAllBatches = document.getElementById("searchAllBatches");
      searchAllBatches.addEventListener("input", () => {
        allBatchesFilterTerm = searchAllBatches.value;
        renderAllBatchesCourseList("Category");
      });

      const btnReloadBatches = document.getElementById("btnReloadBatches");
      btnReloadBatches.addEventListener("click", () => {
        initAllBatches();
      });

      const btnClear = document.getElementById("btnClearMyBatches");
      btnClear.addEventListener("click", () => {
        clearMyBatches();
      });

      const bcRoot = document.querySelector('[data-bc-root="true"]');
      bcRoot.addEventListener("click", () => {
        setActiveTab("allCourses");
      });

      // Initial load
      initAllCourses();
    });
  </script>
</body>
</html>
`;
}