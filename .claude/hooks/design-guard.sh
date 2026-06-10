#!/usr/bin/env bash
input="$(cat)"
python3 - "$input" <<'PY'
import json, sys, re
d = json.loads(sys.argv[1])
ti = d.get("tool_input", {})
path = ti.get("file_path", "")
content = ti.get("content") or ti.get("new_string") or ""
# Guard only UI source; tokens/config are allowed to hold raw values.
if not re.search(r"/src/.*\.(tsx?|css)$", path): sys.exit(0)
if re.search(r"(tokens\.ts|tailwind\.config)", path): sys.exit(0)
v = []
if re.search(r"#[0-9a-fA-F]{3,8}\b", content): v.append("raw hex colour — use a CSS token")
if "!important" in content: v.append("!important is banned")
if re.search(r"\b(w|h|p|m|gap|text|top|left|right|bottom)-\[", content): v.append("arbitrary Tailwind value — use the scale")
if re.search(r"[\U0001F000-\U0001FAFF☀-➿]", content): v.append("emoji in UI source")
if v:
    sys.stderr.write("Design-guard blocked (docs/design-system.md §6):\n - " + "\n - ".join(v) + "\n")
    sys.exit(2)
PY
