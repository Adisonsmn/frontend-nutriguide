// Declare Cypress Custom Command types
declare global {
  namespace Cypress {
    interface Chainable {
      stubLogin(email?: string, name?: string): Chainable<void>;
    }
  }
}

// Implement stubLogin custom command
Cypress.Commands.add('stubLogin', (email = 'john@example.com', name = 'John Doe') => {
  // 1. Set the initial persisted auth state in localStorage
  const initialAuth = {
    state: {
      user: {
        user_id: 'USER-001',
        name: name,
        email: email,
        is_active: true,
      },
      isAuthenticated: true,
    },
    version: 0,
  };
  localStorage.setItem('auth-storage', JSON.stringify(initialAuth));

  // Set sessionStorage profileChecked flag to bypass the protected route guard check
  sessionStorage.setItem('profileChecked', 'true');

  // 2. Intercept the silent refresh or profile checks
  cy.intercept('POST', '**/api/auth/refresh-token', {
    statusCode: 200,
    body: {
      status: 'success',
      message: 'Token refreshed',
      data: {
        accessToken: 'mock-access-token',
      },
    },
  }).as('tokenRefresh');

  cy.intercept('GET', '**/api/profile', {
    statusCode: 200,
    body: {
      status: 'success',
      data: {
        profile: {
          profile_id: 'PROF-001',
          user_id: 'USER-001',
          age: 25,
          weight_kg: 70,
          height_cm: 175,
          gender: 'Male',
          goal: 'lose_weight',
        },
        preferences: {
          pref_id: 'PREF-001',
          user_id: 'USER-001',
          diet_type: 'Vegetarian',
          daily_budget: 50,
        },
      },
    },
  }).as('getProfile');

  cy.intercept('GET', '**/api/nutrition/calculate', {
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
  }).as('getNutritionTarget');

  cy.intercept('GET', '**/api/history/summary*', {
    statusCode: 200,
    body: {
      status: 'success',
      data: {
        date: new Date().toISOString().split('T')[0],
        totalCalories: 1500,
        targetCalories: 2000,
        remaining: 500,
        percentage: 75,
        macros: {
          protein: 120,
          carbs: 200,
          fat: 50,
        },
      },
    },
  }).as('getSummary');

  // Intercept notifications check
  cy.intercept('GET', '**/api/notifications', {
    statusCode: 200,
    body: {
      status: 'success',
      data: [],
    },
  }).as('getNotifications');
});
