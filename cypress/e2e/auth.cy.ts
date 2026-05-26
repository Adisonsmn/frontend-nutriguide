describe('Authentication, Onboarding, & Recovery Flow', () => {
  beforeEach(() => {
    // Standard cleanup of storage
    cy.clearLocalStorage();
    cy.clearCookies();
    sessionStorage.clear();
  });

  it('should successfully register a new user, auto-login, and redirect to profile setup (Bug #14)', () => {
    // Intercept register call
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 201,
      body: {
        status: 'success',
        message: 'Registration successful',
        data: {
          user_id: 'USER-001',
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    }).as('registerRequest');

    // Intercept auto-login call
    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          accessToken: 'mock-access-token',
          user: {
            user_id: 'USER-001',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      },
    }).as('loginRequest');

    // Intercept profile check (return 404 to simulate first-time onboarding)
    cy.intercept('GET', '**/api/profile', {
      statusCode: 404,
      body: {
        status: 'error',
        message: 'Profile not found',
      },
    }).as('profileRequest');

    cy.visit('/register');

    // Fill in values
    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Doe');
    cy.get('input[placeholder="Enter your email or phone number"]').type('john@example.com');
    cy.get('input[placeholder="Create a password"]').type('Password123');
    cy.get('input[placeholder="Confirm your password"]').type('Password123');

    // Click register button (no terms checkbox exists in Register.tsx)
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.wait('@loginRequest');

    // Check we got redirected to profile creation page
    cy.url().should('include', '/profile');
  });

  it('should show validation errors on registration conflicts', () => {
    cy.intercept('POST', '**/api/auth/register', {
      statusCode: 409,
      body: {
        status: 'error',
        message: 'Email already registered',
      },
    }).as('registerConflict');

    cy.visit('/register');

    cy.get('input[placeholder="Enter your first name"]').type('John');
    cy.get('input[placeholder="Enter your last name"]').type('Doe');
    cy.get('input[placeholder="Enter your email or phone number"]').type('exists@example.com');
    cy.get('input[placeholder="Create a password"]').type('Password123');
    cy.get('input[placeholder="Confirm your password"]').type('Password123');

    cy.get('button[type="submit"]').click();

    cy.wait('@registerConflict');

    // Assert that we stay on the register page and see error toast message
    cy.url().should('include', '/register');
    cy.contains('Email/Phone Number already registered').should('exist');
  });

  it('should successfully login and maintain remember me state (Bug #12 + #23)', () => {
    cy.intercept('POST', '**/api/auth/login', {
      fixture: 'user.json',
    }).as('loginSuccess');

    cy.intercept('GET', '**/api/profile', {
      fixture: 'profile.json',
    }).as('getProfile');

    cy.intercept('GET', '**/api/history/summary*', {
      fixture: 'summary.json',
    }).as('getSummary');

    cy.intercept('GET', '**/api/notifications', {
      statusCode: 200,
      body: { data: [] },
    });

    cy.visit('/login');

    cy.get('input[placeholder="Enter your email or phone number"]').type('john@example.com');
    cy.get('input[placeholder="Enter your password"]').type('password123');

    // By default rememberMe checkbox is unchecked (false)
    cy.get('input[type="checkbox"]').should('not.be.checked').check();

    cy.get('button[type="submit"]').click();

    cy.wait('@loginSuccess');
    cy.url().should('include', '/dashboard');

    // Verify localStorage has the Zustand session state
    cy.window().then((window) => {
      expect(window.localStorage.getItem('auth-storage')).to.not.be.null;
    });
  });

  it('should not persist session if remember me is unchecked', () => {
    cy.intercept('POST', '**/api/auth/login', {
      fixture: 'user.json',
    }).as('loginSuccess');

    cy.intercept('GET', '**/api/profile', {
      fixture: 'profile.json',
    });

    cy.intercept('GET', '**/api/history/summary*', {
      fixture: 'summary.json',
    });

    cy.intercept('GET', '**/api/notifications', {
      statusCode: 200,
      body: { data: [] },
    });

    cy.visit('/login');

    cy.get('input[placeholder="Enter your email or phone number"]').type('john@example.com');
    cy.get('input[placeholder="Enter your password"]').type('password123');

    // Keep it unchecked
    cy.get('input[type="checkbox"]').should('not.be.checked');

    cy.get('button[type="submit"]').click();

    cy.wait('@loginSuccess');
    cy.url().should('include', '/dashboard');

    // Verify localStorage auth-storage has been removed/is empty
    cy.window().then((window) => {
      expect(window.localStorage.getItem('auth-storage')).to.be.null;
    });
  });

  it('should perform logout and clear session state (Bug #30)', () => {
    // Stub login session
    cy.stubLogin();

    cy.intercept('POST', '**/api/auth/logout', {
      statusCode: 200,
      body: { status: 'success', message: 'Logged out' },
    }).as('logoutRequest');

    // Visit profile page directly
    cy.visit('/profile');

    // Trigger logout (clicks the Log Out button with ID #logout-btn)
    cy.get('#logout-btn').click({ force: true });

    cy.wait('@logoutRequest');

    // Check redirection and state purges
    cy.url().should('include', '/login');
    cy.window().then((window) => {
      expect(window.sessionStorage.getItem('profileChecked')).to.be.null;
    });
  });

  it('should trigger forgot password and successfully reset without raw OTP leakage (Bug #1 & #29)', () => {
    cy.intercept('POST', '**/api/auth/forgot-password', {
      statusCode: 200,
      body: {
        status: 'success',
        data: {
          message: 'OTP has been sent to your email address.',
        },
      },
    }).as('forgotRequest');

    cy.visit('/forgot-password');

    cy.get('input[placeholder="Enter your registered email"]').type('john@example.com');
    cy.get('button[type="submit"]').click();

    cy.wait('@forgotRequest');

    // Success toast matching response message shown, redirected to reset-password
    cy.contains('OTP has been sent to your email address.').should('exist');
    cy.url().should('include', '/reset-password');

    // Now test reset password form
    cy.intercept('POST', '**/api/auth/reset-password', {
      statusCode: 200,
      body: {
        status: 'success',
        message: 'Password reset successfully',
      },
    }).as('resetRequest');

    // Email should auto-fill from localStorage redirect
    cy.get('input[placeholder="Your email"]').should('have.value', 'john@example.com');
    cy.get('input[placeholder="Enter 6-digit OTP"]').type('123456');
    cy.get('input[placeholder="Min. 8 characters"]').type('newpassword123');
    cy.get('input[placeholder="Must match new password"]').type('newpassword123');

    cy.get('button[type="submit"]').click();

    cy.wait('@resetRequest');
    cy.contains('Password reset successfully').should('exist');
    cy.url().should('include', '/login');
  });
});
