/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes: string[] = [];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /
 * @type {string[]}
 */
export const authRoutes: string[] = ["/auth/signin", "/auth/signup"];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication process
 * @type {string}
 */
export const apiAuthPrefix: string = "/api/auth";

/**
 * The default redirect path after logged in
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT: string = "/";
