import { vi, beforeEach } from 'vitest';

// Mock the SupportedBrowserChecker to always return true in tests
vi.mock('../src/client/SupportedBrowserChecker', () => ({
  SupportedBrowserChecker: {
    isSupported: () => true
  }
}));

// Set up a clean global environment for each test
beforeEach(() => {
  // Reset any global state if needed
  if (typeof window !== 'undefined') {
    delete (window as any).cdApi;
    delete (window as any).bcClient;
  }
});