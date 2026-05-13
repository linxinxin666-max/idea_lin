import asyncio
import re
import sys
from urllib.parse import urljoin


RULE_URL = "https://lifexue.com/rule?enter_method=tab&selected=93484032002"


async def extract_section_links(page):
    await page.goto(RULE_URL, wait_until="networkidle")
    await page.wait_for_timeout(1500)
    await page.wait_for_selector("text=新规公示")
    await page.wait_for_selector("text=治理公告")
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(800)
    await page.evaluate("window.scrollTo(0, 0)")
    await page.wait_for_timeout(400)

    items = await page.evaluate(
        """() => {
  const normText = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const uniqBy = (arr, keyFn) => {
    const seen = new Set();
    const out = [];
    for (const it of arr) {
      const k = keyFn(it);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(it);
    }
    return out;
  };
  const isDocHref = (href) => /(\\/|#\\/)rule\\/(detail|detailhistory)\\/(\\d+)/.test(href || '');
  const containsExactText = (root, title) => {
    const els = root.querySelectorAll ? Array.from(root.querySelectorAll('*')) : [];
    for (const el of els) {
      if (!el || el.childElementCount !== 0) continue;
      if (normText(el.textContent) === title) return true;
    }
    return false;
  };

  const pickContainer = (title, excludeTitles) => {
    const exact = Array.from(document.querySelectorAll('body *'))
      .filter(el => el && el.childElementCount === 0 && normText(el.textContent) === title);

    const titleEl =
      exact[0] ||
      Array.from(document.querySelectorAll('body *'))
        .filter(el => {
          const t = normText(el.textContent);
          return t.includes(title) && t.length <= title.length + 6;
        })
        .sort((a, b) => normText(a.textContent).length - normText(b.textContent).length)[0];

    if (!titleEl) return null;

    let best = null;
    let cur = titleEl;
    for (let i = 0; i < 10 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;

      const anchors = Array.from(cur.querySelectorAll('a[href]'))
        .map(a => ({ title: normText(a.textContent), href: a.getAttribute('href') || '' }))
        .filter(x => x.title && x.href && !/^(更多|查看更多|查看全部)$/.test(x.title));

      const docAnchors = anchors.filter(x => isDocHref(x.href));
      const excludeHit = (excludeTitles || []).some(t => containsExactText(cur, t));
      const score = docAnchors.length * 10 + anchors.length - (excludeHit ? 1000 : 0);
      if (score > 0 && (!best || score > best.score)) best = { el: cur, score };
    }

    return (best && best.el) || titleEl.closest('section,article,div') || titleEl.parentElement;
  };

  const pick = (title) => {
    const exclude = title === '新规公示' ? ['治理公告'] : ['新规公示'];
    const container = pickContainer(title, exclude);
    if (!container) return [];
    const anchors = Array.from(container.querySelectorAll('a[href]'))
      .map(a => ({ title: normText(a.textContent), href: a.getAttribute('href') || '' }))
      .filter(x => x.title && x.href && !/^(更多|查看更多|查看全部)$/.test(x.title));

    const doc = anchors.filter(x => isDocHref(x.href));
    const picked = doc.length ? doc : anchors;
    return uniqBy(picked, x => x.href);
  };
  return {
    new_rules: pick('新规公示'),
    governance: pick('治理公告')
  };
}"""
    )
    if not items.get("new_rules") and not items.get("governance"):
        items["__diag__"] = await page.evaluate(
            """() => {
  const normText = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  const anchors = Array.from(document.querySelectorAll('a[href]'))
    .map(a => ({ title: normText(a.textContent), href: a.getAttribute('href') || '' }))
    .filter(x => x.title || x.href);

  const onclicks = Array.from(document.querySelectorAll('[onclick]'))
    .slice(0, 30)
    .map(el => ({ tag: el.tagName, text: normText(el.textContent), onclick: el.getAttribute('onclick') || '' }));

  const hasText = (t) => Array.from(document.querySelectorAll('body *'))
    .filter(el => el && (el.textContent || '').includes(t))
    .slice(0, 10)
    .map(el => ({ tag: el.tagName, text: normText(el.textContent).slice(0, 80) }));

  return {
    url: location.href,
    title: document.title,
    bodyTextHead: normText(document.body ? document.body.innerText : '').slice(0, 500),
    anchorCount: anchors.length,
    anchorsSample: anchors.slice(0, 30),
    anchorsRuleLike: anchors.filter(x => /rule\\//.test(x.href)).slice(0, 30),
    onclickSample: onclicks,
    textNodesNewRules: hasText('新规公示'),
    textNodesGovernance: hasText('治理公告')
  };
}"""
        )

    def normalize(href: str) -> str:
        if href.startswith("http://") or href.startswith("https://"):
            return href
        if href.startswith("#/"):
            return urljoin("https://lifexue.com", href[1:])
        return urljoin("https://lifexue.com", href)

    for k in ["new_rules", "governance"]:
        items[k] = [{**it, "url": normalize(it["href"])} for it in items.get(k, [])]
    return items


async def extract_doc_text(page, url: str) -> str:
    await page.goto(url, wait_until="networkidle")
    await page.wait_for_timeout(1200)
    await page.wait_for_selector("body")

    text = await page.evaluate(
        """() => {
  const main = document.querySelector('main') || document.body;
  return (main.innerText || '').trim();
}"""
    )
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


async def main() -> int:
    try:
        from playwright.async_api import async_playwright  # type: ignore
    except Exception as e:
        print("Playwright not available:", e, file=sys.stderr)
        return 2

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        links = await extract_section_links(page)
        print("NEW_RULES", len(links["new_rules"]))
        for it in links["new_rules"][:10]:
            print(it["title"], it["url"])
        print("GOVERNANCE", len(links["governance"]))
        for it in links["governance"][:10]:
            print(it["title"], it["url"])
        if not links["new_rules"] and not links["governance"] and links.get("__diag__"):
            print("DIAG", links["__diag__"])

        await browser.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
