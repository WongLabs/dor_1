import { describe, it, expect } from 'vitest';
import { router } from './index';

describe('Routes Configuration', () => {
  it('should export a router object', () => {
    expect(router).toBeDefined();
    expect(typeof router).toBe('object');
  });

  it('should have routes property', () => {
    expect(router.routes).toBeDefined();
    expect(Array.isArray(router.routes)).toBe(true);
  });

  it('should contain route definitions', () => {
    const routes = router.routes;
    expect(routes.length).toBeGreaterThan(0);
  });

  it('should have root path route', () => {
    const rootRoute = router.routes.find((route: any) => route.path === '/');
    expect(rootRoute).toBeDefined();
  });

  it('should have login route', () => {
    const loginRoute = router.routes.find((route: any) => route.path === '/login');
    expect(loginRoute).toBeDefined();
  });
}); 