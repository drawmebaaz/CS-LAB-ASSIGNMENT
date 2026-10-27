from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler, HTTPServer
from html import escape

PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Search App</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 650px;
            margin: 80px auto;
            padding: 20px;
        }

        input {
            width: 70%;
            padding: 12px;
        }

        button {
            padding: 12px 20px;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Search App</h1>
    <p>Enter a search term below.</p>

    <form action="/search" method="GET">
        <input type="text" name="q" placeholder="Search..." required>
        <button type="submit">Search</button>
    </form>
        <p>You searched for: SEARCH_RESULT</p>
</body>
</html>
"""


class SearchHandler(BaseHTTPRequestHandler):
        def do_GET(self):
            # Read the search term from the URL.
            url = urlparse(self.path)
            query = parse_qs(url.query).get("q", [""])[0]

            page = PAGE.replace("SEARCH_RESULT", escape(query))
            content = page.encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)


server = HTTPServer(("127.0.0.1", 8000), SearchHandler)
print("Open http://127.0.0.1:8000")
server.serve_forever()