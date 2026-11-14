"""AuraMed Offline-Resilient OpenAPI / Swagger UI Documentation Helper.

Provides 100% offline Swagger UI rendering using local bundled static assets
(eliminating CDN blocking issues such as cdn.jsdelivr.net blocks in Egypt and restrictive ISPs).
"""

from fastapi.responses import HTMLResponse


def get_offline_swagger_html(
    openapi_url: str,
    title: str = "AuraMed API Documentation",
    service_name: str = "Client Gateway",
    current_port: int = 8000
) -> HTMLResponse:
    """Generate self-contained, offline-resilient Swagger UI HTML."""
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Swagger UI</title>
  <link rel="stylesheet" type="text/css" href="/static/swagger/swagger-ui.css" />
  <link rel="icon" type="image/png" href="/static/swagger/favicon.png" />
  <style>
    html {{ box-sizing: border-box; overflow-y: scroll; }}
    *, *:before, *:after {{ box-sizing: inherit; }}
    body {{ margin: 0; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }}
    
    .nav-bar {{
      background: #111827;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }}
    .brand {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .brand-icon {{
      background: #2563eb;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
    }}
    .brand-title {{
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }}
    .badge {{
      background: rgba(37, 99, 235, 0.2);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.4);
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
    }}
    .links {{
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .links a {{
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: color 0.2s;
    }}
    .links a:hover {{
      color: #38bdf8;
    }}
    .btn-chat {{
      background: #2563eb;
      color: white !important;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600 !important;
      transition: background 0.2s;
    }}
    .btn-chat:hover {{
      background: #1d4ed8 !important;
    }}
    
    /* Make Swagger UI match high readability */
    #swagger-ui {{
      background: #ffffff;
      border-radius: 8px;
      margin: 16px auto;
      max-width: 1400px;
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }}
  </style>
</head>
<body>
  <header class="nav-bar">
    <div class="brand">
      <div class="brand-icon">⚕</div>
      <div>
        <span class="brand-title">AuraMed NASA Space Apps 2026</span>
        <span class="badge">{service_name} : Port {current_port}</span>
      </div>
    </div>
    <nav class="links">
      <a href="/chat" class="btn-chat">💬 Interactive Chat Copilot</a>
      <a href="http://127.0.0.1:8000/docs" {'style="color:#38bdf8;font-weight:700;"' if current_port == 8000 else ''}>Gateway (8000)</a>
      <a href="http://127.0.0.1:8001/docs" {'style="color:#38bdf8;font-weight:700;"' if current_port == 8001 else ''}>ML Service (8001)</a>
      <a href="http://127.0.0.1:8002/docs" {'style="color:#38bdf8;font-weight:700;"' if current_port == 8002 else ''}>RAG Service (8002)</a>
    </nav>
  </header>

  <div id="swagger-ui"></div>

  <script src="/static/swagger/swagger-ui-bundle.js"></script>
  <script src="/static/swagger/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {{
      const presets = [SwaggerUIBundle.presets.apis];
      if (typeof SwaggerUIStandalonePreset !== "undefined") {{
        presets.push(SwaggerUIStandalonePreset);
      }} else if (SwaggerUIBundle && SwaggerUIBundle.SwaggerUIStandalonePreset) {{
        presets.push(SwaggerUIBundle.SwaggerUIStandalonePreset);
      }}
      
      const ui = SwaggerUIBundle({{
        url: "{openapi_url}",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: presets,
        layout: "BaseLayout",
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1
      }});
      window.ui = ui;
    }};
  </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
