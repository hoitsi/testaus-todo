describe('Todo-sovelluksen E2E-testit', () => {
  // Ajetaan ennen jokaista testiä, voidaan aloittaa ns. puhtaalta pöydältä.
  beforeEach(() => {
    // Tällä ottaa localhostin tarkasteltavaksi.
    cy.visit('/');
    // Tyhjennetään cache, localstorage.
    cy.clearLocalStorage();
    // Ladataan sivu uudelleen tyhjällä localStoragella
    cy.reload();
  });

  // Peruskomennot cy.get ja select jutut kirjoitettu itse, liippasi aika läheltä harjoitustehtäviä.
  it('Luo uuden tehtävän, tallentaa sen ja näyttää sen listalla', () => {
    // Etsii syöttökentät ja täyttää.
    cy.get('#topic').type('Osta maitoa');
    cy.get('#description').type('Rasvatonta, luomua');
    cy.get('#priority').select('high');
    cy.get('#status').select('todo');

    // Klikataan tallennusnappia
    cy.get('#save-btn').click();

    // KAtsoo että uusi tehtävä tuli listalle. Katsotaan pituutta.
    cy.get('#task-list li').should('have.length', 1);
    cy.get('#task-list li').first().as('firstTask'); // Annetaan tehtävälle alias

    // Katsoo tehtävän ja että taskit mätsää should-menetelmällä. ja tekstiä pitäis olla.
    cy.get('@firstTask').should('contain.text', 'Osta maitoa');
    cy.get('@firstTask').should('contain.text', 'Rasvatonta, luomua');
    cy.get('@firstTask').should('contain.text', 'High'); // Prioriteetti näkyy tekstinä

    // Katsoo että tiedot tallentu cacheen, eli localstorageen. Tämän tekoäly opetti.
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'todo_tasks_v1')
      .should('exist');
  });

  it('Muokkaa olemassa olevaa tehtävää', () => {
    // Luodaan muokattava tehtävä.
    cy.get('#topic').type('wanaha');
    cy.get('#save-btn').click();

    // Etsii ekan tehtävän ja klikkaa muokkaa nappia.
    cy.get('#task-list li').first().find('button[data-action="edit"]').click();

    // Varmistaa lomakkeen tietojen oikeellisuuden. Onko tekstiä ja löytyykö wanha otsikko.
    cy.get('#form-title').should('contain.text', 'Edit Task');
    cy.get('#topic').should('have.value', 'wanaha');

    // Muokataan tietoja
    cy.get('#topic').clear().type('Update');
    cy.get('#description').type('Päivitys.');
    cy.get('#priority').select('low');

    // Tallennetaan muutokset
    cy.get('#save-btn').click();

    // KAtsotaan onko päivitys näkyvistä, eli päivittyikö lista.
    cy.get('#task-list li').first().as('editedTask');
    cy.get('@editedTask').should('contain.text', 'Update');
    cy.get('@editedTask').should('contain.text', 'Päivitys.');
    cy.get('@editedTask').should('contain.text', 'Low');
  });

  it('Voi merkitä tehtävän valmiiksi ja perua sen', () => {
    // Uuden tehtävän luonti
    cy.get('#topic').type('Siivoa huone');
    cy.get('#save-btn').click();

    cy.get('#task-list li').first().as('task');

    // Painetaan valmis nappia
    cy.get('@task').find('button[data-action="complete"]').click();

    // Katsotaan tuliko tehtävä valmiiksi.
    cy.get('@task').should('have.class', 'done');
    cy.get('@task')
      .find('button[data-action="complete"]')
      .should('contain.text', 'Undo');

    // Painetaan peruutusnappia
    cy.get('@task').find('button[data-action="complete"]').click(); // Vähän kuin cy.get metodi mutta etsii kyseisen elementin sisältä.

    // Katsotaan että valmis-merkintää ei enää löydy.
    cy.get('@task').should('not.have.class', 'done');
    cy.get('@task')
      .find('button[data-action="complete"]')
      .should('contain.text', 'Complete');
  });

  it('Poistaa tehtävän listalta ja localStoragesta', () => {
    // tehdään uusi tehtävä.
    cy.get('#topic').type('Poistettava tehtävä');
    cy.get('#save-btn').click();

    // Katsotaan onko tehtävä listalla.
    cy.get('#task-list li').should('have.length', 1);

    // Kuunnellaan ja hyväksytään selaimen confirm-dialogi
    // Tämä on tekoälyn tuotoksia, eli painetaan hyväksy poisto - nappulaa
    cy.on('window:confirm', (str) => {
      expect(str).to.equal('Delete this task?');
      return true;
    });

    // Painetaan delete nappulaa
    cy.get('#task-list li')
      .first()
      .find('button[data-action="delete"]')
      .click();

    // Katsotaan onko listä tyhjä, eli poistuiko taski.
    cy.get('#task-list li').should('not.exist');
    cy.get('#empty-state').should('be.visible');

    // Katostaan localstoragen tilanne ja onko tyhjä. Tekoälyn tuotoksia.
    cy.window()
      .its('localStorage')
      .invoke('getItem', 'todo_tasks_v1')
      .then((value) => {
        const tasks = JSON.parse(value);
        expect(tasks).to.have.length(0);
      });
  });

  it('Lajittelee tehtävät oikein (ei valmiit, prioriteetti, uusin)', () => {
    // Luodaan tehtävät epäjärjestyksessä
    // 1. Kesken, matala prioriteetti, pitäisi olla 3
    cy.get('#topic').type('Tehtävä C');
    cy.get('#priority').select('low');
    cy.get('#save-btn').click();

    // 2. Valmis, korkealla prioriteetillä, pitäisi olla viimeinen.
    cy.get('#topic').type('Tehtävä D (valmis)');
    cy.get('#priority').select('high');
    cy.get('#status').select('done');
    cy.get('#save-btn').click();

    // 3. Pitäisi olla ensimmäinen, kesken ja korkea prioriteetti.
    cy.get('#topic').type('Tehtävä A');
    cy.get('#priority').select('high');
    cy.get('#save-btn').click();

    // 4. Kesken, medium priolla, pitäsi olla toisena.
    cy.get('#topic').type('Tehtävä B');
    cy.get('#priority').select('medium');
    cy.get('#save-btn').click();

    // Haetaan kaikki tehtävät listalta
    // Tämä oli uusi asia, voidaan näköjään muuttaa html sisältöä tekstiksi.
    cy.get('#task-list li').then((items) => {
      // Muutetaan HTML-elementit niiden tekstisisällöksi
      const titles = items
        .map((index, el) => Cypress.$(el).find('.title').text())
        .get();

      // Katsotaan järjestys oikeaksi.
      expect(titles).to.deep.equal([
        'Tehtävä A', // Keskeneräinen, high
        'Tehtävä B', // Keskeneräinen, medium
        'Tehtävä C', // Keskeneräinen, low
        'Tehtävä D (valmis)', // Valmis
      ]);
    });
  });

  // Tehtävä 10, sovellusmuutosten E2E testit.
  it('Suodattaa tehtäviä prioriteetin mukaan ja poistaa suodatuksen', () => {
    // Luodaan testidataa,testidata--> 2 high 1 medium.
    // Luodaan kolme tehtävää eri prioriteeteilla, jotta voimme testata suodatusta.
    // 1. High
    cy.get('#topic').type('Tärkeä tehtävä');
    cy.get('#priority').select('high');
    cy.get('#save-btn').click();
    // 2. Medium
    cy.get('#topic').type('Normaali tehtävä');
    cy.get('#priority').select('medium');
    cy.get('#save-btn').click();
    // 3. Toinen High
    cy.get('#topic').type('Toinen tärkeä');
    cy.get('#priority').select('high');
    cy.get('#save-btn').click();

    // Varmistetaan, että aluksi kaikki 3 tehtävää näkyvät
    cy.get('#task-list li').should('have.length', 3);

    // Testataan high-suodatus.
    // Klikataan "High"-nappia
    cy.get('button[data-filter="high"]').click();
    // Varmistetaan, että vain 2 tehtävää näkyy
    cy.get('#task-list li').should('have.length', 2);
    // Varmistetaan, että molemmat näkyvät tehtävät ovat "High" prioriteetilla
    cy.get('#task-list li').each(($li) => {
      cy.wrap($li).should('contain.text', 'High');
    });

    // Testataan medium-suodatus.
    // Klikataan "Medium"-nappia
    cy.get('button[data-filter="medium"]').click();
    // Varmistetaan, että vain 1 tehtävä näkyy
    cy.get('#task-list li').should('have.length', 1);
    cy.get('#task-list li').first().should('contain.text', 'Normaali tehtävä');

    // Testataan low-suodatus, pitäisi näyttää tyhjää.
    // Klikataan "Low"-nappia
    cy.get('button[data-filter="low"]').click();
    // Varmistetaan, että yhtään tehtävää ei näy
    cy.get('#task-list li').should('not.exist');
    // Varmistetaan, että oikea "tyhjä tila" -viesti tulee näkyviin
    cy.get('#empty-state')
      .should('be.visible')
      .and('contain.text', 'No tasks match the filter "low"');

    // Testataan suodatuksen poisto. Eli klikataan ALL painiketta.
    // Klikataan "All"-nappia
    cy.get('button[data-filter="all"]').click();
    // Varmistetaan, että kaikki 3 tehtävää ovat taas näkyvissä
    cy.get('#task-list li').should('have.length', 3);
  });
});

// Mitä opin? devausympäristössä piti määrittää localhost osoite cypresin config fileen. Ensimmäinen ongelma mikä piti selvittää.
// Perustarkastukset on tehty käytännössä itse, harjoitustehtävien pohjalta. Huomattavasti helpompi kuin yksikkötestauksen tehtävät.
// Tekoäly opetti kuitenkin uusia jippoja, popupin painallus ja localstoragen tarkistus.
// Uutena metodina myös html elementin muuttaminen tekstiksi cypresille.
// Yksinkertaisuuksiksaan get-metodi (css valitsin) on hyvinkin helppo ymmärtää.
// Buttonien haussa tekoäly auttoi syntaksissa.
// Tehtävä 10 lisättiin suodatukselle testit.
