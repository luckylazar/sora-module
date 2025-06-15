module.exports = {
  name: "9AnimeTV",
  version: "1.0.0",
  description: "Scrape search, metadata, episodes, and streams from 9animetv.to",
  domains: ["9animetv.to"],
  run: async function (query, type) {
    const base = "https://9animetv.to";

    const fetchText = async (url, opts={}) => {
      const r = await fetch(url, opts);
      return await r.text();
    }

    if (type === "search") {
      const html = await fetchText(`${base}/search?keyword=${encodeURIComponent(query)}`);
      const doc = new DOMParser().parseFromString(html, "text/html");
      return Array.from(doc.querySelectorAll(".content .item")).map(el => ({
        id: el.querySelector("a").href.replace(base + "/watch/", ""),
        name: el.querySelector(".name").textContent.trim(),
        url: el.querySelector("a").href,
        poster: el.querySelector("img").src,
      }));
    }

    if (type === "details") {
      const html = await fetchText(base + query);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const episodes = Array.from(doc.querySelectorAll(".episodes-list li a")).map(el => ({
        id: el.href,
        name: el.textContent.trim(),
        url: el.href
      }));
      return { episodes };
    }

    if (type === "stream") {
      const html = await fetchText(query);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const playerScript = Array.from(doc.querySelectorAll("script"))
        .find(s => s.textContent.includes("sources"));
      const srcMatch = playerScript.textContent.match(/sources:\s*(\[[^\]]+\])/);
      if (srcMatch) {
        const sources = JSON.parse(srcMatch[1]);
        return sources.map(s => ({
          url: s.file,
          quality: s.label || "",
          isM3U8: s.file.endsWith(".m3u8")
        }));
      }
      return [];
    }
  }
};
