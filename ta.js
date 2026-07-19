import htmlContent from './ta.html';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Serve Premium HTML Frontend on Root URL
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(htmlContent, { 
        headers: { "Content-Type": "text/html;charset=UTF-8" } 
      });
    }
    
    // 2. Handle CORS Preflight (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
      });
    }
    
    // 3. Secure Proxy / Masking API
    if (request.method === "POST" && url.pathname.startsWith("/api/")) {
      
      // Map frontend /api/... to backend domain
      const targetPath = url.pathname.replace("/api", "");
      const targetUrl = "https://backend.classwalla.com" + targetPath;
      
      const reqBody = await request.text();
      
      // Premium Spoofing Headers
      const headers = new Headers();
      headers.set("Content-Type", request.headers.get("Content-Type") || "application/x-www-form-urlencoded");
      headers.set("User-Agent", "okhttp/5.3.2");
      headers.set("Accept-Encoding", "gzip");
      headers.set("Connection", "Keep-Alive");
      
      try {
        const response = await fetch(targetUrl, { 
          method: "POST", 
          headers: headers, 
          body: reqBody 
        });
        
        const data = await response.text();
        
        return new Response(data, { 
          status: response.status,
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ 
          status: "error", 
          message: "Upstream API connection failed." 
        }), {
          status: 502,
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*" 
          }
        });
      }
    }
    
    // 4. Fallback 404
    return new Response("404 Not Found - Premium Platform by Naveen", { status: 404 });
  }
};
