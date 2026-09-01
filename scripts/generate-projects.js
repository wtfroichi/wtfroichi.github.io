#!/usr/bin/env node
const fs = require('fs').promises;
const OWNER = process.env.REPO_OWNER || 'wtfroichi';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('GITHUB_TOKEN not set in environment. Exiting.');
  process.exit(1);
}

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'github-action'
};

async function fetchJSON(url, opts={}){
  const res = await fetch(url, { headers: { ...headers, ...(opts.headers||{}) } });
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return res.json();
}

async function fetchText(url, opts={}){
  const res = await fetch(url, { headers: { ...headers, ...(opts.headers||{}) } });
  if (!res.ok) return null;
  return res.text();
}

async function main(){
  const reposUrl = `https://api.github.com/users/${OWNER}/repos?per_page=200`;
  console.log('Fetching repos for', OWNER);
  const repos = await fetchJSON(reposUrl);
  const out = [];

  for (const r of repos) {
    try {
      const readmeUrl = `https://api.github.com/repos/${OWNER}/${r.name}/readme`;
      // request raw markdown when possible
      const readme = await fetchText(readmeUrl, { headers: { Accept: 'application/vnd.github.v3.raw' } });

      out.push({
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        homepage: r.homepage,
        fork: r.fork,
        updated_at: r.updated_at,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        open_issues_count: r.open_issues_count,
        readme: readme
      });
      console.log('Added', r.name);
    } catch (e) {
      console.warn('Skipping', r.name, e.message);
    }
  }

  const target = 'assets/projects.json';
  await fs.writeFile(target, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', target);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
