import asyncio
import json
import re
import sys


async def extract(page) -> dict:
    await page.wait_for_timeout(1200)
    await page.wait_for_selector("body")

    data = await page.evaluate(
        """() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const body = document.body;
  const title = document.title || '';

  const text = norm(body ? body.innerText : '');
  const imgs = Array.from(document.querySelectorAll('img'))
    .map(img => img.getAttribute('src') || '')
    .filter(Boolean);

  const anchors = Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.getAttribute('href') || '')
    .filter(Boolean);

  return { title, text, imgs, anchors };
}"""
    )

    return data


def summarize_payload(payload: dict) -> dict:
    text = payload.get("text") or ""
    text = re.sub(r"\n{3,}", "\n\n", text)
    title = payload.get("title") or ""
    imgs = payload.get("imgs") or []
    anchors = payload.get("anchors") or []

    def uniq(xs):
        seen = set()
        out = []
        for x in xs:
            if not x or x in seen:
                continue
            seen.add(x)
            out.append(x)
        return out

    return {
        "title": title,
        "text_len": len(text),
        "text_head": text[:1200],
        "imgs": uniq(imgs)[:60],
        "anchors": uniq(anchors)[:60],
    }


async def best_frame_payload(page) -> dict:
    best = {"title": page.url, "text": "", "imgs": [], "anchors": []}
    frames = page.frames
    for f in frames:
        try:
            for _ in range(4):
                await f.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await page.wait_for_timeout(700)
            payload = await f.evaluate(
                """() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const text = norm(document.body ? document.body.innerText : '');
  const imgs = Array.from(document.querySelectorAll('img')).map(i => i.getAttribute('src') || '').filter(Boolean);
  const anchors = Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href') || '').filter(Boolean);
  return { title: document.title || '', text, imgs, anchors };
}"""
            )
            if isinstance(payload, dict) and len(payload.get("text") or "") > len(best.get("text") or ""):
                best = payload
        except Exception:
            continue
    return best


async def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python3 tools/lark_wiki_extract.py <url>", file=sys.stderr)
        return 2

    url = sys.argv[1]
    try:
        from playwright.async_api import async_playwright  # type: ignore
    except Exception as e:
        print("Playwright not available:", e, file=sys.stderr)
        return 2

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto(url, wait_until="networkidle")
        payload = await extract(page)
        frame_payload = await best_frame_payload(page)
        if len(frame_payload.get("text") or "") > len(payload.get("text") or ""):
            payload = frame_payload
        summary = summarize_payload(payload)

        print(json.dumps(summary, ensure_ascii=False, indent=2))
        await browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
