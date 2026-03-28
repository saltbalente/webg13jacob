#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const defaultConfig = {
  siteUrl: process.env.SITE_URL || "https://consultadebrujeria.services",
  skipDirs: [".git", ".vercel", "node_modules"],
  skipFiles: ["sitemap.xml", "sitemap-index.xml", "sitemap-images.xml"],
  excludePathPatterns: [],
};
const CONFIG_PATH = path.join(ROOT, "sitemap.config.json");
const loadedConfig = fs.existsSync(CONFIG_PATH)
  ? JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"))
  : {};
const CONFIG = {
  ...defaultConfig,
  ...loadedConfig,
  skipDirs: loadedConfig.skipDirs || defaultConfig.skipDirs,
  skipFiles: loadedConfig.skipFiles || defaultConfig.skipFiles,
  excludePathPatterns: loadedConfig.excludePathPatterns || defaultConfig.excludePathPatterns,
};
const SITE_URL = CONFIG.siteUrl.replace(/\/+$/, "");
const TODAY = new Date().toISOString().slice(0, 10);

const SKIP_DIRS = new Set(CONFIG.skipDirs);
const SKIP_HTML = new Set(CONFIG.skipFiles);
const IMAGE_EXT_RE = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") && ![".well-known"].includes(entry.name)) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile()) files.push(fullPath);
  }

  return files;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function readFileSafe(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function matchMeta(content, attrName, attrValue) {
  const re = new RegExp(
    `<meta[^>]+${attrName}=["']${attrValue}["'][^>]+content=["']([^"']+)["'][^>]*>|<meta[^>]+content=["']([^"']+)["'][^>]+${attrName}=["']${attrValue}["'][^>]*>`,
    "i"
  );
  const match = content.match(re);
  return match ? match[1] || match[2] || "" : "";
}

function matchLink(content, relValue) {
  const re = new RegExp(
    `<link[^>]+rel=["']${relValue}["'][^>]+href=["']([^"']+)["'][^>]*>|<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${relValue}["'][^>]*>`,
    "i"
  );
  const match = content.match(re);
  return match ? match[1] || match[2] || "" : "";
}

function hasNoindex(content) {
  const robots = [
    matchMeta(content, "name", "robots"),
    matchMeta(content, "name", "googlebot"),
  ]
    .filter(Boolean)
    .join(",")
    .toLowerCase();

  return robots.includes("noindex");
}

function normalizePageUrl(filePath, canonicalHref) {
  if (canonicalHref) {
    try {
      const url = new URL(canonicalHref, SITE_URL);
      if (url.origin === SITE_URL) return url.toString();
    } catch {
      // Fall back to derived path.
    }
  }

  const relPath = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (relPath === "index.html") return `${SITE_URL}/`;
  if (relPath.endsWith("/index.html")) {
    return `${SITE_URL}/${relPath.slice(0, -"index.html".length)}`;
  }
  return `${SITE_URL}/${relPath}`;
}

function normalizeAssetUrl(rawUrl, pageUrl) {
  if (!rawUrl || rawUrl.startsWith("data:") || rawUrl.startsWith("#")) return null;

  try {
    const url = new URL(rawUrl, pageUrl);
    if (url.origin !== SITE_URL) return null;
    if (!IMAGE_EXT_RE.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function collectImageUrls(content, pageUrl) {
  const found = new Set();
  const patterns = [
    /<img[^>]+src=["']([^"']+)["']/gi,
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<link[^>]+as=["']image["'][^>]+href=["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) {
      const normalized = normalizeAssetUrl(match[1], pageUrl);
      if (normalized) found.add(normalized);
    }
  }

  return preferLargestVariants(Array.from(found));
}

function variantRank(url) {
  if (/-xl\./i.test(url)) return 3;
  if (/-md\./i.test(url)) return 2;
  if (/-sm\./i.test(url)) return 1;
  return 4;
}

function imageVariantKey(url) {
  return url.replace(/-(sm|md|xl)(\.[a-z0-9]+)$/i, "$2");
}

function preferLargestVariants(urls) {
  const best = new Map();

  for (const url of urls) {
    const key = imageVariantKey(url);
    const current = best.get(key);

    if (!current || variantRank(url) > variantRank(current)) {
      best.set(key, url);
    }
  }

  return Array.from(best.values());
}

function inferChangefreq(content, url) {
  if (url === `${SITE_URL}/`) return "weekly";
  if (/og:type["']\s+content=["']article["']/i.test(content)) return "weekly";
  return "monthly";
}

function inferPriority(url) {
  if (url === `${SITE_URL}/`) return "1.0";
  const depth = new URL(url).pathname.split("/").filter(Boolean).length;
  if (depth <= 1) return "0.95";
  if (depth === 2) return "0.85";
  return "0.75";
}

function pageEntries() {
  const htmlFiles = walk(ROOT)
    .filter((filePath) => filePath.endsWith(".html"))
    .filter((filePath) => !SKIP_HTML.has(path.basename(filePath)))
    .filter((filePath) => {
      const relPath = path.relative(ROOT, filePath).replace(/\\/g, "/");
      return !CONFIG.excludePathPatterns.some((pattern) => new RegExp(pattern).test(relPath));
    });

  const entries = [];

  for (const filePath of htmlFiles) {
    const content = readFileSafe(filePath);
    if (hasNoindex(content)) continue;

    const canonicalHref = matchLink(content, "canonical");
    const url = normalizePageUrl(filePath, canonicalHref);
    const stat = fs.statSync(filePath);

    entries.push({
      filePath,
      url,
      lastmod: stat.mtime.toISOString().slice(0, 10),
      changefreq: inferChangefreq(content, url),
      priority: inferPriority(url),
      images: collectImageUrls(content, url),
    });
  }

  entries.sort((a, b) => a.url.localeCompare(b.url));
  return entries;
}

function writeSitemap(entries) {
  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), xml);
}

function writeImageSitemap(entries) {
  const body = entries
    .map((entry) => {
      const images = entry.images
        .map((imageUrl) => `    <image:image><image:loc>${escapeXml(imageUrl)}</image:loc></image:image>`)
        .join("\n");

      return `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    <lastmod>${entry.lastmod}</lastmod>
${images}
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`;

  fs.writeFileSync(path.join(ROOT, "sitemap-images.xml"), xml);
}

function writeSitemapIndex() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-images.xml</loc>
    <lastmod>${TODAY}</lastmod>
  </sitemap>
</sitemapindex>
`;

  fs.writeFileSync(path.join(ROOT, "sitemap-index.xml"), xml);
}

function main() {
  const entries = pageEntries();
  writeSitemap(entries);
  writeImageSitemap(entries);
  writeSitemapIndex();

  console.log(`Generated sitemap.xml for ${entries.length} pages.`);
}

main();
