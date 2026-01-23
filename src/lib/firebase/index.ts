// Re-export everything from firebase modules
export * from './collections';
export * from './schema';
export * from './helpers';

// Re-export Firebase instances
export { db, auth, app, googleProvider } from '../firebase';
