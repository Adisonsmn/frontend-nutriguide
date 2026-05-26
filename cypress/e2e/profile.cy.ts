describe('Profile Setup & Preferences Management', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    sessionStorage.clear();
  });

  it('should successfully complete user onboarding by creating a profile', () => {
    cy.stubLogin();

    // Mock initial state: profile doesn't exist
    cy.intercept('GET', '**/api/profile', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          profile: null,
          preferences: null,
        },
      },
    }).as('getProfileEmpty');

    // Mock profile creation success
    cy.intercept('POST', '**/api/profile', {
      statusCode: 201,
      body: {
        status: 'success',
        message: 'Profile created successfully',
      },
    }).as('createProfile');

    // Mock preference creation success (via PUT upsertPreferences in frontend)
    cy.intercept('PUT', '**/api/profile/preferences', {
      statusCode: 201,
      body: {
        status: 'success',
        message: 'Preferences created successfully',
      },
    }).as('createPreferences');

    cy.visit('/profile');

    cy.wait('@getProfileEmpty');

    // Fill in profile details
    cy.get('#profile-age').type('28');
    cy.get('#profile-weight').type('75');
    cy.get('#profile-height').type('180');
    cy.get('#profile-gender').select('Male');

    // Choose a health goal (e.g. Lose Weight)
    cy.contains('button', 'Lose Weight').click();

    // Choose diet type
    cy.contains('button', 'Vegetarian').click();

    // Type daily budget
    cy.get('#profile-budget').type('50000');

    // Save profile and continue
    cy.contains('button', 'Save & Continue').click();

    cy.wait('@createProfile');
    cy.wait('@createPreferences');

    // Verify success toast/message is displayed
    cy.contains('Profile saved successfully! ✅').should('exist');
  });

  it('should update preferences and call correct endpoints (Bug #19)', () => {
    // Stub standard active login session
    cy.stubLogin();

    // Intercept profile update call
    cy.intercept('PUT', '**/api/profile', {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Profile updated successfully',
      },
    }).as('updateProfile');

    // Intercept preference update call
    // Bug #19: verifies preferences are successfully upserted/modified
    cy.intercept('PUT', '**/api/profile/preferences', {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Preferences saved successfully',
      },
    }).as('upsertPreferences');

    cy.visit('/profile');

    cy.wait('@getProfile');

    // Click "Edit Profile" to enter form mode
    cy.get('#edit-profile-btn').click();

    // Verify current preference values are loaded
    cy.contains('button', 'Vegetarian').should('have.class', 'bg-primary'); // active
    cy.get('#profile-budget').should('have.value', '50');

    // Toggle diet type to Low Carb
    cy.contains('button', 'Low Carb').click();

    // Change budget
    cy.get('#profile-budget').clear().type('75000');

    // Click Save Changes
    cy.contains('button', 'Save Changes').click();

    cy.wait('@updateProfile');
    cy.wait('@upsertPreferences').then((interception) => {
      expect(interception.request.body).to.have.property('diet_type', 'Low Carb');
      expect(interception.request.body).to.have.property('daily_budget', 75000);
    });

    cy.contains('Profile saved successfully! ✅').should('exist');
  });
});
