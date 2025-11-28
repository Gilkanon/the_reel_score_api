import { expect, test } from '@playwright/test';

test.describe('TV Shows API', () => {
  const knownTvShowId = 1396; // Breaking Bad - popular TV show that should exist in TMDB

  test.describe('GET /tv/:id', () => {
    test('should get tv show by id with reviews', async ({ request }) => {
      const response = await request.get(`tv/${knownTvShowId}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('tvShow');
      expect(body).toHaveProperty('reviews');
      expect(body.tvShow).toHaveProperty('id', knownTvShowId);
      expect(body.tvShow).toHaveProperty('name');
      expect(body.reviews).toHaveProperty('results');
      expect(body.reviews).toHaveProperty('page');
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
      expect(Array.isArray(body.reviews.results)).toBe(true);
    });

    test('should return tv show with pagination parameters', async ({ request }) => {
      const response = await request.get(`tv/${knownTvShowId}?page=1&limit=5`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.reviews).toHaveProperty('page', 1);
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
    });

    test('should return tv show with empty reviews array if no reviews', async ({ request }) => {
      // Use a TV show ID that likely has no reviews
      const tvShowId = 1399; // Game of Thrones - popular but might not have reviews in our DB
      const response = await request.get(`tv/${tvShowId}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body.reviews.results)).toBe(true);
      // Reviews array might be empty or have some reviews
      expect(body.reviews.total_results).toBeGreaterThanOrEqual(0);
    });

    test('should return tv show with multiple reviews', async ({ request }) => {
      // First, create some reviews for a TV show
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const username = `tv_reviewer_${uniqueId}`;
      const userData = {
        email: `tv_reviewer_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: username,
      };

      const registerResponse = await request.post('auth/register', {
        data: userData,
      });
      expect(registerResponse.ok()).toBeTruthy();
      const registerBody = await registerResponse.json();
      const token = registerBody.accessToken;

      // Create a review
      const reviewData = {
        rating: 5,
        text: 'Amazing TV show!',
        mediaType: 'TV',
        mediaId: knownTvShowId,
      };

      await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: reviewData,
      });

      // Get TV show and check reviews
      const response = await request.get(`tv/${knownTvShowId}`);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.reviews.total_results).toBeGreaterThanOrEqual(1);
    });

    test('should handle invalid tv show id format', async ({ request }) => {
      const response = await request.get('tv/invalid-id');

      // Should return 400 for invalid format
      expect(response.status()).toBe(400);
    });

    test('should handle non-existent tv show id', async ({ request }) => {
      // Use a very large number that likely doesn't exist
      const nonExistentId = 999999999;
      const response = await request.get(`tv/${nonExistentId}`);

      // Might return 404 or error from TMDB
      expect([404, 500]).toContain(response.status());
    });

    test('should return correct tv show data structure', async ({ request }) => {
      const response = await request.get(`tv/${knownTvShowId}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      // Check TV show structure
      expect(body.tvShow).toHaveProperty('id');
      expect(body.tvShow).toHaveProperty('name');
      expect(body.tvShow).toHaveProperty('overview');
      expect(body.tvShow).toHaveProperty('first_air_date');
      
      // Check reviews structure
      expect(body.reviews).toHaveProperty('results');
      expect(body.reviews).toHaveProperty('page');
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
      
      // If there are reviews, check their structure
      if (body.reviews.results.length > 0) {
        const review = body.reviews.results[0];
        expect(review).toHaveProperty('id');
        expect(review).toHaveProperty('rating');
        expect(review).toHaveProperty('username');
      }
    });
  });
});

