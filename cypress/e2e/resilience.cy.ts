describe('Token Refresh Resilience & Queueing', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    sessionStorage.clear();
  });

  it('should queue multiple concurrent 401 requests and retry them exactly once after a single successful token refresh (Bug #4)', () => {
    // 1. Force the client to have an initially "expired" access token in state
    
    // We mock the first hit of the dashboard parallel API endpoints to fail with 401 Unauthorized
    let nutritionCalls = 0;
    cy.intercept('GET', '**/api/nutrition/calculate', (req) => {
      nutritionCalls++;
      if (nutritionCalls === 1) {
        req.reply({
          statusCode: 401,
          body: { status: 'error', message: 'Token expired' },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            status: 'success',
            data: {
              bmr: 1500,
              tdee: 2200,
              dailyCalorieTarget: 2000,
              macros: {
                protein: 120,
                carbs: 200,
                fat: 50,
              },
            },
          },
        });
      }
    }).as('nutritionEndpoint');

    let summaryCalls = 0;
    cy.intercept('GET', '**/api/history/summary*', (req) => {
      summaryCalls++;
      if (summaryCalls === 1) {
        req.reply({
          statusCode: 401,
          body: { status: 'error', message: 'Token expired' },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            status: 'success',
            data: { date: '2026-05-27', totalCalories: 1000, targetCalories: 2000, remaining: 1000, percentage: 50, macros: { protein: 80, carbs: 150, fat: 40 } },
          },
        });
      }
    }).as('summaryEndpoint');

    let foodCalls = 0;
    cy.intercept('GET', '**/api/foods*', (req) => {
      foodCalls++;
      if (foodCalls === 1) {
        req.reply({
          statusCode: 401,
          body: { status: 'error', message: 'Token expired' },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: { status: 'success', data: [] },
        });
      }
    }).as('foodsEndpoint');

    let articleCalls = 0;
    cy.intercept('GET', '**/api/articles*', (req) => {
      articleCalls++;
      if (articleCalls === 1) {
        req.reply({
          statusCode: 401,
          body: { status: 'error', message: 'Token expired' },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: { status: 'success', data: [] },
        });
      }
    }).as('articlesEndpoint');

    // 2. Intercept the silent token refresh request.
    // It should resolve successfully and return the new access token.
    cy.intercept('POST', '**/api/auth/refresh-token', {
      delay: 500, // add a slight delay to ensure parallel requests queue up while in-flight
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          accessToken: 'new-valid-access-token',
        },
      },
    }).as('tokenRefreshRequest');

    cy.intercept('GET', '**/api/notifications', { statusCode: 200, body: { data: [] } });

    // Set the initial expired state in Zustand auth storage so Axios carries a token
    const initialAuth = {
      state: {
        user: { user_id: 'USER-001', name: 'John Doe', email: 'john@example.com' },
        accessToken: 'expired-access-token',
        isAuthenticated: true,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(initialAuth));
    sessionStorage.setItem('profileChecked', 'true');

    // Visit dashboard directly, prompting 4 simultaneous requests to fire
    cy.visit('/dashboard');

    // 3. Assertions and Verifications
    // Wait for the token refresh request to finish
    cy.wait('@tokenRefreshRequest');

    // Assert that the refresh endpoint was hit exactly ONCE
    cy.get('@tokenRefreshRequest.all').should('have.length', 1);

    // Wait for retried calls to resolve successfully
    cy.wait('@nutritionEndpoint');
    cy.wait('@summaryEndpoint');
    cy.wait('@foodsEndpoint');
    cy.wait('@articlesEndpoint');

    // Verify Dashboard page completes loading and renders calorie goal from retried success
    cy.contains('1000').should('exist'); // consumed
    cy.contains('/ 2000').should('exist'); // target
  });
});
