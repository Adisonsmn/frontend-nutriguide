describe('Food Logging & History Management', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    sessionStorage.clear();
  });

  it('should successfully customize food logging quantity in grams (Bug #15)', () => {
    cy.stubLogin();

    // Intercept food detail fetch
    cy.intercept('GET', '**/api/foods/FOOD-111', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          food_id: 'FOOD-111',
          name: 'Sweet Apple',
          calories: 52,
          protein_g: 0.3,
          carbs_g: 14,
          fat_g: 0.2,
          price_estimate: 2,
          category: 'vegan, fruit',
          recipe: null,
        },
      },
    }).as('getFoodDetail');

    // Intercept adding to history
    cy.intercept('POST', '**/api/history', {
      statusCode: 201,
      body: {
        status: 'success',
        message: 'Added to history',
      },
    }).as('addToHistory');

    // Visit the Apple food detail page
    cy.visit('/food/FOOD-111');

    cy.wait('@getFoodDetail');

    // Verify page displays food details
    cy.contains('Sweet Apple').should('exist');

    // Verify quantity input defaults to 100 grams
    cy.get('#quantity-input').should('have.value', '100');

    // Change quantity to 250 grams using selectall to avoid state-reset side-effects
    cy.get('#quantity-input').type('{selectall}250');

    // Save to history
    cy.get('#btn-save-history').click();

    // Verify request payload contains exactly 250 grams
    cy.wait('@addToHistory').then((interception) => {
      expect(interception.request.body).to.have.property('qty_gram', 250);
    });

    // Check for success feedback toast
    cy.contains('Saved 250g to history!').should('exist');
  });

  it('should prevent multiple deletion requests on double-clicks using a ref-guard (Bug #16)', () => {
    cy.stubLogin();

    // Intercept history list fetch
    cy.intercept('GET', '**/api/history', {
      statusCode: 200,
      body: {
        status: 'success',
        data: [
          {
            history_id: 'HIST-999',
            user_id: 'USER-001',
            food_id: 'FOOD-111',
            qty_gram: 100,
            consumed_at: new Date().toISOString(),
            food: {
              food_id: 'FOOD-111',
              name: 'Banana Split',
              calories: 250,
              protein_g: 3.5,
              carbs_g: 45,
              fat_g: 8,
              price_estimate: 15,
            },
          },
        ],
      },
    }).as('getHistory');

    // Intercept delete history with a delay to mock slow network
    cy.intercept('DELETE', '**/api/history/HIST-999', {
      delay: 1500,
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Deleted successfully',
      },
    }).as('deleteHistory');

    cy.visit('/history');

    cy.wait('@getHistory');

    cy.contains('Banana Split').should('exist');

    // Double-click the delete icon (using force: true since opacity is 0 until hover)
    cy.get('button[title="Delete entry"]').click({ force: true }).click({ force: true });

    // Wait for the mock network to resolve
    cy.wait('@deleteHistory');

    // Assert that the delete API request was fired exactly ONCE
    cy.get('@deleteHistory.all').should('have.length', 1);

    // Verify item is removed from view and success message appears
    cy.contains('Banana Split').should('not.exist');
    cy.contains('Entry deleted').should('exist');
  });
});
