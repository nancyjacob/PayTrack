/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as clients from "../clients.js";
import type * as crons from "../crons.js";
import type * as emailActions from "../emailActions.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as lib_email from "../lib/email.js";
import type * as payments from "../payments.js";
import type * as permissions from "../permissions.js";
import type * as settings from "../settings.js";
import type * as support from "../support.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  analytics: typeof analytics;
  auth: typeof auth;
  billing: typeof billing;
  clients: typeof clients;
  crons: typeof crons;
  emailActions: typeof emailActions;
  http: typeof http;
  invoices: typeof invoices;
  "lib/email": typeof lib_email;
  payments: typeof payments;
  permissions: typeof permissions;
  settings: typeof settings;
  support: typeof support;
  users: typeof users;
  webhooks: typeof webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
