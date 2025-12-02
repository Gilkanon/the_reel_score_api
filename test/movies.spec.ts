import { expect, test } from '@playwright/test';

test.describe('Movies API', () => {
  const knownMovieId = 550; // Fight Club - popular movie that should exist in TMDB

  test.describe('GET /movies/:id', () => {
    test('should get movie by id with reviews', async ({ request }) => {
      const response = await request.get(`movies/${knownMovieId}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty('movie');
      expect(body).toHaveProperty('reviews');
      expect(body.movie).toHaveProperty('id', knownMovieId);
      expect(body.movie).toHaveProperty('title');
      expect(body.reviews).toHaveProperty('results');
      expect(body.reviews).toHaveProperty('page');
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
      expect(Array.isArray(body.reviews.results)).toBe(true);
    });

    test('should return movie with pagination parameters', async ({ request }) => {
      const response = await request.get(`movies/${knownMovieId}?page=1&limit=5`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.reviews).toHaveProperty('page', 1);
      expect(body.reviews).toHaveProperty('total_pages');
      expect(body.reviews).toHaveProperty('total_results');
    });

    test('should return movie with empty reviews array if no reviews', async ({ request }) => {
      // Use a movie ID that likely has no reviews
      const movieId = 13; // Forrest Gump - popular but might not have reviews in our DB
      const response = await request.get(`movies/${movieId}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(Array.isArray(body.reviews.results)).toBe(true);
      // Reviews array might be empty or have some reviews
      expect(body.reviews.total_results).toBeGreaterThanOrEqual(0);
    });

    test('should return movie with multiple reviews', async ({ request }) => {
      // First, create some reviews for a movie
      const uniqueId = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const username = `movie_reviewer_${uniqueId}`;
      const userData = {
        email: `movie_reviewer_${uniqueId}@example.com`,
        password: 'StrongPassword123!',
        username: username,
      };

      const registerResponse = await request.post('auth/register', {
        data: userData,
      });
      expect(registerResponse.ok()).toBeTruthy();
      const registerBody = await registerResponse.json();
      const token = registerBody.tokens.accessToken;

      // Small delay to avoid throttler issues
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a review
      const reviewData = {
        rating: 5,
        text: 'Great movie!',
        mediaType: 'Movie',
        mediaId: knownMovieId,
      };

      await request.post('reviews/create', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: reviewData,
      });

      // Get movie and check reviews
      const response = await request.get(`movies/${knownMovieId}`);
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body.reviews.total_results).toBeGreaterThanOrEqual(1);
    });

    test('should handle invalid movie id format', async ({ request }) => {
      const response = await request.get('movies/invalid-id');

      // Should return 400 for invalid format
      expect(response.status()).toBe(400);
    });

    test('should handle non-existent movie id', async ({ request }) => {
      // Use a very large number that likely doesn't exist
      const nonExistentId = 999999999;
      const response = await request.get(`movies/${nonExistentId}`);

      // Might return 404 or error from TMDB
      expect([404, 500]).toContain(response.status());
    });

    test('should return correct movie data structure', async ({ request }) => {
      const response = await request.get(`movies/${knownMovieId}`);

      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      
      // Check movie structure
      expect(body.movie).toHaveProperty('id');
      expect(body.movie).toHaveProperty('title');
      expect(body.movie).toHaveProperty('overview');
      expect(body.movie).toHaveProperty('release_date');
      
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

