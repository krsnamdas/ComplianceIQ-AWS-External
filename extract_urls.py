import re, os, subprocess

url_pattern = re.compile(r"https?://[^\s'\"`<>]+", re.IGNORECASE)
found_urls = {}

for root, dirs, files in os.walk("."):
    if any(ignore in root for ignore in ["node_modules", ".git", "dist", ".cache"]):
        continue
    for file in files:
        if file.endswith((".ts", ".tsx", ".js", ".json", ".html")):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                    matches = url_pattern.findall(content)
                    for m in matches:
                        m = m.rstrip(").,;:\"'")
                        if not any(skip in m for skip in ["localhost", "schema.org", "w3.org", "xmlns", "tailwindcss", "vitejs", "reactjs", "github.com", "microsoft.com", "example.com"]):
                            found_urls.setdefault(m, []).append(filepath)
            except Exception as e:
                pass

print(f"Total unique regulatory/authority URLs found: {len(found_urls)}")
with open("/tmp/extracted_urls.txt", "w") as out:
    for u in sorted(found_urls.keys()):
        files_str = ", ".join(sorted(set(found_urls[u])))
        out.write(f"{u} | {files_str}\n")
        print(f"{u} -> {files_str}")
