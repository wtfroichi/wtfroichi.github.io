(async function(){
  const GITHUB_USER = 'wtfroichi';
  const projectsGrid = document.getElementById('projectsGrid');
  const detailView = document.getElementById('detailView');
  const listView = document.getElementById('listView');
  const projectDetail = document.getElementById('projectDetail');
  const backBtn = document.getElementById('backBtn');

  async function loadProjects() {
    try {
      const res = await fetch('/assets/projects.json');
      const list = res.ok ? await res.json() : [];
      renderList(list);
    } catch (e) {
      projectsGrid.innerHTML = '<p style="color:var(--muted)">No se pudieron cargar los proyectos.</p>';
    }
  }

  function renderList(list) {
    projectsGrid.innerHTML = '';
    list.forEach(repo => {
      const div = document.createElement('div');
      div.className = 'project-item';
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
          <h3 style="margin:0;font-size:16px;"><a href="${repo.html_url}" target="_blank">${repo.name}</a></h3>
          <div style="display:flex;gap:8px;align-items:center">
            ${repo.language ? `<span class="project-meta">${repo.language}</span>` : ''}
            <a href="#/repo/${encodeURIComponent(repo.name)}" class="project-link" style="color:var(--neon);">Abrir</a>
          </div>
        </div>
        <p style="margin:0;color:var(--muted);font-size:14px;">${repo.description || 'Sin descripción'}</p>
      `;
      projectsGrid.appendChild(div);
    });
  }

  async function fetchRepoData(name) {
    const api = `https://api.github.com/repos/${GITHUB_USER}/${name}`;
    const resp = await fetch(api);
    if (!resp.ok) throw new Error('repo not found');
    return await resp.json();
  }

  async function fetchReadmeHTML(name) {
    try {
      const resp = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${name}/readme`);
      if (!resp.ok) return null;
      const data = await resp.json();
      const md = atob(data.content.replace(/\n/g,''));
      // convert markdown to html using marked
      return marked.parse(md);
    } catch (e) {
      return null;
    }
  }

  async function showRepoDetail(name) {
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    projectDetail.innerHTML = '<p style="color:var(--muted)">Cargando proyecto...</p>';
    try {
      const repo = await fetchRepoData(name);
      const readmeHTML = await fetchReadmeHTML(name);
      projectDetail.innerHTML = `
        <h2 style="color:var(--neon);">${repo.full_name}</h2>
        <p style="color:var(--muted);">${repo.description || ''}</p>
        <div style="display:flex;gap:12px;margin:12px 0">
          <a href="${repo.html_url}" target="_blank" style="color:var(--neon)">Ver en GitHub</a>
          ${repo.homepage ? `<a href="${repo.homepage}" target="_blank" style="color:var(--neon)">Demo</a>` : ''}
          <span style="color:var(--muted)">• ${repo.language || '—'}</span>
          <span style="color:var(--muted)">• ${repo.stargazers_count} ★</span>
        </div>
        <div id="readmeContent">${readmeHTML || '<p style="color:var(--muted)">No hay README disponible.</p>'}</div>
      `;
    } catch (e) {
      projectDetail.innerHTML = '<p style="color:var(--muted)">No se pudo cargar el proyecto.</p>';
    }
  }

  function handleHash() {
    const hash = location.hash || '';
    const match = hash.match(/^#\/repo\/(.+)$/);
    if (match) {
      const name = decodeURIComponent(match[1]);
      showRepoDetail(name);
    } else {
      detailView.classList.add('hidden');
      listView.classList.remove('hidden');
    }
  }

  backBtn.addEventListener('click', () => { location.hash = ''; });
  window.addEventListener('hashchange', handleHash);

  await loadProjects();
  handleHash();
})();
