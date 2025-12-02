import { expect, test } from '@playwright/test';

// Helper function to add delays between requests to respect throttler limits
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test.describe('Reviews API', () => {
  let userToken: string;
  let secondUserToken: string;
  let createdReviewId: string;
  let testMediaId: number;
  let testUsername: string;
  let secondTestUsername: string;

  test.beforeAll(async ({ request }) => {
    // Create first test user
    // Note: Auth throttler limit is 3 requests per 60 seconds
    const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    testUsername = `review_user_${uniqueId}`;
    const userData = {
      email: `review_user_${uniqueId}@example.com`,
      password: 'StrongPassword123!',
      username: testUsername,
    };

    const registerResponse = await request.post('auth/register', {
      data: userData,
    });
    expect(registerResponse.ok()).toBeTruthy();
    const registerBody = await registerResponse.json();
    userToken = registerBody.tokens.accessToken;

    // Wait to respect auth throttler limit (3 requests per 60 seconds)
    await delay(25000); // Wait 25 seconds between auth requests

    // Create second test user
    const secondUniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    secondTestUsername = `review_user2_${secondUniqueId}`;
    const secondUserData = {
      email: `review_user2_${secondUniqueId}@example.com`,
      password: 'StrongPassword123!',
      username: secondTestUsername,
    };

    const secondRegisterResponse = await request.post('auth/register', {
      data: secondUserData,
    });
    expect(secondRegisterResponse.ok()).toBeTruthy();
    const secondRegisterBody = await secondRegisterResponse.json();
    secondUserToken = secondRegisterBody.tokens.accessToken;

    // Use known TMDB movie ID for tests (e.g., popular movie)
    testMediaId = 550; // Fight Club
  });

  test.describe('POST /reviews/create', () => {
    test('should create a review with rating and text', async ({ request }) => {
      const reviewData = {
        rating: 5,
        text: 'Excellent movie! Highly recommended.',
        mediaType: 'Movie',
        mediaId: testMediaId,
      };

      const response = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('media');
      expect(body).toHaveProperty('review');
      expect(body.review).toHaveProperty('id');
      expect(body.review).toHaveProperty('rating', 5);
      expect(body.review).toHaveProperty(
        'text',
        'Excellent movie! Highly recommended.',
      );
      expect(body.review).toHaveProperty('username', testUsername);
      expect(body.media).toHaveProperty('id', testMediaId);
      expect(body.media).toHaveProperty('type', 'Movie');

      createdReviewId = body.review.id;
    });

    test('should create a review with only rating (no text)', async ({
      request,
    }) => {
      const reviewData = {
        rating: 4,
        mediaType: 'Movie',
        mediaId: testMediaId + 1, // Use different ID
      };

      const response = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.review).toHaveProperty('rating', 4);
      // Text can be null or undefined if not provided
      expect(
        body.review.text === null || body.review.text === undefined,
      ).toBeTruthy();
    });

    test('should create a review for TV show', async ({ request }) => {
      const reviewData = {
        rating: 5,
        text: 'Great TV show!',
        mediaType: 'TV',
        mediaId: 1396, // Breaking Bad
      };

      const response = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.media).toHaveProperty('type', 'TV');
      expect(body.review).toHaveProperty('rating', 5);
    });

    test('should return 401 without authentication token', async ({
      request,
    }) => {
      const reviewData = {
        rating: 5,
        text: 'Test review',
        mediaType: 'Movie',
        mediaId: testMediaId,
      };

      const response = await request.post('reviews/create', {
        data: reviewData,
      });

      expect(response.status()).toBe(401);
    });

    test('should return validation error for invalid rating (too high)', async ({
      request,
    }) => {
      const reviewData = {
        rating: 6, // Invalid: max is 5
        text: 'Test review',
        mediaType: 'Movie',
        mediaId: testMediaId,
      };

      const response = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      expect(response.status()).toBe(400);
    });

    test('should return validation error for invalid rating (too low)', async ({
      request,
    }) => {
      const reviewData = {
        rating: 0, // Invalid: min is 1
        text: 'Test review',
        mediaType: 'Movie',
        mediaId: testMediaId,
      };

      const response = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      expect(response.status()).toBe(400);
    });

    test('should return validation error for missing required fields', async ({
      request,
    }) => {
      const reviewData = {
        text: 'Test review',
        // Missing rating and mediaType
      };

      const response = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      expect(response.status()).toBe(400);
    });

    test('should prevent duplicate review for same media', async ({
      request,
    }) => {
      const reviewData = {
        rating: 5,
        text: 'First review',
        mediaType: 'Movie',
        mediaId: testMediaId + 100, // Use unique ID
      };

      // Create first review
      const firstResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });
      expect(firstResponse.ok()).toBeTruthy();

      // Small delay to avoid throttler issues
      await delay(500);

      // Try to create second review for the same media
      const secondResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: reviewData,
      });

      // Should return 400 for duplicate review
      expect(secondResponse.status()).toBe(400);
    });
  });

  test.describe('PATCH /reviews/:id', () => {
    test('should update own review rating', async ({ request }) => {
      // First create a review
      const createData = {
        rating: 3,
        text: 'Initial review',
        mediaType: 'Movie',
        mediaId: testMediaId + 200,
      };

      const createResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: createData,
      });
      expect(createResponse.ok()).toBeTruthy();
      const createBody = await createResponse.json();
      const reviewId = createBody.review.id;

      // Small delay to avoid throttler issues
      await delay(500);

      // Update rating
      const updateResponse = await request.patch(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          rating: 5,
        },
      });

      expect(updateResponse.ok()).toBeTruthy();
      const updateBody = await updateResponse.json();
      expect(updateBody).toHaveProperty('rating', 5);
      expect(updateBody).toHaveProperty('text', 'Initial review');
    });

    test('should update own review text', async ({ request }) => {
      const createData = {
        rating: 4,
        text: 'Initial text',
        mediaType: 'Movie',
        mediaId: testMediaId + 300,
      };

      const createResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: createData,
      });
      expect(createResponse.ok()).toBeTruthy();
      const createBody = await createResponse.json();
      const reviewId = createBody.review.id;

      // Small delay to avoid throttler issues
      await delay(500);

      const updateResponse = await request.patch(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          text: 'Updated text',
        },
      });

      expect(updateResponse.ok()).toBeTruthy();
      const updateBody = await updateResponse.json();
      expect(updateBody).toHaveProperty('text', 'Updated text');
      expect(updateBody).toHaveProperty('rating', 4);
    });

    test('should update both rating and text', async ({ request }) => {
      const createData = {
        rating: 2,
        text: 'Old text',
        mediaType: 'Movie',
        mediaId: testMediaId + 400,
      };

      const createResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: createData,
      });
      expect(createResponse.ok()).toBeTruthy();
      const createBody = await createResponse.json();
      const reviewId = createBody.review.id;

      // Small delay to avoid throttler issues
      await delay(500);

      const updateResponse = await request.patch(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          rating: 5,
          text: 'New text',
        },
      });

      expect(updateResponse.ok()).toBeTruthy();
      const updateBody = await updateResponse.json();
      expect(updateBody).toHaveProperty('rating', 5);
      expect(updateBody).toHaveProperty('text', 'New text');
    });

    test('should return 401 without authentication token', async ({
      request,
    }) => {
      const response = await request.patch(`reviews/${createdReviewId}`, {
        data: {
          rating: 5,
        },
      });

      expect(response.status()).toBe(401);
    });

    test('should return 403 when trying to update another user review', async ({
      request,
    }) => {
      // Create review from first user
      const createData = {
        rating: 3,
        text: 'First user review',
        mediaType: 'Movie',
        mediaId: testMediaId + 500,
      };

      const createResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: createData,
      });
      expect(createResponse.ok()).toBeTruthy();
      const createBody = await createResponse.json();
      const reviewId = createBody.review.id;

      // Small delay to avoid throttler issues
      await delay(500);

      // Try to update review from second user
      const updateResponse = await request.patch(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${secondUserToken}`,
        },
        data: {
          rating: 5,
        },
      });

      expect(updateResponse.status()).toBe(403);
    });

    test('should return 404 for non-existent review', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.patch(`reviews/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          rating: 5,
        },
      });

      expect(response.status()).toBe(404);
    });

    test('should return validation error for invalid rating', async ({
      request,
    }) => {
      if (!createdReviewId) {
        test.skip();
      }

      const response = await request.patch(`reviews/${createdReviewId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          rating: 10, // Invalid
        },
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('DELETE /reviews/:id', () => {
    test('should delete own review', async ({ request }) => {
      // Create review to delete
      const createData = {
        rating: 3,
        text: 'Review to delete',
        mediaType: 'Movie',
        mediaId: testMediaId + 150,
      };

      const createResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: createData,
      });
      expect(createResponse.ok()).toBeTruthy();
      const createBody = await createResponse.json();
      const reviewId = createBody.review.id;

      // Small delay to avoid throttler issues
      await delay(500);

      // Delete review
      const deleteResponse = await request.delete(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(deleteResponse.ok()).toBeTruthy();

      // Small delay to avoid throttler issues
      await delay(500);

      // Verify that review is actually deleted
      const getResponse = await request.patch(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: {
          rating: 5,
        },
      });

      expect(getResponse.status()).toBe(404);
    });

    test('should return 401 without authentication token', async ({
      request,
    }) => {
      if (!createdReviewId) {
        test.skip();
      }

      const response = await request.delete(`reviews/${createdReviewId}`);

      expect(response.status()).toBe(401);
    });

    test('should return 403 when trying to delete another user review', async ({
      request,
    }) => {
      // Create review from first user
      const createData = {
        rating: 3,
        text: 'First user review',
        mediaType: 'Movie',
        mediaId: testMediaId + 700,
      };

      const createResponse = await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
        data: createData,
      });
      expect(createResponse.ok()).toBeTruthy();
      const createBody = await createResponse.json();
      const reviewId = createBody.review.id;

      // Small delay to avoid throttler issues
      await delay(500);

      // Try to delete review from second user
      const deleteResponse = await request.delete(`reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${secondUserToken}`,
        },
      });

      expect(deleteResponse.status()).toBe(403);
    });

    test('should return 404 for non-existent review', async ({ request }) => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.delete(`reviews/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.status()).toBe(404);
    });
  });
});
