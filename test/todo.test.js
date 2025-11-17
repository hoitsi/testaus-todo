import { beforeEach, describe, expect, it } from 'vitest';

//Avaimella haetaan localstorage data app.js:sstä.
const STORAGE_KEY = 'todo_tasks_v1';

// Tämä koodi on vibekoodattu, localstorage-hässäkkä.
// Mock localStorage
//Leikitään että löytyy localstorage. Simuloi selaimen välimuistia. Käyttää ilmeisestikkin map-tietoranekenetta.
const createStorageMock = () => {
  const store = new Map();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
};

let localStorage;

beforeEach(() => {
  localStorage = createStorageMock();
});

// Yksikkötestattavat funktiot (kopioidaan app.js:stä)
// Apufunktiot tuotu tänne siksi, että eivät ole riippuvaisia selaimesta. Lisäksi tällä tavalla ei tarvinnut muuttaa app.js:ssä olevaa koodia.
// Apufunktiot on luotu tekoälyavusteisesti.

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY); // hakee tekstin muistista
    if (!raw) return []; // jos ei löydy, palauta tyhjä
    const parsed = JSON.parse(raw); // muuttaa jsonin js objektiksi, listaksi.
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Tallennus
function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Luo satunnaisen tunnisteen.
// Homman pihvi siinä, että jos samaan aikaan luodaan tehtäviä, niin jokaisesta kuitenkin tehdään uniikkeja. Tätä ei itseasiassa ollut suunnitelmassa mutta oikein hyvä idea tekoälyltä!
function generateId() {
  return (
    't_' +
    Math.random().toString(36).slice(2, 8) +
    Date.now().toString(36).slice(-4)
  );
}

// Luodaan tehtävä
// Jokaiselle tehtävälle uniikki id.
// Luo siis objektin
function createTask(topic, priority, status, description) {
  const now = Date.now();
  return {
    id: generateId(),
    topic,
    priority,
    status,
    description,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

// Päivittää tehtävän, etsii tehtävän listasta.
// Etsii indeksillä tehtävän sijainnin listassa.
function updateTask(tasks, id, updates) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return tasks;
  tasks[idx] = {
    ...tasks[idx], // ottaa vanhat kentät
    ...updates, // korvaus
    updatedAt: Date.now(),
  };
  return tasks;
}

// Switchi, vaihtaa valmis / ei valmis
function toggleComplete(tasks, id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return tasks;
  const newCompleted = !tasks[idx].completed;
  tasks[idx] = {
    ...tasks[idx],
    completed: newCompleted,
    status: newCompleted ? 'done' : 'todo',
    updatedAt: Date.now(),
  };
  return tasks;
}

// Poistaa tehtävän.
function deleteTask(tasks, id) {
  return tasks.filter((t) => t.id !== id);
}

// Lajittelee tehtävät.
// a ja b kaksi tehtävää jota verrataan.
// jos a valmis b ei --> a menee taakse
// jos a ei valmis ja b on --> a menee eteen
function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const prioRank = { high: 0, medium: 1, low: 2 };
    if (prioRank[a.priority] !== prioRank[b.priority]) {
      return prioRank[a.priority] - prioRank[b.priority];
    }
    return b.createdAt - a.createdAt;
  });
}

// Itse funktiotestauksia on tehty itse, sekä tekoälyä käyttäen. Lähinnä tekoäly on viimeistellyt koodin.
// Perus ajatus ja käsitys on hallussa, harjoitustehtävät vain huomattavasti yksinkertaisempia.
describe('Tehtävän luominen', () => {
  it('luo tehtävän oikeilla kentillä', () => {
    const task = createTask('Siivoa', 'high', 'todo', 'Imuroi lattia');

    expect(task).toMatchObject({
      // Katsoo että tehtävä pitää sisällään nämä kentät.
      topic: 'Siivoa',
      priority: 'high',
      status: 'todo',
      description: 'Imuroi lattia',
      completed: false,
    });
    expect(task.id).toBeDefined(); // Varmistaa että taskilla on id
    expect(task.createdAt).toBeTypeOf('number');
    expect(task.updatedAt).toBeTypeOf('number');
  });

  it('tallentaa tehtävän localStorageen', () => {
    const task = createTask('Testi', 'medium', 'todo', '');
    saveTasks([task]);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0].topic).toBe('Testi');
  });

  it('lataa tehtävät localStoragesta', () => {
    const tasks = [
      createTask('Task 1', 'high', 'todo', ''),
      createTask('Task 2', 'low', 'done', ''),
    ];
    saveTasks(tasks);

    const loaded = loadTasks();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].topic).toBe('Task 1');
  });
});

