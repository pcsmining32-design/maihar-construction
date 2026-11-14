// Renders the project list. Only built projects are clickable; others are shown disabled.
export function renderProjects(container, projects, onPick) {
  container.innerHTML = '';
  for (const p of projects) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'proj';
    b.disabled = !p.built;
    b.textContent = p.name + ' (' + p.role + ')' + (p.built ? '' : ' — coming soon');
    if (p.built) b.addEventListener('click', () => onPick(p.id));
    container.appendChild(b);
  }
}
