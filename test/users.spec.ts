import { expect, test } from '@playwright/test';

test.describe('Users API', () => {
  let regularUserToken: string;
  let adminUserToken: string;
  let regularUsername: string;
  let adminUsername: string;

  test.beforeAll(async ({ request }) => {
    // Use admin user from seed.ts
    // Username: 'admin', Password: 'adminPassword'
    adminUsername = 'admin';
    const adminLoginResponse = await request.post('auth/login', {
      data: {
        username: 'admin',
        password: 'adminPassword',
      },
    });
    expect(adminLoginResponse.ok()).toBeTruthy();
    const adminLoginBody = await adminLoginResponse.json();
    adminUserToken = adminLoginBody.accessToken;

    // Use regular user from seed.ts
    // Username: 'user', Password: 'userPassword'
    regularUsername = 'user';
    const userLoginResponse = await request.post('auth/login', {
      data: {
        username: 'user',
        password: 'userPassword',
      },
    });
    expect(userLoginResponse.ok()).toBeTruthy();
    const userLoginBody = await userLoginResponse.json();
    regularUserToken = userLoginBody.accessToken;
  });

  test.describe('GET /users/:username', () => {
    test('should get user by username with reviews', async ({ request }) => {
      // Use seed user which has a review
      const response = await request.get(`users/${regularUsername}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('reviews');
      expect(body.user).toHaveProperty('username', regularUsername);
      expect(body.user).toHaveProperty('email');
      expect(body.reviews).toHaveProperty('results');
      expect(body.reviews).toHaveProperty('page');
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
      expect(Array.isArray(body.reviews.results)).toBe(true);
      // Seed user has at least one review
      expect(body.reviews.total_results).toBeGreaterThanOrEqual(1);
    });

    test('should get user with pagination parameters', async ({ request }) => {
      const response = await request.get(`users/${regularUsername}?page=1&limit=5`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.reviews).toHaveProperty('page', 1);
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
    });

    test('should return 404 for non-existent username', async ({ request }) => {
      const fakeUsername = `nonexistent_${Date.now()}`;
      const response = await request.get(`users/${fakeUsername}`);

      expect(response.status()).toBe(404);
    });

    test('should return user with empty reviews array if no reviews', async ({ request }) => {
      // Create a new user without reviews
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const newUsername = `newuser_${uniqueId}`;
      const userData = {
        email: `newuser_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: newUsername,
      };

      await request.post('auth/register', { data: userData });

      const response = await request.get(`users/${newUsername}`);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body.reviews.results)).toBe(true);
      expect(body.reviews.results.length).toBe(0);
    });
  });

  test.describe('PATCH /users/:username (Admin only)', () => {
    test('should return 401 without authentication token', async ({ request }) => {
      const response = await request.patch(`users/${regularUsername}`, {
        data: {
          username: 'updated_username',
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 403 when regular user tries to update another user', async ({ request }) => {
      // Create another user
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const targetUsername = `target_${uniqueId}`;
      const targetUserData = {
        email: `target_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: targetUsername,
      };

      await request.post('auth/register', { data: targetUserData });

      // Try to update as regular user
      const response = await request.patch(`users/${targetUsername}`, {
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
        },
        data: {
          username: 'updated_username',
        },
      });

      expect(response.status()).toBe(403);
    });

    test('should update user when admin is authenticated', async ({ request }) => {
      // Create a test user to update
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const targetUsername = `target_update_${uniqueId}`;
      const targetUserData = {
        email: `target_update_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: targetUsername,
      };

      await request.post('auth/register', { data: targetUserData });

      const newUsername = `updated_${Date.now()}`;

      const response = await request.patch(`users/${targetUsername}`, {
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
        },
        data: {
          username: newUsername,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('username', newUsername);
    });

    test('should validate update data', async ({ request }) => {
      // Create a test user to update
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const targetUsername = `target_validate_${uniqueId}`;
      const targetUserData = {
        email: `target_validate_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: targetUsername,
      };

      await request.post('auth/register', { data: targetUserData });

      const response = await request.patch(`users/${targetUsername}`, {
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
        },
        data: {
          email: 'invalid-email', // Invalid email format
        },
      });

      // Should return 400 for invalid data
      expect(response.status()).toBe(400);
    });
  });

  test.describe('DELETE /users/:username (Admin only)', () => {
    test('should return 401 without authentication token', async ({ request }) => {
      const response = await request.delete(`users/${regularUsername}`);

      expect(response.status()).toBe(401);
    });

    test('should return 403 when regular user tries to delete another user', async ({ request }) => {
      // Create another user
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const targetUsername = `target_delete_${uniqueId}`;
      const targetUserData = {
        email: `target_delete_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: targetUsername,
      };

      await request.post('auth/register', { data: targetUserData });

      // Try to delete as regular user
      const response = await request.delete(`users/${targetUsername}`, {
        headers: {
          Authorization: `Bearer ${regularUserToken}`,
        },
      });

      expect(response.status()).toBe(403);
    });

    test('should delete user when admin is authenticated', async ({ request }) => {
      // Create a user to delete
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const userToDelete = `delete_me_${uniqueId}`;
      const userData = {
        email: `delete_me_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: userToDelete,
      };

      await request.post('auth/register', { data: userData });

      const response = await request.delete(`users/${userToDelete}`, {
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
        },
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('message');

      // Verify user is deleted
      const getResponse = await request.get(`users/${userToDelete}`);
      expect(getResponse.status()).toBe(404);
    });

    test('should return 404 for non-existent user', async ({ request }) => {
      const fakeUsername = `nonexistent_${Date.now()}`;

      const response = await request.delete(`users/${fakeUsername}`, {
        headers: {
          Authorization: `Bearer ${adminUserToken}`,
        },
      });

      expect(response.status()).toBe(404);
    });
  });
});

