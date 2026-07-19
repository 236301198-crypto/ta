// html file ko as a string load karne ke liye (wrangler.toml isko handle karega)
import htmlContent from './ta.html';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // 1. Agar root ("/") URL hit ho, toh frontend (ta.html) serve karo
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(htmlContent, { 
        headers: { "Content-Type": "text/html;charset=UTF-8" } 
      });
    }
    
    // 2. Agar API request aaye ("/api/...") toh Classwalla ke backend par forward (Proxy) karo
    if (request.method === "POST" && url.pathname.startsWith("/api/")) {
      
      // "/api" hata kar asli backend domain laga do
      const targetUrl = "https://backend.classwalla.com" + url.pathname.replace("/api", "");
      
      // Request body extract karo
      const reqBody = await request.text();
      
      // Original script/app wale headers banayein taaki API block na kare
      const headers = new Headers();
      headers.set("Content-Type", request.headers.get("Content-Type") || "application/x-www-form-urlencoded");
      headers.set("User-Agent", "okhttp/5.3.2");
      headers.set("Accept-Encoding", "gzip");
      
      try {
        // Backend se data fetch karo
        const response = await fetch(targetUrl, { 
          method: "POST", 
          headers: headers, 
          body: reqBody 
        });
        
        const data = await response.text();
        
        // Browser ko response bhejo, Access-Control allow karke
        return new Response(data, { 
          headers: { 
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*" 
          }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch from backend API." }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }
    
    // Agar koi aisi route hit ho jo humne define nahi ki
    return new Response("404 Not Found - Premium Platform by Naveen", { status: 404 });
  }
};
