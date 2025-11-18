/* eslint-env browser */
/* global document, window, localStorage */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} topic
 * @property {string} priority
 * @property {string} status
 * @property {string} description
 * @property {boolean} completed
 * @property {number} createdAt
 * @property {number} updatedAt
 */

'use strict';

(function () {
  // Storage key and helpers
  const STORAGE_KEY = 'todo_tasks_v1';
  /** @returns {Array} */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
  function generateId() {
    return (
      't_' +
      Math.random().toString(36).slice(2, 8) +
      Date.now().toString(36).slice(-4)
    );
  }

  // DOM refs
  const form = /** @type {HTMLFormElement} */ (
    document.getElementById('task-form')
  );
  const formTitle = /** @type {HTMLElement} */ (
    document.getElementById('form-title')
  );
  const inputId = /** @type {HTMLInputElement} */ (
    document.getElementById('task-id')
  );
  const inputTopic = /** @type {HTMLInputElement} */ (
    document.getElementById('topic')
  );
  const inputPriority = /** @type {HTMLSelectElement} */ (
    document.getElementById('priority')
  );
  const inputStatus = /** @type {HTMLSelectElement} */ (
    document.getElementById('status')
  );
  const inputDescription = document.getElementById('description');
  // LISÄÄ NÄMÄ KAKSI RIVIÄ
  const saveBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('save-btn')
  );
  const resetBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('reset-btn')
  );
  const list = /** @type {HTMLElement} */ (
    document.getElementById('task-list')
  );
  const emptyState = /** @type {HTMLElement} */ (
    document.getElementById('empty-state')
  );
  // LISÄÄ TÄMÄ VIITE SUODATIN-NAPPEIHIN
  const filterContainer = /** @type {HTMLElement} */ (
    document.getElementById('filter-container')
  );

  // State
  let tasks = loadTasks();
  // LISÄÄ TÄMÄ UUSI TILAMUUTTUJA
  let currentFilter = 'all'; // 'all', 'high', 'medium', 'low'

  // Render
  function render() {
    // LISÄÄ TÄMÄ SUODATUSLOGIIKKA RENDER-FUNKTION ALKUUN
    const filteredTasks =
      currentFilter === 'all'
        ? tasks
        : tasks.filter((t) => t.priority === currentFilter);

    list.innerHTML = '';
    if (!filteredTasks.length) {
      emptyState.style.display = 'block';
      // Jos tehtäviä on, mutta suodatin piilottaa ne, näytä eri viesti
      if (tasks.length > 0 && currentFilter !== 'all') {
        emptyState.textContent = `No tasks match the filter "${currentFilter}".`;
      } else {
        emptyState.textContent = 'No tasks yet. Add your first task above.';
      }
      return;
    }
    emptyState.style.display = 'none';

    // MUUTA `tasks` -> `filteredTasks` TÄSSÄ
    filteredTasks
      .sort((a, b) => {
        // Not-done first, then by priority (high->low), then newest first
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const prioRank = { high: 0, medium: 1, low: 2 };
        if (prioRank[a.priority] !== prioRank[b.priority]) {
          return prioRank[a.priority] - prioRank[b.priority];
        }
        return b.createdAt - a.createdAt;
      })
      .forEach((t) => {
        const li = document.createElement('li');
        li.className = 'task' + (t.completed ? ' done' : '');
        li.dataset.id = t.id;
        li.innerHTML = `
					<div>
						<div class="title">${escapeHtml(t.topic)}</div>
						<div class="desc">${escapeHtml(t.description || '')}</div>
					</div>
					<div class="meta">
						<span class="badge prio-${t.priority}">
							<span class="dot"></span>
							${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
						</span>
					</div>
					<div class="meta">
						${badgeForStatus(t.status)}
					</div>
					<div class="controls">
						<button data-action="edit" class="secondary">Edit</button>
						<button data-action="complete" class="${t.completed ? 'secondary' : ''}">
							${t.completed ? 'Undo' : 'Complete'}
						</button>
						<button data-action="delete" class="danger">Delete</button>
					</div>
				`;
        list.appendChild(li);
      });
  }

  function badgeForStatus(status) {
    const label =
      {
        todo: 'To do',
        'in-progress': 'In progress',
        blocked: 'Blocked',
        done: 'Done',
      }[status] || status;
    return `<span class="badge">${label}</span>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Form handling
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const now = Date.now();
    const payload = {
      topic: inputTopic.value.trim(),
      priority: inputPriority.value,
      status: inputStatus.value,
      description: inputDescription.value.trim(),
    };
    if (!payload.topic) {
      inputTopic.focus();
      return;
    }

    if (inputId.value) {
      const idx = tasks.findIndex((t) => t.id === inputId.value);
      if (idx !== -1) {
        tasks[idx] = {
          ...tasks[idx],
          ...payload,
          completed: payload.status === 'done' ? true : tasks[idx].completed,
          updatedAt: now,
        };
      }
    } else {
      const newTask = {
        id: generateId(),
        ...payload,
        completed: payload.status === 'done',
        createdAt: now,
        updatedAt: now,
      };
      tasks.push(newTask);
    }
    saveTasks(tasks);
    resetForm();
    render();
  });

  resetBtn.addEventListener('click', () => {
    resetForm();
  });

  function resetForm() {
    formTitle.textContent = 'Create Task';
    inputId.value = '';
    form.reset();
    inputPriority.value = 'medium';
    inputStatus.value = 'todo';
    saveBtn.textContent = 'Save Task';
  }

  // List actions (event delegation)
  list.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    if (target.tagName !== 'BUTTON') return;
    const action = target.dataset.action;
    /** @type {HTMLElement | null} */
    const li = target.closest('.task');
    if (!li) return;
    const id = li.dataset.id;
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;

    if (action === 'edit') {
      const t = tasks[idx];
      formTitle.textContent = 'Edit Task';
      inputId.value = t.id;
      inputTopic.value = t.topic;
      inputPriority.value = t.priority;
      inputStatus.value = t.status;
      inputDescription.value = t.description || '';
      saveBtn.textContent = 'Update Task';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'complete') {
      const t = tasks[idx];
      const nextCompleted = !t.completed;
      tasks[idx] = {
        ...t,
        completed: nextCompleted,
        status: nextCompleted
          ? 'done'
          : t.status === 'done'
          ? 'todo'
          : t.status,
        updatedAt: Date.now(),
      };
      saveTasks(tasks);
      render();
    }
    if (action === 'delete') {
      const confirmDelete = window.confirm('Delete this task?');
      if (!confirmDelete) return;
      tasks.splice(idx, 1);
      saveTasks(tasks);
      render();
    }
  });

  // LISÄÄ TÄMÄ KOKO LOHKO SUODATTIMEN TAPAHTUMANKÄSITTELYLLE
  filterContainer.addEventListener('click', (e) => {
    const target = /** @type {HTMLElement} */ (e.target);
    // Varmistetaan, että klikkaus kohdistui nappiin, jolla on data-filter-attribuutti
    if (target.tagName === 'BUTTON' && target.dataset.filter) {
      currentFilter = target.dataset.filter;

      // Päivitetään aktiivinen nappi visuaalisesti
      filterContainer.querySelectorAll('button').forEach((btn) => {
        btn.classList.remove('active');
      });
      target.classList.add('active');

      // Päivitetään näkymä
      render();
    }
  });

  // Initial paint
  render();
})();

// Tehtävä 10 - lopputyö
// Uusi dom viittaus muuttujassa filterContainer. Viittaa html tiedostoon lisättyyn div elementtiin.
// currentFilter muuttujaan tallennetaan tieto siitä mikä suodatin on aktiivinen.
// Uusi tapahtumakäsittelijä addEventListener filterContainer elementille. kuuntelee klikkauksia suodatin alueen sisällä
// render funktioon muutos, alussa logiikka suodataa tehtävät ennen niiden näyttämistä
// tyhjäntilan viestiin muutos, jos tehtäviä on mutta suodatus piilottaa --> käyttäjä saa ilmoituksen. Parempi käytettävyyden kannalta.
// currentFilter luo listan. se katsoo arvon ja käyttää array.prototype.filter metodilla ne tehtävät joiden priority vastaa currentFilter muutuja arvoa
// Eli listan forEach silmukka <li> elementin luonnille ei näytä alkuperäistä task listaa vaan suodatetun filteredTasks listan
// Periaatteessa olisi voinut toteuttaa piilottamalla tai lisäämällä/poistamalla css luokkia. Oppimisen kannalta parempi että käytetään myös yhdistettyä logiikkaa, käyttäen javascriptiä.
// Oikein modernina ratkaisuna olisi voinut käyttää svelteä tai angularia tekemällä task-komponentin.
// Tällöin painikkeella muokattaisiin tilamuuttujan arvoa. currentFilter olisi tilamuuttuja.
// Ongelmana se että koko projekti pitäisi muuttaa.....
