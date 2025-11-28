import { test, expect } from '@playwright/test';

test.describe('API: /media/trending', () => {
  test('GET /media/trending - should return an object that includes a list of trending movies and list of trending tv shows', async ({
    request,
  }) => {
    const response = await request.get('/media/trending');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('movies');
    expect(data.movies).toHaveProperty('results');
    expect(Array.isArray(data.movies.results)).toBe(true);

    expect(data).toHaveProperty('tvShows');
    expect(data.tvShows).toHaveProperty('results');
    expect(Array.isArray(data.tvShows.results)).toBe(true);

    if (data.movies.results.length > 0) {
      const firstMovie = data.movies.results[0];
      expect(firstMovie).toHaveProperty('id');
      expect(firstMovie).toHaveProperty('title');
      expect(firstMovie).toHaveProperty('poster_path');
    }
  });
});

test.describe('API: /media/search', () => {
  test('GET /media/search - should return search results for movies and tv shows', async ({
    request,
  }) => {
    const response = await request.get('/media/search?query=matrix');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('movies');
    expect(data).toHaveProperty('tvShows');
    expect(data.movies).toHaveProperty('results');
    expect(data.tvShows).toHaveProperty('results');
    expect(Array.isArray(data.movies.results)).toBe(true);
    expect(Array.isArray(data.tvShows.results)).toBe(true);
  });

  test('should return search results with pagination', async ({ request }) => {
    const response = await request.get('/media/search?query=matrix&page=1');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.movies).toHaveProperty('page', 1);
    expect(data.movies).toHaveProperty('total_pages');
    expect(data.tvShows).toHaveProperty('page', 1);
    expect(data.tvShows).toHaveProperty('total_pages');
  });

  test('should return correct structure for movie results', async ({ request }) => {
    const response = await request.get('/media/search?query=inception');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.movies.results.length > 0) {
      const firstMovie = data.movies.results[0];
      expect(firstMovie).toHaveProperty('id');
      expect(firstMovie).toHaveProperty('title');
      expect(firstMovie).toHaveProperty('overview');
    }
  });

  test('should return correct structure for tv show results', async ({ request }) => {
    const response = await request.get('/media/search?query=breaking');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.tvShows.results.length > 0) {
      const firstTvShow = data.tvShows.results[0];
      expect(firstTvShow).toHaveProperty('id');
      expect(firstTvShow).toHaveProperty('name');
      expect(firstTvShow).toHaveProperty('overview');
    }
  });

  test('should handle empty query parameter', async ({ request }) => {
    const response = await request.get('/media/search?query=');
    
    // Might return 400 for validation or empty results
    // Check if it's a validation error or empty results
    if (response.status() === 400) {
      expect(response.status()).toBe(400);
    } else {
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data).toHaveProperty('movies');
      expect(data).toHaveProperty('tvShows');
    }
  });

  test('should handle missing query parameter', async ({ request }) => {
    const response = await request.get('/media/search');
    
    // Should return 400 for missing required parameter or handle gracefully
    expect([400, 200]).toContain(response.status());
  });

  test('should return empty results for non-existent search', async ({ request }) => {
    const uniqueQuery = `nonexistent_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const response = await request.get(`/media/search?query=${uniqueQuery}`);
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.movies.results.length).toBe(0);
    expect(data.tvShows.results.length).toBe(0);
  });

  test('should handle different page numbers', async ({ request }) => {
    const response = await request.get('/media/search?query=matrix&page=2');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.movies).toHaveProperty('page', 2);
    expect(data.tvShows).toHaveProperty('page', 2);
  });

  test('should handle special characters in query', async ({ request }) => {
    const response = await request.get('/media/search?query=the%20matrix');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('movies');
    expect(data).toHaveProperty('tvShows');
  });
});