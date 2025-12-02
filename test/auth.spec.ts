import { expect, test } from '@playwright/test';

// Helper function to add delays between requests to respect throttler limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test.describe('User Profile Lifecycle', () => {
  test('Lifecycle: Register -> Update profile username -> Delete profile', async ({
    request,
  }) => {
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userData = {
      email: `test_user_${uniqueId}@example.com`,
      password: 'StrongPassword123!',
      username: `test_user_${uniqueId}`,
    };

    const registerResponse = await request.post('auth/register', {
      data: userData,
    });

    expect(registerResponse.ok()).toBeTruthy();

    const registerBody = await registerResponse.json();
    expect(registerBody).toHaveProperty('tokens');
    expect(registerBody.tokens).toHaveProperty('accessToken');

    const headers = registerResponse.headers();
    expect(headers['set-cookie']).toBeDefined();
    expect(headers['set-cookie']).toContain('refreshToken');

    const accessToken = registerBody.tokens.accessToken;

    // Wait to respect auth throttler limit (3 requests per 60 seconds)
    await delay(25000);

    const logoutResponse = await request.post('auth/logout');

    expect(logoutResponse.ok()).toBeTruthy();
    const logoutHeaders = logoutResponse.headers();
    expect(logoutHeaders['set-cookie']).toBeDefined();

    // Wait to respect auth throttler limit
    await delay(25000);

    const loginResponse = await request.post('auth/login', {
      data: {
        username: userData.username,
        password: userData.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const loginBody = await loginResponse.json();
    expect(loginBody).toHaveProperty('accessToken');

    // Wait to respect auth throttler limit
    await delay(25000);

    const refreshResponse = await request.post('auth/refresh', {
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`,
      },
    });

    expect(refreshResponse.ok()).toBeTruthy();

    const refreshBody = await refreshResponse.json();
    expect(refreshBody).toHaveProperty('accessToken');

    const newUsername = `updated_test_user_${uniqueId}`;
    const updateUserResponse = await request.patch('users/me', {
      headers: {
        Authorization: `Bearer ${loginBody.accessToken}`,
      },
      data: {
        username: newUsername,
      },
    });

    expect(updateUserResponse.ok()).toBeTruthy();

    const updateBody = await updateUserResponse.json();
    expect(updateBody).toHaveProperty('username', newUsername);

    // Wait to respect auth throttler limit
    await delay(25000);

    const newUsernameLoginResponse = await request.post('auth/login', {
      data: {
        username: newUsername,
        password: userData.password,
      },
    });

    expect(newUsernameLoginResponse.ok()).toBeTruthy();

    const newUsernameLoginBody = await newUsernameLoginResponse.json();
    expect(newUsernameLoginBody).toHaveProperty('accessToken');

    const newUsernameHeaders = registerResponse.headers();
    expect(newUsernameHeaders['set-cookie']).toBeDefined();
    expect(newUsernameHeaders['set-cookie']).toContain('refreshToken');

    const deleteResponse = await request.delete('users/me', {
      headers: {
        Authorization: `Bearer ${newUsernameLoginBody.accessToken}`,
      },
    });

    if (!deleteResponse.ok()) {
      console.log('Status Code:', deleteResponse.status());
      console.log('Error Body:', await deleteResponse.text());
    }

    expect(deleteResponse.ok()).toBeTruthy();

    const deleteBody = await deleteResponse.json();
    expect(deleteBody).toHaveProperty('message');
  });
});
