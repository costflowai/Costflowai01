#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content', 'posts');
const outputBlogDir = path.join(rootDir, 'blog');
const tagsDir = path.join(outputBlogDir, 'tags');

const templateBasePath = path.join(rootDir, 'templates', 'base.html');
const templatePostPath = path.join(rootDir, 'templates', 'post.html');
const templateIndexPath = path.join(rootDir, 'templates', 'blog_index.html');

function parseFrontmatter(raw) {
  const match = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/m.exec(raw.trim());
  if (!match) {
    throw new Error('Frontmatter missing');
  }
  const frontmatterLines = match[1].split('\n');
  const metadata = {};
  for (const line of frontmatterLines) {
    const [key, ...rest] = line.split(':');
    if (!key) continue;
    const value = rest.join(':').trim();
    if (value.startsWith('[')) {
      metadata[key.trim()] = JSON.parse(value.replace(/'/g, '"'));
    } else {
      metadata[key.trim()] = value.replace(/^"|"$/g, '');
    }
  }
  return { metadata, body: match[2].trim() };
}

function markdownToHtml(markdown) {
  const lines = markdown.split('\n');
  const html = [];
  let inList = false;
  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (inList) {
        html.push(inList === 'ol' ? '</ol>' : '</ul>');
        inList = false;
      }
      html.push(`<h3>${line.slice(4)}</h3>`);
    } else if (line.startsWith('## ')) {
      if (inList) {
        html.push(inList === 'ol' ? '</ol>' : '</ul>');
        inList = false;
      }
      html.push(`<h2>${line.slice(3)}</h2>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (inList && inList !== 'ol') {
        html.push('</ul>');
        inList = false;
      }
      if (!inList) {
        html.push('<ol>');
        inList = 'ol';
      }
      html.push(`<li>${line.replace(/^\d+\.\s+/, '')}</li>`);
    } else if (line.startsWith('- ')) {
      if (inList && inList !== 'ul') {
        html.push('</ol>');
        inList = false;
      }
      if (!inList) {
        html.push('<ul>');
        inList = 'ul';
      }
      html.push(`<li>${line.slice(2)}</li>`);
    } else if (line.trim() === '') {
      if (inList) {
        html.push(inList === 'ol' ? '</ol>' : '</ul>');
        inList = false;
      }
    } else {
      if (inList) {
        html.push(inList === 'ol' ? '</ol>' : '</ul>');
        inList = false;
      }
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
      html.push(`<p>${formatted}</p>`);
    }
  }
  if (inList) {
    html.push(inList === 'ol' ? '</ol>' : '</ul>');
  }
  return html.join('\n');
}

function fillTemplate(template, data) {
  return template.replace(/{{(\w+)}}/g, (match, key) => {
    return data[key] ?? '';
  });
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function build() {
  await ensureDir(outputBlogDir);
  await ensureDir(tagsDir);

  const baseTemplate = await fs.readFile(templateBasePath, 'utf8');
  const postTemplate = await fs.readFile(templatePostPath, 'utf8');
  const indexTemplate = await fs.readFile(templateIndexPath, 'utf8');

  const postFiles = (await fs.readdir(contentDir)).filter((file) => file.endsWith('.md'));
  if (!postFiles.length) {
    console.warn('No posts found.');
    return;
  }

  const posts = [];

  for (const file of postFiles) {
    const fullPath = path.join(contentDir, file);
    const raw = await fs.readFile(fullPath, 'utf8');
    const { metadata, body } = parseFrontmatter(raw);
    const htmlBody = markdownToHtml(body);
    const slug = metadata.slug || file.replace(/\.md$/, '');
    const isoDate = metadata.date;
    const displayDate = new Date(metadata.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const tagList = Array.isArray(metadata.tags) ? metadata.tags.join(', ') : '';
    const articleHtml = fillTemplate(postTemplate, {
      title: metadata.title,
      isoDate,
      displayDate,
      tags: tagList,
      body: htmlBody
    });
    const jsonLd = JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: metadata.title,
        description: metadata.description,
        datePublished: metadata.date,
        image: metadata.cover,
        author: { '@type': 'Organization', name: 'CostFlowAI' }
      },
      null,
      2
    );
    const pageHtml = fillTemplate(baseTemplate, {
      title: `${metadata.title} | CostFlowAI Insights`,
      description: metadata.description,
      canonical: `https://costflow.ai/blog/${slug}.html`,
      jsonld: jsonLd,
      page: 'blog-post',
      mainModifier: 'site-main__inner--single',
      year: new Date().getFullYear(),
      content: articleHtml
    });
    const outputPath = path.join(outputBlogDir, `${slug}.html`);
    await fs.writeFile(outputPath, pageHtml, 'utf8');

    posts.push({
      ...metadata,
      slug,
      isoDate,
      displayDate,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      htmlBody,
      excerpt: body.split('\n').find((line) => line.trim().length) || ''
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const cards = posts
    .map(
      (post) => `
      <article class="card">
        <header class="card__header">
          <div>
            <h2 class="card__title"><a href="/blog/${post.slug}.html">${post.title}</a></h2>
            <span class="card__meta">${post.displayDate}</span>
          </div>
        </header>
        <p>${post.description}</p>
      </article>
    `
    )
    .join('');

  const indexContent = indexTemplate.replace('{{posts}}', cards);
  const indexJsonLd = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'CostFlowAI Insights',
      url: 'https://costflow.ai/blog/'
    },
    null,
    2
  );

  const indexHtml = fillTemplate(baseTemplate, {
    title: 'CostFlowAI Insights',
    description: 'Preconstruction estimating articles from CostFlowAI.',
    canonical: 'https://costflow.ai/blog/',
    jsonld: indexJsonLd,
    page: 'blog-index',
    mainModifier: 'site-main__inner--single',
    year: new Date().getFullYear(),
    content: indexContent
  });

  await fs.writeFile(path.join(outputBlogDir, 'index.html'), indexHtml, 'utf8');

  const rssItems = posts
    .map(
      (post) => `
        <item>
          <title><![CDATA[${post.title}]]></title>
          <link>https://costflow.ai/blog/${post.slug}.html</link>
          <guid isPermaLink="true">https://costflow.ai/blog/${post.slug}.html</guid>
          <pubDate>${new Date(post.date).toUTCString()}</pubDate>
          <description><![CDATA[${post.description}]]></description>
        </item>
      `
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>CostFlowAI Insights</title>
      <link>https://costflow.ai/blog/</link>
      <description>Enterprise construction estimating intelligence.</description>
      ${rssItems}
    </channel>
  </rss>`;

  await fs.writeFile(path.join(rootDir, 'rss.xml'), rss, 'utf8');

  const sitemapUrls = posts
    .map((post) => `<url><loc>https://costflow.ai/blog/${post.slug}.html</loc><lastmod>${post.date}</lastmod></url>`)
    .join('');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url><loc>https://costflow.ai/</loc></url>
    <url><loc>https://costflow.ai/calculators/</loc></url>
    <url><loc>https://costflow.ai/blog/</loc></url>
    ${sitemapUrls}
  </urlset>`;
  await fs.writeFile(path.join(rootDir, 'sitemap.xml'), sitemap, 'utf8');

  const tagsMap = new Map();
  for (const post of posts) {
    for (const tag of post.tags) {
      if (!tagsMap.has(tag)) tagsMap.set(tag, []);
      tagsMap.get(tag).push(post);
    }
  }

  for (const [tag, tagPosts] of tagsMap.entries()) {
    const tagCards = tagPosts
      .map((post) => `<li><a href="/blog/${post.slug}.html">${post.title}</a> <span class="card__meta">${post.displayDate}</span></li>`)
      .join('');
    const tagContent = `<section><h1>${tag}</h1><ul>${tagCards}</ul></section>`;
    const tagHtml = fillTemplate(baseTemplate, {
      title: `${tag} | CostFlowAI Insights`,
      description: `Articles tagged ${tag} from CostFlowAI.`,
      canonical: `https://costflow.ai/blog/tags/${tag}.html`,
      jsonld: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${tag} Articles`,
        url: `https://costflow.ai/blog/tags/${tag}.html`
      }),
      page: 'blog-tag',
      mainModifier: 'site-main__inner--single',
      year: new Date().getFullYear(),
      content: tagContent
    });
    await fs.writeFile(path.join(tagsDir, `${tag}.html`), tagHtml, 'utf8');
  }

  console.log(`Built ${posts.length} blog post(s).`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
