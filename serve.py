#!/usr/bin/env python3
"""HTTP server with COOP/COEP headers for WebAssembly threading support."""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class COOPHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

if __name__ == "__main__":
    os.chdir("dist")
    server = HTTPServer(("localhost", 8000), COOPHandler)
    print("Serving dist/ on http://localhost:8000 (with COOP/COEP headers)")
    server.serve_forever()