describe('Tehtävän muokkaaminen', () => {
  it('päivittää tehtävän kentät', () => {
    const tasks = [createTask('Alkuperäinen', 'low', 'todo', 'Vanha')];
    const updated = updateTask(tasks, tasks[0].id, {
      topic: 'Päivitetty',
      description: 'Uusi',
      priority: 'high',
    });

    expect(updated[0]).toMatchObject({
      topic: 'Päivitetty',
      description: 'Uusi',
      priority: 'high',
    });
  });

  it('tallentaa muutokset localStorageen', () => {
    const tasks = [createTask('Testi', 'medium', 'todo', '')];
    const updated = updateTask(tasks, tasks[0].id, { topic: 'Muokattu' });
    saveTasks(updated);

    const loaded = loadTasks();
    expect(loaded[0].topic).toBe('Muokattu');
  });
});

describe('Tehtävän valmistuminen', () => {
  it('merkitsee tehtävän valmiiksi', () => {
    const tasks = [createTask('Testi', 'medium', 'todo', '')];
    const toggled = toggleComplete(tasks, tasks[0].id);

    expect(toggled[0].completed).toBe(true);
    expect(toggled[0].status).toBe('done');
  });

  it('poistaa valmis-merkinnän', () => {
    const tasks = [createTask('Testi', 'medium', 'todo', '')];
    let toggled = toggleComplete(tasks, tasks[0].id);
    toggled = toggleComplete(toggled, tasks[0].id);

    expect(toggled[0].completed).toBe(false);
  });

  it('tallentaa tilan muutoksen', () => {
    const tasks = [createTask('Testi', 'medium', 'todo', '')];
    const toggled = toggleComplete(tasks, tasks[0].id);
    saveTasks(toggled);

    const loaded = loadTasks();
    expect(loaded[0].completed).toBe(true);
  });
});

describe('Tehtävän poistaminen', () => {
  it('poistaa tehtävän listasta', () => {
    const tasks = [
      createTask('Task 1', 'high', 'todo', ''),
      createTask('Task 2', 'low', 'done', ''),
    ];
    const deleted = deleteTask(tasks, tasks[0].id);

    expect(deleted).toHaveLength(1);
    expect(deleted[0].topic).toBe('Task 2');
  });

  it('tallentaa poiston', () => {
    const tasks = [createTask('Poistettava', 'medium', 'todo', '')];
    const deleted = deleteTask(tasks, tasks[0].id);
    saveTasks(deleted);

    const loaded = loadTasks();
    expect(loaded).toHaveLength(0);
  });
});

// 1 = c, 2 = d, 3 = a, 4 = b
describe('Tehtävien lajittelu', () => {
  it('lajittelee keskeneräiset ensin, sitten prioriteetin ja uusimman mukaan', () => {
    const tasks = [
      {
        id: 'a',
        topic: 'A',
        priority: 'low',
        completed: false,
        createdAt: 100,
      },
      {
        id: 'b',
        topic: 'B',
        priority: 'high',
        completed: true,
        createdAt: 400,
      },
      {
        id: 'c',
        topic: 'C',
        priority: 'high',
        completed: false,
        createdAt: 300,
      },
      {
        id: 'd',
        topic: 'D',
        priority: 'high',
        completed: false,
        createdAt: 200,
      },
    ];

    const sorted = sortTasks([...tasks]);
    expect(sorted.map((t) => t.id)).toEqual(['c', 'd', 'a', 'b']);
  });
});

// Sivu refressataan beforeEach-metodilla aina. Tekoälyopetti. Tällöin jokainen testi ajetaan puhtaalta pyödältä, eikä synny toisiinvaikuttamista.
// Harjoitustehtävissä ei tuotu testattavia funktiota tänne testi-tiedostoon. Helpompaa kun leikitään ja simuloidaan selaimen välimuistia täällä.
// Suoraan sanottuna itselle tämä oli liian haastava saattaa loppuun ilman tekoälyä.
// Lisäys jota en edes testaussuunnitelmassa tullut ajatelleeksi, jos tehdäänkin pari tehtävää vaikka samaan aikaan. Tekoälyn ratkaisu oli luoda aikaleimat ja joka todo:lle uniikki id.
