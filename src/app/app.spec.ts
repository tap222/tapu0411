import { describe, it, expect } from 'vitest';
import { App } from './app';

describe('App Component', () => {
  it('should create the app root instance with title', () => {
    const app = new App();
    expect(app).toBeTruthy();
    expect(app.title).toBe('mini-pokedex');
  });
});
