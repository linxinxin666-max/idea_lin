import asyncio
import json
import re
import sys
from urllib.parse import urljoin


async def click_category(page, text: str) -> None:
    locator = page.get_by_text(text, exact=True)
    try:
        await locator.first.click(timeout=3000)
        return
    except Exception:
        pass
    await page.evaluate(
        """(t) => {
  const norm = s => (s || '').replace(/\\s+/g,' ').trim();
  const els = Array.from(document.querySelectorAll('a,button,div,span')).filter(el => norm(el.textContent) === t);
  const el = els[0];
  if (el) el.scrollIntoView({ block: 'center' });
}""",
        text,
    )
    await page.wait_for_timeout(300)
    await locator.first.click(timeout=5000, force=True)


async def extract_list_links(page, limit: int) -> list:
    items = await page.evaluate(
        """(limit) => {
  const norm = s => (s || '').replace(/\\s+/g,' ').trim();
  const isDoc = href => /\\/rule\\/(detail|detailhistory)\\//.test(href || '');
  const anchors = Array.from(document.querySelectorAll('a[href]'))
    .map(a => ({ text: norm(a.textContent), href: a.getAttribute('href') || '' }))
    .filter(x => x.text && x.href && isDoc(x.href));

  const inMain = anchors.filter(x => !/^(规则中心|课程中心|知识百科|案例专区|首页)$/.test(x.text));

  const dateRe = /(20\\d{2}-\\d{2}-\\d{2})$/;
  const cleaned = inMain.map(x => {
    const m = x.text.match(dateRe);
    const date = m ? m[1] : '';
    const title = date ? x.text.replace(dateRe, '').trim() : x.text;
    return { title, date, href: x.href, raw: x.text };
  });

  const uniq = [];
  const seen = new Set();
  for (const it of cleaned) {
    const k = it.href;
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniq.push(it);
    if (uniq.length >= limit) break;
  }
  return uniq;
}""",
        limit,
    )
    return items


def normalize_url(href: str) -> str:
    if href.startswith("http://") or href.startswith("https://"):
        return href
    if href.startswith("#/"):
        return urljoin("https://lifexue.com", href[1:])
    return urljoin("https://lifexue.com", href)


async def main() -> int:
    if len(sys.argv) < 2:
        print(
            "Usage: python3 tools/lifexue_playwright_extract_category.py <rule_url> [category_text] [limit]",
            file=sys.stderr,
        )
        return 2

    url = sys.argv[1]
    category = sys.argv[2] if len(sys.argv) >= 3 else "商家管理"
    limit = int(sys.argv[3]) if len(sys.argv) >= 4 else 20

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
        await page.wait_for_timeout(800)
        await page.wait_for_selector("text=规则中心")

        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(800)
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(400)

        await click_category(page, category)
        await page.wait_for_timeout(1000)

        items = await extract_list_links(page, limit)
        for it in items:
            it["url"] = normalize_url(it["href"])

        print(json.dumps({"url": url, "category": category, "items": items}, ensure_ascii=False, indent=2))
        await browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

