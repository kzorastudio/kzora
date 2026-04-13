"""Upsert static_pages content from scripts/pages/*.json into Supabase via PostgREST."""
import json
import os
import urllib.request
from datetime import datetime, timezone

SUPA_URL = "https://nchzkmhpxprhbcylisfm.supabase.co"
SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jaHprbWhweHByaGJjeWxpc2ZtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk5MzQxMCwiZXhwIjoyMDkxNTY5NDEwfQ.AMsldHEBjQ1Bh5EQ14FWHmIlTRmXbwqcW9m6KdcE-5g"

PAGES_DIR = os.path.join(os.path.dirname(__file__), "pages")

now = datetime.now(timezone.utc).isoformat()

for fname in sorted(os.listdir(PAGES_DIR)):
    if not fname.endswith(".json"):
        continue
    slug = fname[:-5]
    with open(os.path.join(PAGES_DIR, fname), "r", encoding="utf-8") as f:
        data = json.load(f)
    payload = {
        "slug": slug,
        "title": data["title"],
        "content": data["content"],
        "meta": data.get("meta"),
        "updated_at": now,
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPA_URL}/rest/v1/static_pages?on_conflict=slug",
        data=body,
        method="POST",
        headers={
            "apikey": SRK,
            "Authorization": f"Bearer {SRK}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = resp.read().decode("utf-8")
            print(f"[OK] {slug}: {resp.status}")
    except urllib.error.HTTPError as e:
        print(f"[ERR] {slug}: {e.code} {e.read().decode('utf-8')}")
