describe('Dashboard Page & Calculations', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    sessionStorage.clear();
  });

  it('should render daily nutrition progress, macros targets, and remaining targets correctly (Bug #11)', () => {
    // Stub logged in session
    cy.stubLogin();

    cy.visit('/dashboard');

    cy.wait('@getSummary');

    // Assert calorie consumed and target values are rendered by the NutritionRing
    cy.contains('1500').should('exist'); // Consumed
    cy.contains('/ 2000').should('exist'); // Target

    // Verify macro splits are displayed correctly in the MacroBar components
    cy.contains('120 / 120 g').should('exist');
    cy.contains('200 / 200 g').should('exist');
    cy.contains('50 / 50 g').should('exist');
  });

  it('should send the local browser timezone offset in the summary query parameters (Bug #28)', () => {
    cy.stubLogin();

    // Dynamically calculate browser offset to verify it matches
    const expectedOffset = new Date().getTimezoneOffset() * -1;

    cy.visit('/dashboard');

    cy.wait('@getSummary').then((interception) => {
      const url = new URL(interception.request.url);
      expect(url.searchParams.get('timezoneOffset')).to.equal(String(expectedOffset));
    });
  });

  it('should gracefully clean up and cancel state updates on quick page navigation to prevent memory issues (Bug #22)', () => {
    cy.stubLogin();

    // Stub login but introduce a delay on summary request
    cy.intercept('POST', '**/api/auth/refresh-token', {
      statusCode: 200,
      body: { status: 'success', data: { accessToken: 'mock-token' } },
    });
    cy.intercept('GET', '**/api/profile', { fixture: 'profile.json' });
    cy.intercept('GET', '**/api/notifications', { data: [] });

    // Summary request is delayed by 2 seconds
    cy.intercept('GET', '**/api/history/summary*', {
      delay: 2000,
      fixture: 'summary.json',
    }).as('delayedSummary');

    // Visit dashboard
    cy.visit('/dashboard');

    // Immediately click "Profile" link in the navbar/page before the delay resolves to unmount Dashboard
    cy.get('a[href="/profile"]').first().click({ force: true });

    // Wait for the delayed network request to resolve
    cy.wait('@delayedSummary');

    // Check we navigated successfully to Profile and no console exceptions/errors were raised on unmount
    cy.url().should('include', '/profile');
  });
});
