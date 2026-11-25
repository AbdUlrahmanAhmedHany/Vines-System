(() => {
  // node_modules/@supabase/supabase-js/dist/tracingRegistry.mjs
  var EXTRACTOR_KEY = /* @__PURE__ */ Symbol.for("@supabase/supabase-js.traceContextExtractor");
  function getTraceContextExtractor() {
    return globalThis[EXTRACTOR_KEY];
  }

  // node_modules/tslib/tslib.es6.mjs
  function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
          t[p[i]] = s[p[i]];
      }
    return t;
  }
  function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  }

  // node_modules/@supabase/functions-js/dist/module/helper.js
  var resolveFetch = (customFetch) => {
    if (customFetch) {
      return (...args) => customFetch(...args);
    }
    return (...args) => fetch(...args);
  };

  // node_modules/@supabase/functions-js/dist/module/types.js
  var FunctionsError = class extends Error {
    constructor(message, name = "FunctionsError", context) {
      super(message);
      this.name = name;
      this.context = context;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        context: this.context
      };
    }
  };
  var FunctionsFetchError = class extends FunctionsError {
    constructor(context) {
      super("Failed to send a request to the Edge Function", "FunctionsFetchError", context);
    }
  };
  var FunctionsRelayError = class extends FunctionsError {
    constructor(context) {
      super("Relay Error invoking the Edge Function", "FunctionsRelayError", context);
    }
  };
  var FunctionsHttpError = class extends FunctionsError {
    constructor(context) {
      super("Edge Function returned a non-2xx status code", "FunctionsHttpError", context);
    }
  };
  var FunctionRegion;
  (function(FunctionRegion2) {
    FunctionRegion2["Any"] = "any";
    FunctionRegion2["ApNortheast1"] = "ap-northeast-1";
    FunctionRegion2["ApNortheast2"] = "ap-northeast-2";
    FunctionRegion2["ApSouth1"] = "ap-south-1";
    FunctionRegion2["ApSoutheast1"] = "ap-southeast-1";
    FunctionRegion2["ApSoutheast2"] = "ap-southeast-2";
    FunctionRegion2["CaCentral1"] = "ca-central-1";
    FunctionRegion2["EuCentral1"] = "eu-central-1";
    FunctionRegion2["EuWest1"] = "eu-west-1";
    FunctionRegion2["EuWest2"] = "eu-west-2";
    FunctionRegion2["EuWest3"] = "eu-west-3";
    FunctionRegion2["SaEast1"] = "sa-east-1";
    FunctionRegion2["UsEast1"] = "us-east-1";
    FunctionRegion2["UsWest1"] = "us-west-1";
    FunctionRegion2["UsWest2"] = "us-west-2";
  })(FunctionRegion || (FunctionRegion = {}));

  // node_modules/@supabase/functions-js/dist/module/FunctionsClient.js
  var FunctionsClient = class {
    /**
     * Creates a new Functions client bound to an Edge Functions URL.
     *
     * @example Using supabase-js (recommended)
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
     * const { data, error } = await supabase.functions.invoke('hello-world')
     * ```
     *
     * @category Edge Functions
     *
     * @example Standalone import for bundle-sensitive environments
     * ```ts
     * import { FunctionsClient, FunctionRegion } from '@supabase/functions-js'
     *
     * const functions = new FunctionsClient('https://xyzcompany.supabase.co/functions/v1', {
     *   headers: { apikey: 'your-publishable-key' },
     *   region: FunctionRegion.UsEast1,
     * })
     * ```
     */
    constructor(url, { headers = {}, customFetch, region = FunctionRegion.Any } = {}) {
      this.url = url;
      this.headers = headers;
      this.region = region;
      this.fetch = resolveFetch(customFetch);
    }
    /**
     * Updates the authorization header
     * @param token - the new jwt token sent in the authorisation header
     *
     * @category Edge Functions
     *
     * @example Setting the authorization header
     * ```ts
     * functions.setAuth(session.access_token)
     * ```
     */
    setAuth(token) {
      this.headers.Authorization = `Bearer ${token}`;
    }
    /**
     * Invokes a function
     * @param functionName - The name of the Function to invoke.
     * @param options - Options for invoking the Function.
     * @example
     * ```ts
     * const { data, error } = await functions.invoke('hello-world', {
     *   body: { name: 'Ada' },
     * })
     * ```
     *
     * @category Edge Functions
     *
     * @remarks
     * - The API key is sent in the `apikey` header. The `Authorization` header is reserved
     *   for the signed-in user's JWT (or a custom auth token) — when there is no session, a
     *   new-format API key (`sb_publishable_…` / `sb_secret_…`) is not sent as a Bearer token.
     * - Invoke params generally match the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) spec.
     * - When you pass in a body to your function, we automatically attach the Content-Type header for `Blob`, `ArrayBuffer`, `File`, `FormData` and `String`. If it doesn't match any of these types we assume the payload is `json`, serialize it and attach the `Content-Type` header as `application/json`. You can override this behavior by passing in a `Content-Type` header of your own.
     * - Responses are automatically parsed as `json`, `blob` and `form-data` depending on the `Content-Type` header sent by your function. Responses are parsed as `text` by default.
     *
     * @example Basic invocation
     * ```js
     * const { data, error } = await supabase.functions.invoke('hello', {
     *   body: { foo: 'bar' }
     * })
     * ```
     *
     * @exampleDescription Error handling
     * A `FunctionsHttpError` error is returned if your function throws an error, `FunctionsRelayError` if the Supabase Relay has an error processing your function and `FunctionsFetchError` if there is a network error in calling your function. Log the full error object so fields like `name`, `context`, and any structured body aren't hidden.
     *
     * @example Error handling
     * ```js
     * import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from "@supabase/supabase-js";
     *
     * const { data, error } = await supabase.functions.invoke('hello', {
     *   headers: {
     *     "my-custom-header": 'my-custom-header-value'
     *   },
     *   body: { foo: 'bar' }
     * })
     *
     * if (error instanceof FunctionsHttpError) {
     *   const errorMessage = await error.context.json()
     *   console.error('Function returned an error', errorMessage)
     * } else if (error instanceof FunctionsRelayError) {
     *   console.error('Relay error:', error)
     * } else if (error instanceof FunctionsFetchError) {
     *   console.error('Fetch error:', error)
     * }
     * ```
     *
     * @exampleDescription Passing custom headers
     * You can pass custom headers to your function. Note: supabase-js automatically passes the `Authorization` header with the signed in user's JWT.
     *
     * @example Passing custom headers
     * ```js
     * const { data, error } = await supabase.functions.invoke('hello', {
     *   headers: {
     *     "my-custom-header": 'my-custom-header-value'
     *   },
     *   body: { foo: 'bar' }
     * })
     * ```
     *
     * @exampleDescription Calling with DELETE HTTP verb
     * You can also set the HTTP verb to `DELETE` when calling your Edge Function.
     *
     * @example Calling with DELETE HTTP verb
     * ```js
     * const { data, error } = await supabase.functions.invoke('hello', {
     *   headers: {
     *     "my-custom-header": 'my-custom-header-value'
     *   },
     *   body: { foo: 'bar' },
     *   method: 'DELETE'
     * })
     * ```
     *
     * @exampleDescription Invoking a Function in the UsEast1 region
     * Here are the available regions:
     * - `FunctionRegion.Any`
     * - `FunctionRegion.ApNortheast1`
     * - `FunctionRegion.ApNortheast2`
     * - `FunctionRegion.ApSouth1`
     * - `FunctionRegion.ApSoutheast1`
     * - `FunctionRegion.ApSoutheast2`
     * - `FunctionRegion.CaCentral1`
     * - `FunctionRegion.EuCentral1`
     * - `FunctionRegion.EuWest1`
     * - `FunctionRegion.EuWest2`
     * - `FunctionRegion.EuWest3`
     * - `FunctionRegion.SaEast1`
     * - `FunctionRegion.UsEast1`
     * - `FunctionRegion.UsWest1`
     * - `FunctionRegion.UsWest2`
     *
     * @example Invoking a Function in the UsEast1 region
     * ```js
     * import { createClient, FunctionRegion } from '@supabase/supabase-js'
     *
     * const { data, error } = await supabase.functions.invoke('hello', {
     *   body: { foo: 'bar' },
     *   region: FunctionRegion.UsEast1
     * })
     * ```
     *
     * @exampleDescription Calling with GET HTTP verb
     * You can also set the HTTP verb to `GET` when calling your Edge Function.
     *
     * @example Calling with GET HTTP verb
     * ```js
     * const { data, error } = await supabase.functions.invoke('hello', {
     *   headers: {
     *     "my-custom-header": 'my-custom-header-value'
     *   },
     *   method: 'GET'
     * })
     * ```
     *
     * @example Standalone client invoke
     * ```ts
     * const { data, error } = await functions.invoke('hello-world', {
     *   body: { name: 'Ada' },
     * })
     * ```
     */
    invoke(functionName_1) {
      return __awaiter(this, arguments, void 0, function* (functionName, options2 = {}) {
        var _a, _b;
        let timeoutId;
        let timeoutController;
        let onAbort;
        try {
          const { headers, method, body: functionArgs, signal, timeout } = options2;
          let _headers = {};
          let { region } = options2;
          if (!region) {
            region = this.region;
          }
          const url = new URL(`${this.url}/${functionName}`);
          if (region && region !== "any") {
            _headers["x-region"] = region;
            url.searchParams.set("forceFunctionRegion", region);
          }
          let body;
          const hasContentTypeHeader = !!headers && Object.keys(headers).some((key) => key.toLowerCase() === "content-type");
          if (functionArgs && !hasContentTypeHeader) {
            if (typeof Blob !== "undefined" && functionArgs instanceof Blob || functionArgs instanceof ArrayBuffer) {
              _headers["Content-Type"] = functionArgs.type || "application/octet-stream";
              body = functionArgs;
            } else if (typeof functionArgs === "string") {
              _headers["Content-Type"] = "text/plain";
              body = functionArgs;
            } else if (typeof FormData !== "undefined" && functionArgs instanceof FormData) {
              body = functionArgs;
            } else {
              _headers["Content-Type"] = "application/json";
              body = JSON.stringify(functionArgs);
            }
          } else {
            if (functionArgs && typeof functionArgs !== "string" && !(typeof Blob !== "undefined" && functionArgs instanceof Blob) && !(functionArgs instanceof ArrayBuffer) && !(typeof FormData !== "undefined" && functionArgs instanceof FormData)) {
              body = JSON.stringify(functionArgs);
            } else {
              body = functionArgs;
            }
          }
          let effectiveSignal = signal;
          if (timeout) {
            timeoutController = new AbortController();
            timeoutId = setTimeout(() => timeoutController.abort(), timeout);
            if (signal) {
              effectiveSignal = timeoutController.signal;
              onAbort = () => timeoutController.abort();
              signal.addEventListener("abort", onAbort);
            } else {
              effectiveSignal = timeoutController.signal;
            }
          }
          const response = yield this.fetch(url.toString(), {
            method: method || "POST",
            // headers priority is (high to low):
            // 1. invoke-level headers
            // 2. client-level headers
            // 3. default Content-Type header
            headers: Object.assign(Object.assign(Object.assign({}, _headers), this.headers), headers),
            body,
            signal: effectiveSignal
          }).catch((fetchError) => {
            throw new FunctionsFetchError(fetchError);
          });
          const isRelayError = response.headers.get("x-relay-error");
          if (isRelayError && isRelayError === "true") {
            throw new FunctionsRelayError(response);
          }
          if (!response.ok) {
            throw new FunctionsHttpError(response);
          }
          let responseType = ((_a = response.headers.get("Content-Type")) !== null && _a !== void 0 ? _a : "text/plain").split(";")[0].trim().toLowerCase();
          let data;
          if (responseType === "application/json") {
            data = yield response.json();
          } else if (responseType === "application/octet-stream" || responseType === "application/pdf") {
            data = yield response.blob();
          } else if (responseType === "text/event-stream") {
            data = response;
          } else if (responseType === "multipart/form-data") {
            data = yield response.formData();
          } else {
            data = yield response.text();
          }
          return { data, error: null, response };
        } catch (error) {
          return {
            data: null,
            error,
            response: error instanceof FunctionsHttpError || error instanceof FunctionsRelayError ? error.context : void 0
          };
        } finally {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          if (onAbort) {
            (_b = options2.signal) === null || _b === void 0 ? void 0 : _b.removeEventListener("abort", onAbort);
          }
        }
      });
    }
  };

  // node_modules/@supabase/postgrest-js/dist/index.mjs
  var PostgrestError = class extends Error {
    /**
    * @example
    * ```ts
    * import PostgrestError from '@supabase/postgrest-js'
    *
    * throw new PostgrestError({
    *   message: 'Row level security prevented the request',
    *   details: 'RLS denied the insert',
    *   hint: 'Check your policies',
    *   code: 'PGRST301',
    * })
    * ```
    */
    constructor(context) {
      super(context.message);
      this.name = "PostgrestError";
      this.details = context.details;
      this.hint = context.hint;
      this.code = context.code;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        details: this.details,
        hint: this.hint,
        code: this.code
      };
    }
  };
  var DEFAULT_MAX_RETRIES = 3;
  var getRetryDelay = (attemptIndex) => Math.min(1e3 * 2 ** attemptIndex, 3e4);
  var RETRYABLE_STATUS_CODES = [520, 503];
  var RETRYABLE_METHODS = [
    "GET",
    "HEAD",
    "OPTIONS"
  ];
  function _typeof(o) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof(o);
  }
  function toPrimitive(t, r) {
    if ("object" != _typeof(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey(t) {
    var i = toPrimitive(t, "string");
    return "symbol" == _typeof(i) ? i : i + "";
  }
  function _defineProperty(e, r, t) {
    return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), true).forEach(function(r$1) {
        _defineProperty(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  function sleep(ms, signal) {
    return new Promise((resolve) => {
      if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
        resolve();
        return;
      }
      const id = setTimeout(() => {
        signal === null || signal === void 0 || signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      function onAbort() {
        clearTimeout(id);
        resolve();
      }
      signal === null || signal === void 0 || signal.addEventListener("abort", onAbort);
    });
  }
  function shouldRetry(method, status, attemptCount, retryEnabled) {
    if (!retryEnabled || attemptCount >= DEFAULT_MAX_RETRIES) return false;
    if (!RETRYABLE_METHODS.includes(method)) return false;
    if (!RETRYABLE_STATUS_CODES.includes(status)) return false;
    return true;
  }
  async function fetchWithRetry(fetchImpl, url, request, retryEnabled) {
    let attemptCount = 0;
    while (true) {
      const headers = _objectSpread2({}, request.headers);
      if (attemptCount > 0) headers["X-Retry-Count"] = String(attemptCount);
      let res;
      try {
        res = await fetchImpl(url, {
          method: request.method,
          headers,
          body: request.body,
          signal: request.signal
        });
      } catch (fetchError) {
        var _request$signal;
        if ((fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) === "AbortError" || (fetchError === null || fetchError === void 0 ? void 0 : fetchError.code) === "ABORT_ERR" || (fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) === "TimeoutError" && ((_request$signal = request.signal) === null || _request$signal === void 0 ? void 0 : _request$signal.aborted)) throw fetchError;
        if (!RETRYABLE_METHODS.includes(request.method)) throw fetchError;
        if (retryEnabled && attemptCount < DEFAULT_MAX_RETRIES) {
          const delay = getRetryDelay(attemptCount);
          attemptCount++;
          await sleep(delay, request.signal);
          continue;
        }
        throw fetchError;
      }
      if (shouldRetry(request.method, res.status, attemptCount, retryEnabled)) {
        var _res$headers$get, _res$headers;
        const retryAfterHeader = (_res$headers$get = (_res$headers = res.headers) === null || _res$headers === void 0 ? void 0 : _res$headers.get("Retry-After")) !== null && _res$headers$get !== void 0 ? _res$headers$get : null;
        const delay = retryAfterHeader !== null ? Math.max(0, parseInt(retryAfterHeader, 10) || 0) * 1e3 : getRetryDelay(attemptCount);
        await res.text();
        attemptCount++;
        await sleep(delay, request.signal);
        continue;
      }
      return res;
    }
  }
  var PostgrestBuilder = class {
    /**
    * Creates a builder configured for a specific PostgREST request.
    *
    * @example Using supabase-js (recommended)
    * ```ts
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * const { data, error } = await supabase.from('users').select('*')
    * ```
    *
    * @category Database
    *
    * @example Standalone import for bundle-sensitive environments
    * ```ts
    * import { PostgrestQueryBuilder } from '@supabase/postgrest-js'
    *
    * const builder = new PostgrestQueryBuilder(
    *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
    *   { headers: new Headers({ apikey: 'your-publishable-key' }) }
    * )
    * ```
    */
    constructor(builder) {
      var _builder$shouldThrowO, _builder$isMaybeSingl, _builder$shouldStripN, _builder$urlLengthLim, _builder$retry;
      this.shouldThrowOnError = false;
      this.retryEnabled = true;
      this.method = builder.method;
      this.url = builder.url;
      this.headers = new Headers(builder.headers);
      this.schema = builder.schema;
      this.body = builder.body;
      this.shouldThrowOnError = (_builder$shouldThrowO = builder.shouldThrowOnError) !== null && _builder$shouldThrowO !== void 0 ? _builder$shouldThrowO : false;
      this.signal = builder.signal;
      this.isMaybeSingle = (_builder$isMaybeSingl = builder.isMaybeSingle) !== null && _builder$isMaybeSingl !== void 0 ? _builder$isMaybeSingl : false;
      this.shouldStripNulls = (_builder$shouldStripN = builder.shouldStripNulls) !== null && _builder$shouldStripN !== void 0 ? _builder$shouldStripN : false;
      this.urlLengthLimit = (_builder$urlLengthLim = builder.urlLengthLimit) !== null && _builder$urlLengthLim !== void 0 ? _builder$urlLengthLim : 8e3;
      this.retryEnabled = (_builder$retry = builder.retry) !== null && _builder$retry !== void 0 ? _builder$retry : true;
      if (builder.fetch) this.fetch = builder.fetch;
      else this.fetch = fetch;
    }
    /**
    * If there's an error with the query, throwOnError will reject the promise by
    * throwing the error instead of returning it as part of a successful response.
    *
    * {@link https://github.com/supabase/supabase-js/issues/92}
    *
    * @category Database
    * @subcategory Using modifiers
    */
    throwOnError() {
      this.shouldThrowOnError = true;
      return this;
    }
    /**
    * Strip null values from the response data. Properties with `null` values
    * will be omitted from the returned JSON objects.
    *
    * Requires PostgREST 11.2.0+.
    *
    * {@link https://docs.postgrest.org/en/stable/references/api/resource_representation.html#stripped-nulls}
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .stripNulls()
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text, bio text);
    *
    * insert into
    *   characters (id, name, bio)
    * values
    *   (1, 'Luke', null),
    *   (2, 'Leia', 'Princess of Alderaan');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Luke"
    *     },
    *     {
    *       "id": 2,
    *       "name": "Leia",
    *       "bio": "Princess of Alderaan"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    stripNulls() {
      if (this.headers.get("Accept") === "text/csv") throw new Error("stripNulls() cannot be used with csv()");
      this.shouldStripNulls = true;
      return this;
    }
    /**
    * Set an HTTP header on this single PostgREST request, overriding any header
    * with the same name set on the client.
    *
    * This is an advanced escape hatch for one-off needs (passing a custom
    * `Authorization` for a single query, attaching a tracing header, etc.).
    * Most callers do not need it: configure client-wide headers via the
    * `headers` option when constructing the client, and authentication via
    * Supabase Auth.
    *
    * @param name - HTTP header name
    * @param value - HTTP header value
    *
    * @category Database
    * @subcategory Using modifiers
    */
    setHeader(name, value) {
      this.headers = new Headers(this.headers);
      this.headers.set(name, value);
      return this;
    }
    /**
    * @category Database
    * @subcategory Using modifiers
    *
    * Configure retry behavior for this request.
    *
    * By default, retries are enabled for idempotent requests (GET, HEAD, OPTIONS)
    * that fail with network errors or specific HTTP status codes (503, 520).
    * Retries use exponential backoff (1s, 2s, 4s) with a maximum of 3 attempts.
    *
    * @param enabled - Whether to enable retries for this request
    *
    * @example
    * ```ts
    * // Disable retries for a specific query
    * const { data, error } = await supabase
    *   .from('users')
    *   .select()
    *   .retry(false)
    * ```
    */
    retry(enabled) {
      this.retryEnabled = enabled;
      return this;
    }
    then(onfulfilled, onrejected) {
      var _this = this;
      if (this.schema === void 0) {
      } else if (["GET", "HEAD"].includes(this.method)) this.headers.set("Accept-Profile", this.schema);
      else this.headers.set("Content-Profile", this.schema);
      if (this.method !== "GET" && this.method !== "HEAD") this.headers.set("Content-Type", "application/json");
      if (this.shouldStripNulls) {
        const currentAccept = this.headers.get("Accept");
        if (currentAccept === "application/vnd.pgrst.object+json") this.headers.set("Accept", "application/vnd.pgrst.object+json;nulls=stripped");
        else if (!currentAccept || currentAccept === "application/json") this.headers.set("Accept", "application/vnd.pgrst.array+json;nulls=stripped");
      }
      const _fetch = this.fetch;
      const executeWithRetry = async () => {
        const headers = {};
        _this.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const res$1 = await fetchWithRetry(_fetch, _this.url.toString(), {
          method: _this.method,
          headers,
          body: JSON.stringify(_this.body, (_, value) => typeof value === "bigint" ? value.toString() : value),
          signal: _this.signal
        }, _this.retryEnabled);
        return await _this.processResponse(res$1);
      };
      let res = executeWithRetry();
      if (!this.shouldThrowOnError) res = res.catch((fetchError) => {
        var _fetchError$name2;
        let errorDetails = "";
        let hint = "";
        let code = "";
        const cause = fetchError === null || fetchError === void 0 ? void 0 : fetchError.cause;
        if (cause) {
          var _cause$message, _cause$code, _fetchError$name, _cause$name;
          const causeMessage = (_cause$message = cause === null || cause === void 0 ? void 0 : cause.message) !== null && _cause$message !== void 0 ? _cause$message : "";
          const causeCode = (_cause$code = cause === null || cause === void 0 ? void 0 : cause.code) !== null && _cause$code !== void 0 ? _cause$code : "";
          errorDetails = `${(_fetchError$name = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _fetchError$name !== void 0 ? _fetchError$name : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`;
          errorDetails += `

Caused by: ${(_cause$name = cause === null || cause === void 0 ? void 0 : cause.name) !== null && _cause$name !== void 0 ? _cause$name : "Error"}: ${causeMessage}`;
          if (causeCode) errorDetails += ` (${causeCode})`;
          if (cause === null || cause === void 0 ? void 0 : cause.stack) errorDetails += `
${cause.stack}`;
        } else {
          var _fetchError$stack;
          errorDetails = (_fetchError$stack = fetchError === null || fetchError === void 0 ? void 0 : fetchError.stack) !== null && _fetchError$stack !== void 0 ? _fetchError$stack : "";
        }
        const urlLength = this.url.toString().length;
        if ((fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) === "AbortError" || (fetchError === null || fetchError === void 0 ? void 0 : fetchError.code) === "ABORT_ERR") {
          code = "";
          hint = "Request was aborted (timeout or manual cancellation)";
          if (urlLength > this.urlLengthLimit) hint += `. Note: Your request URL is ${urlLength} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`;
        } else if ((cause === null || cause === void 0 ? void 0 : cause.name) === "HeadersOverflowError" || (cause === null || cause === void 0 ? void 0 : cause.code) === "UND_ERR_HEADERS_OVERFLOW") {
          code = "";
          hint = "HTTP headers exceeded server limits (typically 16KB)";
          if (urlLength > this.urlLengthLimit) hint += `. Your request URL is ${urlLength} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`;
        }
        return {
          success: false,
          error: {
            message: `${(_fetchError$name2 = fetchError === null || fetchError === void 0 ? void 0 : fetchError.name) !== null && _fetchError$name2 !== void 0 ? _fetchError$name2 : "FetchError"}: ${fetchError === null || fetchError === void 0 ? void 0 : fetchError.message}`,
            details: errorDetails,
            hint,
            code
          },
          data: null,
          count: null,
          status: 0,
          statusText: ""
        };
      });
      return res.then(onfulfilled, onrejected);
    }
    /**
    * Process a fetch response and return the standardized postgrest response.
    */
    async processResponse(res) {
      var _this2 = this;
      let error = null;
      let data = null;
      let count = null;
      let status = res.status;
      let statusText = res.statusText;
      if (res.ok) {
        var _this$headers$get2, _res$headers$get;
        if (_this2.method !== "HEAD") {
          var _this$headers$get;
          const body = await res.text();
          if (body === "") {
          } else if (_this2.headers.get("Accept") === "text/csv") data = body;
          else if (_this2.headers.get("Accept") && ((_this$headers$get = _this2.headers.get("Accept")) === null || _this$headers$get === void 0 ? void 0 : _this$headers$get.includes("application/vnd.pgrst.plan+text"))) data = body;
          else try {
            data = JSON.parse(body);
          } catch (_unused) {
            error = { message: body };
            data = null;
            if (_this2.shouldThrowOnError) throw new PostgrestError({
              message: body,
              details: "",
              hint: "",
              code: ""
            });
          }
        }
        const countHeader = (_this$headers$get2 = _this2.headers.get("Prefer")) === null || _this$headers$get2 === void 0 ? void 0 : _this$headers$get2.match(/count=(exact|planned|estimated)/);
        const contentRange = (_res$headers$get = res.headers.get("content-range")) === null || _res$headers$get === void 0 ? void 0 : _res$headers$get.split("/");
        if (countHeader && contentRange && contentRange.length > 1) count = parseInt(contentRange[1]);
        if (_this2.isMaybeSingle && Array.isArray(data)) if (data.length > 1) {
          error = {
            code: "PGRST116",
            details: `Results contain ${data.length} rows, application/vnd.pgrst.object+json requires 1 row`,
            hint: null,
            message: "JSON object requested, multiple (or no) rows returned"
          };
          data = null;
          count = null;
          status = 406;
          statusText = "Not Acceptable";
          if (_this2.shouldThrowOnError) {
            var _error$hint;
            throw new PostgrestError(_objectSpread2(_objectSpread2({}, error), {}, { hint: (_error$hint = error.hint) !== null && _error$hint !== void 0 ? _error$hint : "" }));
          }
        } else if (data.length === 1) data = data[0];
        else data = null;
      } else {
        const body = await res.text();
        try {
          error = JSON.parse(body);
          if (Array.isArray(error) && res.status === 404) {
            data = [];
            error = null;
            status = 200;
            statusText = "OK";
          }
        } catch (_unused2) {
          if (res.status === 404 && body === "") {
            status = 204;
            statusText = "No Content";
          } else error = { message: body };
        }
        if (error && _this2.shouldThrowOnError) throw new PostgrestError(error);
      }
      return {
        success: error === null,
        error,
        data,
        count,
        status,
        statusText
      };
    }
    /**
    * Override the type of the returned `data`.
    *
    * @typeParam NewResult - The new result type to override with
    * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
    *
    * @category Database
    * @subcategory Using modifiers
    */
    returns() {
      return this;
    }
    /**
    * Override the type of the returned `data` field in the response.
    *
    * @typeParam NewResult - The new type to cast the response data to
    * @typeParam Options - Optional type configuration (defaults to { merge: true })
    * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
    * @example
    * ```typescript
    * // Merge with existing types (default behavior)
    * const query = supabase
    *   .from('users')
    *   .select()
    *   .overrideTypes<{ custom_field: string }>()
    *
    * // Replace existing types completely
    * const replaceQuery = supabase
    *   .from('users')
    *   .select()
    *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
    * ```
    * @returns A PostgrestBuilder instance with the new type
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example Complete Override type of successful response
    * ```ts
    * const { data } = await supabase
    *   .from('countries')
    *   .select()
    *   .overrideTypes<Array<MyType>, { merge: false }>()
    * ```
    *
    * @exampleResponse Complete Override type of successful response
    * ```ts
    * let x: typeof data // MyType[]
    * ```
    *
    * @example Complete Override type of object response
    * ```ts
    * const { data } = await supabase
    *   .from('countries')
    *   .select()
    *   .maybeSingle()
    *   .overrideTypes<MyType, { merge: false }>()
    * ```
    *
    * @exampleResponse Complete Override type of object response
    * ```ts
    * let x: typeof data // MyType | null
    * ```
    *
    * @example Partial Override type of successful response
    * ```ts
    * const { data } = await supabase
    *   .from('countries')
    *   .select()
    *   .overrideTypes<Array<{ status: "A" | "B" }>>()
    * ```
    *
    * @exampleResponse Partial Override type of successful response
    * ```ts
    * let x: typeof data // Array<CountryRowProperties & { status: "A" | "B" }>
    * ```
    *
    * @example Partial Override type of object response
    * ```ts
    * const { data } = await supabase
    *   .from('countries')
    *   .select()
    *   .maybeSingle()
    *   .overrideTypes<{ status: "A" | "B" }>()
    * ```
    *
    * @exampleResponse Partial Override type of object response
    * ```ts
    * let x: typeof data // CountryRowProperties & { status: "A" | "B" } | null
    * ```
    *
    * @example Merge vs replace existing types
    * ```typescript
    * // Merge with existing types (default behavior)
    * const query = supabase
    *   .from('users')
    *   .select()
    *   .overrideTypes<{ custom_field: string }>()
    *
    * // Replace existing types completely
    * const replaceQuery = supabase
    *   .from('users')
    *   .select()
    *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
    * ```
    */
    overrideTypes() {
      return this;
    }
  };
  var PostgrestTransformBuilder = class extends PostgrestBuilder {
    throwOnError() {
      return super.throwOnError();
    }
    /**
    * Perform a SELECT on the query result.
    *
    * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
    * return modified rows. By calling this method, modified rows are returned in
    * `data`.
    *
    * @param columns - The columns to retrieve, separated by commas
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `upsert()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .upsert({ id: 1, name: 'Han Solo' })
    *   .select()
    * ```
    *
    * @exampleSql With `upsert()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Han');
    * ```
    *
    * @exampleResponse With `upsert()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Han Solo"
    *     }
    *   ],
    *   "status": 201,
    *   "statusText": ""
    * }
    * ```
    */
    select(columns) {
      let quoted = false;
      const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
        if (/\s/.test(c) && !quoted) return "";
        if (c === '"') quoted = !quoted;
        return c;
      }).join("");
      this.url.searchParams.set("select", cleanedColumns);
      this.headers.append("Prefer", "return=representation");
      return this;
    }
    /**
    * Order the query result by `column`.
    *
    * You can call this method multiple times to order by multiple columns.
    *
    * You can order referenced tables, but it only affects the ordering of the
    * parent table if you use `!inner` in the query.
    *
    * @param column - The column to order by
    * @param options - Named parameters
    * @param options.ascending - If `true`, the result will be in ascending order
    * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
    * `null`s appear last.
    * @param options.referencedTable - Set this to order a referenced table by
    * its columns
    * @param options.foreignTable - Deprecated, use `options.referencedTable`
    * instead
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('id, name')
    *   .order('id', { ascending: false })
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 3,
    *       "name": "Han"
    *     },
    *     {
    *       "id": 2,
    *       "name": "Leia"
    *     },
    *     {
    *       "id": 1,
    *       "name": "Luke"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription On a referenced table
    * Ordering with `referencedTable` doesn't affect the ordering of the
    * parent table.
    *
    * @example On a referenced table
    * ```ts
    *   const { data, error } = await supabase
    *     .from('orchestral_sections')
    *     .select(`
    *       name,
    *       instruments (
    *         name
    *       )
    *     `)
    *     .order('name', { referencedTable: 'instruments', ascending: false })
    *
    * ```
    *
    * @exampleSql On a referenced table
    * ```sql
    * create table
    *   orchestral_sections (id int8 primary key, name text);
    * create table
    *   instruments (
    *     id int8 primary key,
    *     section_id int8 not null references orchestral_sections,
    *     name text
    *   );
    *
    * insert into
    *   orchestral_sections (id, name)
    * values
    *   (1, 'strings'),
    *   (2, 'woodwinds');
    * insert into
    *   instruments (id, section_id, name)
    * values
    *   (1, 1, 'harp'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse On a referenced table
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "strings",
    *       "instruments": [
    *         {
    *           "name": "violin"
    *         },
    *         {
    *           "name": "harp"
    *         }
    *       ]
    *     },
    *     {
    *       "name": "woodwinds",
    *       "instruments": []
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Order parent table by a referenced table
    * Ordering with `referenced_table(col)` affects the ordering of the
    * parent table.
    *
    * @example Order parent table by a referenced table
    * ```ts
    *   const { data, error } = await supabase
    *     .from('instruments')
    *     .select(`
    *       name,
    *       section:orchestral_sections (
    *         name
    *       )
    *     `)
    *     .order('section(name)', { ascending: true })
    *
    * ```
    *
    * @exampleSql Order parent table by a referenced table
    * ```sql
    * create table
    *   orchestral_sections (id int8 primary key, name text);
    * create table
    *   instruments (
    *     id int8 primary key,
    *     section_id int8 not null references orchestral_sections,
    *     name text
    *   );
    *
    * insert into
    *   orchestral_sections (id, name)
    * values
    *   (1, 'strings'),
    *   (2, 'woodwinds');
    * insert into
    *   instruments (id, section_id, name)
    * values
    *   (1, 2, 'flute'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse Order parent table by a referenced table
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "violin",
    *       "orchestral_sections": {"name": "strings"}
    *     },
    *     {
    *       "name": "flute",
    *       "orchestral_sections": {"name": "woodwinds"}
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    order(column, { ascending = true, nullsFirst, foreignTable, referencedTable = foreignTable } = {}) {
      const key = referencedTable ? `${referencedTable}.order` : "order";
      const existingOrder = this.url.searchParams.get(key);
      this.url.searchParams.set(key, `${existingOrder ? `${existingOrder},` : ""}${column}.${ascending ? "asc" : "desc"}${nullsFirst === void 0 ? "" : nullsFirst ? ".nullsfirst" : ".nullslast"}`);
      return this;
    }
    /**
    * Limit the query result by `rows`.
    *
    * @param rows - The maximum number of rows to return
    * @param options - Named parameters
    * @param options.referencedTable - Set this to limit rows of referenced
    * tables instead of the parent table
    * @param options.foreignTable - Deprecated, use `options.referencedTable`
    * instead
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('name')
    *   .limit(1)
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "Luke"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @example On a referenced table
    * ```ts
    * const { data, error } = await supabase
    *   .from('orchestral_sections')
    *   .select(`
    *     name,
    *     instruments (
    *       name
    *     )
    *   `)
    *   .limit(1, { referencedTable: 'instruments' })
    * ```
    *
    * @exampleSql On a referenced table
    * ```sql
    * create table
    *   orchestral_sections (id int8 primary key, name text);
    * create table
    *   instruments (
    *     id int8 primary key,
    *     section_id int8 not null references orchestral_sections,
    *     name text
    *   );
    *
    * insert into
    *   orchestral_sections (id, name)
    * values
    *   (1, 'strings');
    * insert into
    *   instruments (id, section_id, name)
    * values
    *   (1, 1, 'harp'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse On a referenced table
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "strings",
    *       "instruments": [
    *         {
    *           "name": "violin"
    *         }
    *       ]
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    limit(rows, { foreignTable, referencedTable = foreignTable } = {}) {
      const key = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
      this.url.searchParams.set(key, `${rows}`);
      return this;
    }
    /**
    * Limit the query result by starting at an offset `from` and ending at the offset `to`.
    * Only records within this range are returned.
    * This respects the query order and if there is no order clause the range could behave unexpectedly.
    * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
    * and fourth rows of the query.
    *
    * @param from - The starting index from which to limit the result
    * @param to - The last index to which to limit the result
    * @param options - Named parameters
    * @param options.referencedTable - Set this to limit rows of referenced
    * tables instead of the parent table
    * @param options.foreignTable - Deprecated, use `options.referencedTable`
    * instead
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('name')
    *   .range(0, 1)
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "Luke"
    *     },
    *     {
    *       "name": "Leia"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    range(from, to, { foreignTable, referencedTable = foreignTable } = {}) {
      const keyOffset = typeof referencedTable === "undefined" ? "offset" : `${referencedTable}.offset`;
      const keyLimit = typeof referencedTable === "undefined" ? "limit" : `${referencedTable}.limit`;
      this.url.searchParams.set(keyOffset, `${from}`);
      this.url.searchParams.set(keyLimit, `${to - from + 1}`);
      return this;
    }
    /**
    * Set the AbortSignal for the fetch request.
    *
    * @param signal - The AbortSignal to use for the fetch request
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @remarks
    * You can use this to set a timeout for the request.
    *
    * @exampleDescription Aborting requests in-flight
    * You can use an [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) to abort requests.
    * Note that `status` and `statusText` don't mean anything for aborted requests as the request wasn't fulfilled.
    *
    * @example Aborting requests in-flight
    * ```ts
    * const ac = new AbortController()
    *
    * const { data, error } = await supabase
    *   .from('very_big_table')
    *   .select()
    *   .abortSignal(ac.signal)
    *
    * // Abort the request after 100 ms
    * setTimeout(() => ac.abort(), 100)
    * ```
    *
    * @exampleResponse Aborting requests in-flight
    * ```json
    *   {
    *     "error": {
    *       "message": "AbortError: The user aborted a request.",
    *       "details": "",
    *       "hint": "The request was aborted locally via the provided AbortSignal.",
    *       "code": ""
    *     },
    *     "status": 0,
    *     "statusText": ""
    *   }
    *
    * ```
    *
    * @example Set a timeout
    * ```ts
    * const { data, error } = await supabase
    *   .from('very_big_table')
    *   .select()
    *   .abortSignal(AbortSignal.timeout(1000 /* ms *\/))
    * ```
    *
    * @exampleResponse Set a timeout
    * ```json
    *   {
    *     "error": {
    *       "message": "FetchError: The user aborted a request.",
    *       "details": "",
    *       "hint": "",
    *       "code": ""
    *     },
    *     "status": 0,
    *     "statusText": ""
    *   }
    *
    * ```
    */
    abortSignal(signal) {
      this.signal = signal;
      return this;
    }
    /**
    * Return `data` as a single object instead of an array of objects.
    *
    * Query result must be one row (e.g. using `.limit(1)`), otherwise this
    * returns an error.
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('name')
    *   .limit(1)
    *   .single()
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": {
    *     "name": "Luke"
    *   },
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    single() {
      this.headers.set("Accept", "application/vnd.pgrst.object+json");
      return this;
    }
    /**
    * Return `data` as a single object instead of an array of objects.
    *
    * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
    * this returns an error.
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .eq('name', 'Katniss')
    *   .maybeSingle()
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    maybeSingle() {
      this.isMaybeSingle = true;
      return this;
    }
    /**
    * Return `data` as a string in CSV format.
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @exampleDescription Return data as CSV
    * By default, the data is returned in JSON format, but can also be returned as Comma Separated Values.
    *
    * @example Return data as CSV
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .csv()
    * ```
    *
    * @exampleSql Return data as CSV
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse Return data as CSV
    * ```json
    * {
    *   "data": "id,name\n1,Luke\n2,Leia\n3,Han",
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    csv() {
      this.headers.set("Accept", "text/csv");
      return this;
    }
    /**
    * Return `data` as an object in [GeoJSON](https://geojson.org) format.
    *
    * @category Database
    * @subcategory Using modifiers
    */
    geojson() {
      this.headers.set("Accept", "application/geo+json");
      return this;
    }
    /**
    * Return `data` as the EXPLAIN plan for the query.
    *
    * You need to enable the
    * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
    * setting before using this method.
    *
    * @param options - Named parameters
    *
    * @param options.analyze - If `true`, the query will be executed and the
    * actual run time will be returned
    *
    * @param options.verbose - If `true`, the query identifier will be returned
    * and `data` will include the output columns of the query
    *
    * @param options.settings - If `true`, include information on configuration
    * parameters that affect query planning
    *
    * @param options.buffers - If `true`, include information on buffer usage
    *
    * @param options.wal - If `true`, include information on WAL record generation
    *
    * @param options.format - The format of the output, can be `"text"` (default)
    * or `"json"`
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @exampleDescription Get the execution plan
    * By default, the data is returned in TEXT format, but can also be returned as JSON by using the `format` parameter.
    *
    * @example Get the execution plan
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .explain()
    * ```
    *
    * @exampleSql Get the execution plan
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse Get the execution plan
    * ```js
    * Aggregate  (cost=33.34..33.36 rows=1 width=112)
    *   ->  Limit  (cost=0.00..18.33 rows=1000 width=40)
    *         ->  Seq Scan on characters  (cost=0.00..22.00 rows=1200 width=40)
    * ```
    *
    * @exampleDescription Get the execution plan with analyze and verbose
    * By default, the data is returned in TEXT format, but can also be returned as JSON by using the `format` parameter.
    *
    * @example Get the execution plan with analyze and verbose
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .explain({analyze:true,verbose:true})
    * ```
    *
    * @exampleSql Get the execution plan with analyze and verbose
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse Get the execution plan with analyze and verbose
    * ```js
    * Aggregate  (cost=33.34..33.36 rows=1 width=112) (actual time=0.041..0.041 rows=1 loops=1)
    *   Output: NULL::bigint, count(ROW(characters.id, characters.name)), COALESCE(json_agg(ROW(characters.id, characters.name)), '[]'::json), NULLIF(current_setting('response.headers'::text, true), ''::text), NULLIF(current_setting('response.status'::text, true), ''::text)
    *   ->  Limit  (cost=0.00..18.33 rows=1000 width=40) (actual time=0.005..0.006 rows=3 loops=1)
    *         Output: characters.id, characters.name
    *         ->  Seq Scan on public.characters  (cost=0.00..22.00 rows=1200 width=40) (actual time=0.004..0.005 rows=3 loops=1)
    *               Output: characters.id, characters.name
    * Query Identifier: -4730654291623321173
    * Planning Time: 0.407 ms
    * Execution Time: 0.119 ms
    * ```
    */
    explain({ analyze = false, verbose = false, settings = false, buffers = false, wal = false, format = "text" } = {}) {
      var _this$headers$get;
      const options2 = [
        analyze ? "analyze" : null,
        verbose ? "verbose" : null,
        settings ? "settings" : null,
        buffers ? "buffers" : null,
        wal ? "wal" : null
      ].filter(Boolean).join("|");
      const forMediatype = (_this$headers$get = this.headers.get("Accept")) !== null && _this$headers$get !== void 0 ? _this$headers$get : "application/json";
      this.headers.set("Accept", `application/vnd.pgrst.plan+${format}; for="${forMediatype}"; options=${options2};`);
      if (format === "json") return this;
      else return this;
    }
    /**
    * Dry-run this request: execute the query but discard the changes.
    *
    * Server-side, PostgREST runs the query inside a transaction and rolls it back
    * instead of committing. The response still contains the data that *would* have
    * been returned — `RETURNING` clauses execute and RLS, triggers, and constraints
    * are all evaluated — but no row is actually inserted, updated, or deleted.
    *
    * This affects only the single request it is chained to. The JS caller has no
    * handle on the transaction: supabase-js does not group multiple queries into
    * one transaction. For multi-statement transactional logic, use a database
    * function (`supabase.rpc(...)`).
    *
    * Sets the `Prefer: tx=rollback` header. See PostgREST's docs on transaction
    * preferences for the underlying mechanism.
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @example Validate an insert without persisting
    * ```ts
    * const { data, error } = await supabase
    *   .from('countries')
    *   .insert({ name: 'France' })
    *   .select()
    *   .rollback()
    * // `data` shows what would have been inserted; nothing is saved.
    * ```
    */
    rollback() {
      this.headers.append("Prefer", "tx=rollback");
      return this;
    }
    /**
    * Override the type of the returned `data`.
    *
    * @typeParam NewResult - The new result type to override with
    * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
    *
    * @category Database
    * @subcategory Using modifiers
    *
    * @remarks
    * - Deprecated: use overrideTypes method instead
    *
    * @example Override type of successful response
    * ```ts
    * const { data } = await supabase
    *   .from('countries')
    *   .select()
    *   .returns<Array<MyType>>()
    * ```
    *
    * @exampleResponse Override type of successful response
    * ```js
    * let x: typeof data // MyType[]
    * ```
    *
    * @example Override type of object response
    * ```ts
    * const { data } = await supabase
    *   .from('countries')
    *   .select()
    *   .maybeSingle()
    *   .returns<MyType>()
    * ```
    *
    * @exampleResponse Override type of object response
    * ```js
    * let x: typeof data // MyType | null
    * ```
    */
    returns() {
      return this;
    }
    /**
    * Set the maximum number of rows that can be affected by the query.
    * Only available in PostgREST v13+ and only works with PATCH and DELETE methods.
    *
    * @param rows - The maximum number of rows that can be affected
    *
    * @category Database
    * @subcategory Using modifiers
    */
    maxAffected(rows) {
      this.headers.append("Prefer", "handling=strict");
      this.headers.append("Prefer", `max-affected=${rows}`);
      return this;
    }
  };
  var PostgrestReservedCharsRegexp = /* @__PURE__ */ new RegExp("[,()]");
  var PostgrestFilterBuilder = class extends PostgrestTransformBuilder {
    throwOnError() {
      return super.throwOnError();
    }
    /**
    * Match only rows where `column` is equal to `value`.
    *
    * To check if the value of `column` is NULL, you should use `.is()` instead.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    *
    * @category Database
    * @subcategory Using filters
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .eq('name', 'Leia')
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 2,
    *       "name": "Leia"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    eq(column, value) {
      this.url.searchParams.append(column, `eq.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is not equal to `value`.
    *
    * This filter does not include rows where `column` is `NULL`. To match null
    * values, use `.is(column, null)` instead.
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    *
    * @category Database
    * @subcategory Using filters
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .neq('name', 'Leia')
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Luke"
    *     },
    *     {
    *       "id": 3,
    *       "name": "Han"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    neq(column, value) {
      this.url.searchParams.append(column, `neq.${value}`);
      return this;
    }
    gt(column, value) {
      this.url.searchParams.append(column, `gt.${value}`);
      return this;
    }
    gte(column, value) {
      this.url.searchParams.append(column, `gte.${value}`);
      return this;
    }
    lt(column, value) {
      this.url.searchParams.append(column, `lt.${value}`);
      return this;
    }
    lte(column, value) {
      this.url.searchParams.append(column, `lte.${value}`);
      return this;
    }
    like(column, pattern) {
      this.url.searchParams.append(column, `like.${pattern}`);
      return this;
    }
    likeAllOf(column, patterns) {
      this.url.searchParams.append(column, `like(all).{${patterns.join(",")}}`);
      return this;
    }
    likeAnyOf(column, patterns) {
      this.url.searchParams.append(column, `like(any).{${patterns.join(",")}}`);
      return this;
    }
    ilike(column, pattern) {
      this.url.searchParams.append(column, `ilike.${pattern}`);
      return this;
    }
    ilikeAllOf(column, patterns) {
      this.url.searchParams.append(column, `ilike(all).{${patterns.join(",")}}`);
      return this;
    }
    ilikeAnyOf(column, patterns) {
      this.url.searchParams.append(column, `ilike(any).{${patterns.join(",")}}`);
      return this;
    }
    regexMatch(column, pattern) {
      this.url.searchParams.append(column, `match.${pattern}`);
      return this;
    }
    regexIMatch(column, pattern) {
      this.url.searchParams.append(column, `imatch.${pattern}`);
      return this;
    }
    is(column, value) {
      this.url.searchParams.append(column, `is.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` IS DISTINCT FROM `value`.
    *
    * Unlike `.neq()`, this treats `NULL` as a comparable value. Two `NULL` values
    * are considered equal (not distinct), and comparing `NULL` with any non-NULL
    * value returns true (distinct).
    *
    * @param column - The column to filter on
    * @param value - The value to filter with
    */
    isDistinct(column, value) {
      this.url.searchParams.append(column, `isdistinct.${value}`);
      return this;
    }
    /**
    * Match only rows where `column` is included in the `values` array.
    *
    * @param column - The column to filter on
    * @param values - The values array to filter with
    *
    * @category Database
    * @subcategory Using filters
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    *   .in('name', ['Leia', 'Han'])
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 2,
    *       "name": "Leia"
    *     },
    *     {
    *       "id": 3,
    *       "name": "Han"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    in(column, values) {
      const cleanedValues = Array.from(new Set(values)).map((s) => {
        if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s)) return `"${s}"`;
        else return `${s}`;
      }).join(",");
      this.url.searchParams.append(column, `in.(${cleanedValues})`);
      return this;
    }
    /**
    * Match only rows where `column` is NOT included in the `values` array.
    *
    * @param column - The column to filter on
    * @param values - The values array to filter with
    */
    notIn(column, values) {
      const cleanedValues = Array.from(new Set(values)).map((s) => {
        if (typeof s === "string" && PostgrestReservedCharsRegexp.test(s)) return `"${s}"`;
        else return `${s}`;
      }).join(",");
      this.url.searchParams.append(column, `not.in.(${cleanedValues})`);
      return this;
    }
    contains(column, value) {
      if (typeof value === "string") this.url.searchParams.append(column, `cs.${value}`);
      else if (Array.isArray(value)) this.url.searchParams.append(column, `cs.{${value.join(",")}}`);
      else this.url.searchParams.append(column, `cs.${JSON.stringify(value)}`);
      return this;
    }
    containedBy(column, value) {
      if (typeof value === "string") this.url.searchParams.append(column, `cd.${value}`);
      else if (Array.isArray(value)) this.url.searchParams.append(column, `cd.{${value.join(",")}}`);
      else this.url.searchParams.append(column, `cd.${JSON.stringify(value)}`);
      return this;
    }
    rangeGt(column, range) {
      this.url.searchParams.append(column, `sr.${range}`);
      return this;
    }
    rangeGte(column, range) {
      this.url.searchParams.append(column, `nxl.${range}`);
      return this;
    }
    rangeLt(column, range) {
      this.url.searchParams.append(column, `sl.${range}`);
      return this;
    }
    rangeLte(column, range) {
      this.url.searchParams.append(column, `nxr.${range}`);
      return this;
    }
    rangeAdjacent(column, range) {
      this.url.searchParams.append(column, `adj.${range}`);
      return this;
    }
    overlaps(column, value) {
      if (typeof value === "string") this.url.searchParams.append(column, `ov.${value}`);
      else this.url.searchParams.append(column, `ov.{${value.join(",")}}`);
      return this;
    }
    textSearch(column, query, { config, type } = {}) {
      let typePart = "";
      if (type === "plain") typePart = "pl";
      else if (type === "phrase") typePart = "ph";
      else if (type === "websearch") typePart = "w";
      const configPart = config === void 0 ? "" : `(${config})`;
      this.url.searchParams.append(column, `${typePart}fts${configPart}.${query}`);
      return this;
    }
    match(query) {
      Object.entries(query).filter(([_, value]) => value !== void 0).forEach(([column, value]) => {
        this.url.searchParams.append(column, `eq.${value}`);
      });
      return this;
    }
    /**
    * Match only rows which doesn't satisfy the filter.
    *
    * Unlike most filters, `opearator` and `value` are used as-is and need to
    * follow [PostgREST
    * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
    * to make sure they are properly sanitized.
    *
    * @param column - The column to filter on
    * @param operator - The operator to be negated to filter with, following
    * PostgREST syntax
    * @param value - The value to filter with, following PostgREST syntax
    *
    * @category Database
    * @subcategory Using filters
    *
    * @remarks
    * not() expects you to use the raw PostgREST syntax for the filter values.
    *
    * ```ts
    * .not('id', 'in', '(5,6,7)')  // Use `()` for `in` filter
    * .not('arraycol', 'cs', '{"a","b"}')  // Use `cs` for `contains()`, `{}` for array values
    * ```
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('countries')
    *   .select()
    *   .not('name', 'is', null)
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    *
    * insert into
    *   countries (id, name)
    * values
    *   (1, 'null'),
    *   (2, null);
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    *   {
    *     "data": [
    *       {
    *         "id": 1,
    *         "name": "null"
    *       }
    *     ],
    *     "status": 200,
    *     "statusText": "OK"
    *   }
    *
    * ```
    */
    not(column, operator, value) {
      this.url.searchParams.append(column, `not.${operator}.${value}`);
      return this;
    }
    /**
    * Match only rows which satisfy at least one of the filters.
    *
    * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
    * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
    * to make sure it's properly sanitized.
    *
    * It's currently not possible to do an `.or()` filter across multiple tables.
    *
    * @param filters - The filters to use, following PostgREST syntax
    * @param options - Named parameters
    * @param options.referencedTable - Set this to filter on referenced tables
    * instead of the parent table
    * @param options.foreignTable - Deprecated, use `referencedTable` instead
    *
    * @category Database
    * @subcategory Using filters
    *
    * @remarks
    * or() expects you to use the raw PostgREST syntax for the filter names and values.
    *
    * ```ts
    * .or('id.in.(5,6,7), arraycol.cs.{"a","b"}')  // Use `()` for `in` filter, `{}` for array values and `cs` for `contains()`.
    * .or('id.in.(5,6,7), arraycol.cd.{"a","b"}')  // Use `cd` for `containedBy()`
    * ```
    *
    * @example With `select()`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('name')
    *   .or('id.eq.2,name.eq.Han')
    * ```
    *
    * @exampleSql With `select()`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse With `select()`
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "Leia"
    *     },
    *     {
    *       "name": "Han"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @example Use `or` with `and`
    * ```ts
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('name')
    *   .or('id.gt.3,and(id.eq.1,name.eq.Luke)')
    * ```
    *
    * @exampleSql Use `or` with `and`
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse Use `or` with `and`
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "Luke"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @example Use `or` on referenced tables
    * ```ts
    * const { data, error } = await supabase
    *   .from('orchestral_sections')
    *   .select(`
    *     name,
    *     instruments!inner (
    *       name
    *     )
    *   `)
    *   .or('section_id.eq.1,name.eq.guzheng', { referencedTable: 'instruments' })
    * ```
    *
    * @exampleSql Use `or` on referenced tables
    * ```sql
    * create table
    *   orchestral_sections (id int8 primary key, name text);
    * create table
    *   instruments (
    *     id int8 primary key,
    *     section_id int8 not null references orchestral_sections,
    *     name text
    *   );
    *
    * insert into
    *   orchestral_sections (id, name)
    * values
    *   (1, 'strings'),
    *   (2, 'woodwinds');
    * insert into
    *   instruments (id, section_id, name)
    * values
    *   (1, 2, 'flute'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse Use `or` on referenced tables
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "strings",
    *       "instruments": [
    *         {
    *           "name": "violin"
    *         }
    *       ]
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    or(filters, { foreignTable, referencedTable = foreignTable } = {}) {
      const key = referencedTable ? `${referencedTable}.or` : "or";
      this.url.searchParams.append(key, `(${filters})`);
      return this;
    }
    filter(column, operator, value) {
      this.url.searchParams.append(column, `${operator}.${value}`);
      return this;
    }
  };
  var PostgrestQueryBuilder = class {
    /**
    * Creates a query builder scoped to a Postgres table or view.
    *
    * @category Database
    *
    * @param url - The URL for the query
    * @param options - Named parameters
    * @param options.headers - Custom headers
    * @param options.schema - Postgres schema to use
    * @param options.fetch - Custom fetch implementation
    * @param options.urlLengthLimit - Maximum URL length before warning
    * @param options.retry - Enable automatic retries for transient errors (default: true)
    *
    * @example Using supabase-js (recommended)
    * ```ts
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * const { data, error } = await supabase.from('users').select('*')
    * ```
    *
    * @example Standalone import for bundle-sensitive environments
    * ```ts
    * import { PostgrestQueryBuilder } from '@supabase/postgrest-js'
    *
    * const query = new PostgrestQueryBuilder(
    *   new URL('https://xyzcompany.supabase.co/rest/v1/users'),
    *   { headers: { apikey: 'your-publishable-key' }, retry: true }
    * )
    * ```
    */
    constructor(url, { headers = {}, schema, fetch: fetch$1, urlLengthLimit = 8e3, retry }) {
      this.url = url;
      this.headers = new Headers(headers);
      this.schema = schema;
      this.fetch = fetch$1;
      this.urlLengthLimit = urlLengthLimit;
      this.retry = retry;
    }
    /**
    * Clone URL and headers to prevent shared state between operations.
    */
    cloneRequestState() {
      return {
        url: new URL(this.url.toString()),
        headers: new Headers(this.headers)
      };
    }
    /**
    * Perform a SELECT query on the table or view.
    *
    * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
    *
    * @param options - Named parameters
    *
    * @param options.head - When set to `true`, `data` will not be returned.
    * Useful if you only need the count.
    *
    * @param options.count - Count algorithm to use to count rows in the table or view.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @remarks
    * When using `count` with `.range()` or `.limit()`, the returned `count` is the total number of rows
    * that match your filters, not the number of rows in the current page. Use this to build pagination UI.
    
    * - By default, Supabase projects return a maximum of 1,000 rows. This setting can be changed in your project's [API settings](/dashboard/project/_/settings/api). It's recommended that you keep it low to limit the payload size of accidental or malicious requests. You can use `range()` queries to paginate through your data.
    * - `select()` can be combined with [Filters](/docs/reference/javascript/using-filters)
    * - `select()` can be combined with [Modifiers](/docs/reference/javascript/using-modifiers)
    * - `apikey` is a reserved keyword if you're using the [Supabase Platform](/docs/guides/platform) and [should be avoided as a column name](https://github.com/supabase/supabase/issues/5465). *
    * @category Database
    *
    * @example Getting your data
    * ```js
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select()
    * ```
    *
    * @exampleSql Getting your data
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Harry'),
    *   (2, 'Frodo'),
    *   (3, 'Katniss');
    * ```
    *
    * @exampleResponse Getting your data
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Harry"
    *     },
    *     {
    *       "id": 2,
    *       "name": "Frodo"
    *     },
    *     {
    *       "id": 3,
    *       "name": "Katniss"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Handling errors
    * The most useful field on a Postgres error is usually `hint` — when the database knows the fix, it puts the literal SQL there. For example, a permission-denied error (`code: '42501'`) arrives with a `hint` like `"Grant the required privileges to the current role with: GRANT SELECT ON public.characters TO anon;"`. Log the full `error` object so the hint isn't hidden behind `error.message`.
    *
    * @example Handling errors
    * ```js
    * const { data, error } = await supabase.from('characters').select()
    * if (error) {
    *   // Logs the full error: message, code, details, and hint.
    *   console.error(error)
    *   return
    * }
    * ```
    *
    * @exampleResponse Handling errors
    * ```json
    * {
    *   "error": {
    *     "code": "42501",
    *     "details": null,
    *     "hint": "Grant the required privileges to the current role with: GRANT SELECT ON public.characters TO anon;",
    *     "message": "permission denied for table characters"
    *   },
    *   "status": 401,
    *   "statusText": ""
    * }
    * ```
    *
    * @example Selecting specific columns
    * ```js
    * const { data, error } = await supabase
    *   .from('characters')
    *   .select('name')
    * ```
    *
    * @exampleSql Selecting specific columns
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Frodo'),
    *   (2, 'Harry'),
    *   (3, 'Katniss');
    * ```
    *
    * @exampleResponse Selecting specific columns
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "Frodo"
    *     },
    *     {
    *       "name": "Harry"
    *     },
    *     {
    *       "name": "Katniss"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Query referenced tables
    * If your database has foreign key relationships, you can query related tables too.
    *
    * @example Query referenced tables
    * ```js
    * const { data, error } = await supabase
    *   .from('orchestral_sections')
    *   .select(`
    *     name,
    *     instruments (
    *       name
    *     )
    *   `)
    * ```
    *
    * @exampleSql Query referenced tables
    * ```sql
    * create table
    *   orchestral_sections (id int8 primary key, name text);
    * create table
    *   instruments (
    *     id int8 primary key,
    *     section_id int8 not null references orchestral_sections,
    *     name text
    *   );
    *
    * insert into
    *   orchestral_sections (id, name)
    * values
    *   (1, 'strings'),
    *   (2, 'woodwinds');
    * insert into
    *   instruments (id, section_id, name)
    * values
    *   (1, 2, 'flute'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse Query referenced tables
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "strings",
    *       "instruments": [
    *         {
    *           "name": "violin"
    *         }
    *       ]
    *     },
    *     {
    *       "name": "woodwinds",
    *       "instruments": [
    *         {
    *           "name": "flute"
    *         }
    *       ]
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Query referenced tables with spaces in their names
    * If your table name contains spaces, you must use double quotes in the `select` statement to reference the table.
    *
    * @example Query referenced tables with spaces in their names
    * ```js
    * const { data, error } = await supabase
    *   .from('orchestral sections')
    *   .select(`
    *     name,
    *     "musical instruments" (
    *       name
    *     )
    *   `)
    * ```
    *
    * @exampleSql Query referenced tables with spaces in their names
    * ```sql
    * create table
    *   "orchestral sections" (id int8 primary key, name text);
    * create table
    *   "musical instruments" (
    *     id int8 primary key,
    *     section_id int8 not null references "orchestral sections",
    *     name text
    *   );
    *
    * insert into
    *   "orchestral sections" (id, name)
    * values
    *   (1, 'strings'),
    *   (2, 'woodwinds');
    * insert into
    *   "musical instruments" (id, section_id, name)
    * values
    *   (1, 2, 'flute'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse Query referenced tables with spaces in their names
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "strings",
    *       "musical instruments": [
    *         {
    *           "name": "violin"
    *         }
    *       ]
    *     },
    *     {
    *       "name": "woodwinds",
    *       "musical instruments": [
    *         {
    *           "name": "flute"
    *         }
    *       ]
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Query referenced tables through a join table
    * If you're in a situation where your tables are **NOT** directly
    * related, but instead are joined by a _join table_, you can still use
    * the `select()` method to query the related data. The join table needs
    * to have the foreign keys as part of its composite primary key.
    *
    * @example Query referenced tables through a join table
    * ```ts
    * const { data, error } = await supabase
    *   .from('users')
    *   .select(`
    *     name,
    *     teams (
    *       name
    *     )
    *   `)
    *   
    * ```
    *
    * @exampleSql Query referenced tables through a join table
    * ```sql
    * create table
    *   users (
    *     id int8 primary key,
    *     name text
    *   );
    * create table
    *   teams (
    *     id int8 primary key,
    *     name text
    *   );
    * -- join table
    * create table
    *   users_teams (
    *     user_id int8 not null references users,
    *     team_id int8 not null references teams,
    *     -- both foreign keys must be part of a composite primary key
    *     primary key (user_id, team_id)
    *   );
    *
    * insert into
    *   users (id, name)
    * values
    *   (1, 'Kiran'),
    *   (2, 'Evan');
    * insert into
    *   teams (id, name)
    * values
    *   (1, 'Green'),
    *   (2, 'Blue');
    * insert into
    *   users_teams (user_id, team_id)
    * values
    *   (1, 1),
    *   (1, 2),
    *   (2, 2);
    * ```
    *
    * @exampleResponse Query referenced tables through a join table
    * ```json
    *   {
    *     "data": [
    *       {
    *         "name": "Kiran",
    *         "teams": [
    *           {
    *             "name": "Green"
    *           },
    *           {
    *             "name": "Blue"
    *           }
    *         ]
    *       },
    *       {
    *         "name": "Evan",
    *         "teams": [
    *           {
    *             "name": "Blue"
    *           }
    *         ]
    *       }
    *     ],
    *     "status": 200,
    *     "statusText": "OK"
    *   }
    *   
    * ```
    *
    * @exampleDescription Query the same referenced table multiple times
    * If you need to query the same referenced table twice, use the name of the
    * joined column to identify which join to use. You can also give each
    * column an alias.
    *
    * @example Query the same referenced table multiple times
    * ```ts
    * const { data, error } = await supabase
    *   .from('messages')
    *   .select(`
    *     content,
    *     from:sender_id(name),
    *     to:receiver_id(name)
    *   `)
    *
    * // To infer types, use the name of the table (in this case `users`) and
    * // the name of the foreign key constraint.
    * const { data, error } = await supabase
    *   .from('messages')
    *   .select(`
    *     content,
    *     from:users!messages_sender_id_fkey(name),
    *     to:users!messages_receiver_id_fkey(name)
    *   `)
    * ```
    *
    * @exampleSql Query the same referenced table multiple times
    * ```sql
    *  create table
    *  users (id int8 primary key, name text);
    *
    *  create table
    *    messages (
    *      sender_id int8 not null references users,
    *      receiver_id int8 not null references users,
    *      content text
    *    );
    *
    *  insert into
    *    users (id, name)
    *  values
    *    (1, 'Kiran'),
    *    (2, 'Evan');
    *
    *  insert into
    *    messages (sender_id, receiver_id, content)
    *  values
    *    (1, 2, '👋');
    *  ```
    * ```
    *
    * @exampleResponse Query the same referenced table multiple times
    * ```json
    * {
    *   "data": [
    *     {
    *       "content": "👋",
    *       "from": {
    *         "name": "Kiran"
    *       },
    *       "to": {
    *         "name": "Evan"
    *       }
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Query nested foreign tables through a join table
    * You can use the result of a joined table to gather data in
    * another foreign table. With multiple references to the same foreign
    * table you must specify the column on which to conduct the join.
    *
    * @example Query nested foreign tables through a join table
    * ```ts
    *   const { data, error } = await supabase
    *     .from('games')
    *     .select(`
    *       game_id:id,
    *       away_team:teams!games_away_team_fkey (
    *         users (
    *           id,
    *           name
    *         )
    *       )
    *     `)
    *   
    * ```
    *
    * @exampleSql Query nested foreign tables through a join table
    * ```sql
    * ```sql
    * create table
    *   users (
    *     id int8 primary key,
    *     name text
    *   );
    * create table
    *   teams (
    *     id int8 primary key,
    *     name text
    *   );
    * -- join table
    * create table
    *   users_teams (
    *     user_id int8 not null references users,
    *     team_id int8 not null references teams,
    *
    *     primary key (user_id, team_id)
    *   );
    * create table
    *   games (
    *     id int8 primary key,
    *     home_team int8 not null references teams,
    *     away_team int8 not null references teams,
    *     name text
    *   );
    *
    * insert into users (id, name)
    * values
    *   (1, 'Kiran'),
    *   (2, 'Evan');
    * insert into
    *   teams (id, name)
    * values
    *   (1, 'Green'),
    *   (2, 'Blue');
    * insert into
    *   users_teams (user_id, team_id)
    * values
    *   (1, 1),
    *   (1, 2),
    *   (2, 2);
    * insert into
    *   games (id, home_team, away_team, name)
    * values
    *   (1, 1, 2, 'Green vs Blue'),
    *   (2, 2, 1, 'Blue vs Green');
    * ```
    *
    * @exampleResponse Query nested foreign tables through a join table
    * ```json
    *   {
    *     "data": [
    *       {
    *         "game_id": 1,
    *         "away_team": {
    *           "users": [
    *             {
    *               "id": 1,
    *               "name": "Kiran"
    *             },
    *             {
    *               "id": 2,
    *               "name": "Evan"
    *             }
    *           ]
    *         }
    *       },
    *       {
    *         "game_id": 2,
    *         "away_team": {
    *           "users": [
    *             {
    *               "id": 1,
    *               "name": "Kiran"
    *             }
    *           ]
    *         }
    *       }
    *     ],
    *     "status": 200,
    *     "statusText": "OK"
    *   }
    *   
    * ```
    *
    * @exampleDescription Filtering through referenced tables
    * If the filter on a referenced table's column is not satisfied, the referenced
    * table returns `[]` or `null` but the parent table is not filtered out.
    * If you want to filter out the parent table rows, use the `!inner` hint
    *
    * @example Filtering through referenced tables
    * ```ts
    * const { data, error } = await supabase
    *   .from('instruments')
    *   .select('name, orchestral_sections(*)')
    *   .eq('orchestral_sections.name', 'percussion')
    * ```
    *
    * @exampleSql Filtering through referenced tables
    * ```sql
    * create table
    *   orchestral_sections (id int8 primary key, name text);
    * create table
    *   instruments (
    *     id int8 primary key,
    *     section_id int8 not null references orchestral_sections,
    *     name text
    *   );
    *
    * insert into
    *   orchestral_sections (id, name)
    * values
    *   (1, 'strings'),
    *   (2, 'woodwinds');
    * insert into
    *   instruments (id, section_id, name)
    * values
    *   (1, 2, 'flute'),
    *   (2, 1, 'violin');
    * ```
    *
    * @exampleResponse Filtering through referenced tables
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "flute",
    *       "orchestral_sections": null
    *     },
    *     {
    *       "name": "violin",
    *       "orchestral_sections": null
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Querying referenced table with count
    * You can get the number of rows in a related table by using the
    * **count** property.
    *
    * @example Querying referenced table with count
    * ```ts
    * const { data, error } = await supabase
    *   .from('orchestral_sections')
    *   .select(`*, instruments(count)`)
    * ```
    *
    * @exampleSql Querying referenced table with count
    * ```sql
    * create table orchestral_sections (
    *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
    *   "name" text
    * );
    *
    * create table characters (
    *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
    *   "name" text,
    *   "section_id" "uuid" references public.orchestral_sections on delete cascade
    * );
    *
    * with section as (
    *   insert into orchestral_sections (name)
    *   values ('strings') returning id
    * )
    * insert into instruments (name, section_id) values
    * ('violin', (select id from section)),
    * ('viola', (select id from section)),
    * ('cello', (select id from section)),
    * ('double bass', (select id from section));
    * ```
    *
    * @exampleResponse Querying referenced table with count
    * ```json
    * [
    *   {
    *     "id": "693694e7-d993-4360-a6d7-6294e325d9b6",
    *     "name": "strings",
    *     "instruments": [
    *       {
    *         "count": 4
    *       }
    *     ]
    *   }
    * ]
    * ```
    *
    * @exampleDescription Querying with count option
    * You can get the number of rows by using the
    * [count](/docs/reference/javascript/select#parameters) option.
    *
    * @example Querying with count option
    * ```ts
    * const { count, error } = await supabase
    *   .from('characters')
    *   .select('*', { count: 'exact', head: true })
    * ```
    *
    * @exampleSql Querying with count option
    * ```sql
    * create table
    *   characters (id int8 primary key, name text);
    *
    * insert into
    *   characters (id, name)
    * values
    *   (1, 'Luke'),
    *   (2, 'Leia'),
    *   (3, 'Han');
    * ```
    *
    * @exampleResponse Querying with count option
    * ```json
    * {
    *   "count": 3,
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Querying JSON data
    * You can select and filter data inside of
    * [JSON](/docs/guides/database/json) columns. Postgres offers some
    * [operators](/docs/guides/database/json#query-the-jsonb-data) for
    * querying JSON data.
    *
    * @example Querying JSON data
    * ```ts
    * const { data, error } = await supabase
    *   .from('users')
    *   .select(`
    *     id, name,
    *     address->city
    *   `)
    * ```
    *
    * @exampleSql Querying JSON data
    * ```sql
    * create table
    *   users (
    *     id int8 primary key,
    *     name text,
    *     address jsonb
    *   );
    *
    * insert into
    *   users (id, name, address)
    * values
    *   (1, 'Frodo', '{"city":"Hobbiton"}');
    * ```
    *
    * @exampleResponse Querying JSON data
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Frodo",
    *       "city": "Hobbiton"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Querying referenced table with inner join
    * If you don't want to return the referenced table contents, you can leave the parenthesis empty.
    * Like `.select('name, orchestral_sections!inner()')`.
    *
    * @example Querying referenced table with inner join
    * ```ts
    * const { data, error } = await supabase
    *   .from('instruments')
    *   .select('name, orchestral_sections!inner(name)')
    *   .eq('orchestral_sections.name', 'woodwinds')
    *   .limit(1)
    * ```
    *
    * @exampleSql Querying referenced table with inner join
    * ```sql
    * create table orchestral_sections (
    *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
    *   "name" text
    * );
    *
    * create table instruments (
    *   "id" "uuid" primary key default "extensions"."uuid_generate_v4"() not null,
    *   "name" text,
    *   "section_id" "uuid" references public.orchestral_sections on delete cascade
    * );
    *
    * with section as (
    *   insert into orchestral_sections (name)
    *   values ('woodwinds') returning id
    * )
    * insert into instruments (name, section_id) values
    * ('flute', (select id from section)),
    * ('clarinet', (select id from section)),
    * ('bassoon', (select id from section)),
    * ('piccolo', (select id from section));
    * ```
    *
    * @exampleResponse Querying referenced table with inner join
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "flute",
    *       "orchestral_sections": {"name": "woodwinds"}
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Switching schemas per query
    * In addition to setting the schema during initialization, you can also switch schemas on a per-query basis.
    * Make sure you've set up your [database privileges and API settings](/docs/guides/api/using-custom-schemas).
    *
    * @example Switching schemas per query
    * ```ts
    * const { data, error } = await supabase
    *   .schema('myschema')
    *   .from('mytable')
    *   .select()
    * ```
    *
    * @exampleSql Switching schemas per query
    * ```sql
    * create schema myschema;
    *
    * create table myschema.mytable (
    *   id uuid primary key default gen_random_uuid(),
    *   data text
    * );
    *
    * insert into myschema.mytable (data) values ('mydata');
    * ```
    *
    * @exampleResponse Switching schemas per query
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": "4162e008-27b0-4c0f-82dc-ccaeee9a624d",
    *       "data": "mydata"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    select(columns, options2) {
      const { head: head2 = false, count } = options2 !== null && options2 !== void 0 ? options2 : {};
      const method = head2 ? "HEAD" : "GET";
      let quoted = false;
      const cleanedColumns = (columns !== null && columns !== void 0 ? columns : "*").split("").map((c) => {
        if (/\s/.test(c) && !quoted) return "";
        if (c === '"') quoted = !quoted;
        return c;
      }).join("");
      const { url, headers } = this.cloneRequestState();
      url.searchParams.set("select", cleanedColumns);
      if (count) headers.append("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        fetch: this.fetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
    /**
    * Perform an INSERT into the table or view.
    *
    * By default, inserted rows are not returned. To return it, chain the call
    * with `.select()`.
    *
    * @param values - The values to insert. Pass an object to insert a single row
    * or an array to insert multiple rows.
    *
    * @param options - Named parameters
    *
    * @param options.count - Count algorithm to use to count inserted rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @param options.defaultToNull - Make missing fields default to `null`.
    * Otherwise, use the default value for the column. Only applies for bulk
    * inserts.
    *
    * @category Database
    *
    * @example Create a record
    * ```ts
    * const { error } = await supabase
    *   .from('countries')
    *   .insert({ id: 1, name: 'Mordor' })
    * ```
    *
    * @exampleSql Create a record
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    * ```
    *
    * @exampleResponse Create a record
    * ```json
    * {
    *   "status": 201,
    *   "statusText": ""
    * }
    * ```
    *
    * @exampleDescription Handling errors
    * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT INSERT ON public.countries TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
    *
    * @example Handling errors
    * ```js
    * const { error } = await supabase.from('countries').insert({ id: 1, name: 'Mordor' })
    * if (error) console.error(error)
    * ```
    *
    * @example Create a record and return it
    * ```ts
    * const { data, error } = await supabase
    *   .from('countries')
    *   .insert({ id: 1, name: 'Mordor' })
    *   .select()
    * ```
    *
    * @exampleSql Create a record and return it
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    * ```
    *
    * @exampleResponse Create a record and return it
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Mordor"
    *     }
    *   ],
    *   "status": 201,
    *   "statusText": ""
    * }
    * ```
    *
    * @exampleDescription Bulk create
    * A bulk create operation is handled in a single transaction.
    * If any of the inserts fail, none of the rows are inserted.
    *
    * @example Bulk create
    * ```ts
    * const { error } = await supabase
    *   .from('countries')
    *   .insert([
    *     { id: 1, name: 'Mordor' },
    *     { id: 1, name: 'The Shire' },
    *   ])
    * ```
    *
    * @exampleSql Bulk create
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    * ```
    *
    * @exampleResponse Bulk create
    * ```json
    * {
    *   "error": {
    *     "code": "23505",
    *     "details": "Key (id)=(1) already exists.",
    *     "hint": null,
    *     "message": "duplicate key value violates unique constraint \"countries_pkey\""
    *   },
    *   "status": 409,
    *   "statusText": ""
    * }
    * ```
    */
    insert(values, { count, defaultToNull = true } = {}) {
      var _this$fetch;
      const method = "POST";
      const { url, headers } = this.cloneRequestState();
      if (count) headers.append("Prefer", `count=${count}`);
      if (!defaultToNull) headers.append("Prefer", `missing=default`);
      if (Array.isArray(values)) {
        const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
        if (columns.length > 0) {
          const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
          url.searchParams.set("columns", uniqueColumns.join(","));
        }
      }
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        body: values,
        fetch: (_this$fetch = this.fetch) !== null && _this$fetch !== void 0 ? _this$fetch : fetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
    /**
    * Perform an UPSERT on the table or view. Depending on the column(s) passed
    * to `onConflict`, `.upsert()` allows you to perform the equivalent of
    * `.insert()` if a row with the corresponding `onConflict` columns doesn't
    * exist, or if it does exist, perform an alternative action depending on
    * `ignoreDuplicates`.
    *
    * By default, upserted rows are not returned. To return it, chain the call
    * with `.select()`.
    *
    * @param values - The values to upsert with. Pass an object to upsert a
    * single row or an array to upsert multiple rows.
    *
    * @param options - Named parameters
    *
    * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
    * duplicate rows are determined. Two rows are duplicates if all the
    * `onConflict` columns are equal.
    *
    * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
    * `false`, duplicate rows are merged with existing rows.
    *
    * @param options.count - Count algorithm to use to count upserted rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @param options.defaultToNull - Make missing fields default to `null`.
    * Otherwise, use the default value for the column. This only applies when
    * inserting new rows, not when merging with existing rows under
    * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
    *
    * @example Upsert a single row using a unique key
    * ```ts
    * // Upserting a single row, overwriting based on the 'username' unique column
    * const { data, error } = await supabase
    *   .from('users')
    *   .upsert({ username: 'supabot' }, { onConflict: 'username' })
    *
    * // Example response:
    * // {
    * //   data: [
    * //     { id: 4, message: 'bar', username: 'supabot' }
    * //   ],
    * //   error: null
    * // }
    * ```
    *
    * @example Upsert with conflict resolution and exact row counting
    * ```ts
    * // Upserting and returning exact count
    * const { data, error, count } = await supabase
    *   .from('users')
    *   .upsert(
    *     {
    *       id: 3,
    *       message: 'foo',
    *       username: 'supabot'
    *     },
    *     {
    *       onConflict: 'username',
    *       count: 'exact'
    *     }
    *   )
    *
    * // Example response:
    * // {
    * //   data: [
    * //     {
    * //       id: 42,
    * //       handle: "saoirse",
    * //       display_name: "Saoirse"
    * //     }
    * //   ],
    * //   count: 1,
    * //   error: null
    * // }
    * ```
    *
    * @category Database
    *
    * @remarks
    * - Primary keys must be included in `values` to use upsert.
    *
    * @example Upsert your data
    * ```ts
    * const { data, error } = await supabase
    *   .from('instruments')
    *   .upsert({ id: 1, name: 'piano' })
    *   .select()
    * ```
    *
    * @exampleSql Upsert your data
    * ```sql
    * create table
    *   instruments (id int8 primary key, name text);
    *
    * insert into
    *   instruments (id, name)
    * values
    *   (1, 'harpsichord');
    * ```
    *
    * @exampleResponse Upsert your data
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "piano"
    *     }
    *   ],
    *   "status": 201,
    *   "statusText": ""
    * }
    * ```
    *
    * @exampleDescription Handling errors
    * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT INSERT, UPDATE ON public.instruments TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
    *
    * @example Handling errors
    * ```js
    * const { data, error } = await supabase.from('instruments').upsert({ id: 1, name: 'piano' }).select()
    * if (error) console.error(error)
    * ```
    *
    * @example Bulk Upsert your data
    * ```ts
    * const { data, error } = await supabase
    *   .from('instruments')
    *   .upsert([
    *     { id: 1, name: 'piano' },
    *     { id: 2, name: 'harp' },
    *   ])
    *   .select()
    * ```
    *
    * @exampleSql Bulk Upsert your data
    * ```sql
    * create table
    *   instruments (id int8 primary key, name text);
    *
    * insert into
    *   instruments (id, name)
    * values
    *   (1, 'harpsichord');
    * ```
    *
    * @exampleResponse Bulk Upsert your data
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "piano"
    *     },
    *     {
    *       "id": 2,
    *       "name": "harp"
    *     }
    *   ],
    *   "status": 201,
    *   "statusText": ""
    * }
    * ```
    *
    * @exampleDescription Upserting into tables with constraints
    * In the following query, `upsert()` implicitly uses the `id`
    * (primary key) column to determine conflicts. If there is no existing
    * row with the same `id`, `upsert()` inserts a new row, which
    * will fail in this case as there is already a row with `handle` `"saoirse"`.
    * Using the `onConflict` option, you can instruct `upsert()` to use
    * another column with a unique constraint to determine conflicts.
    *
    * @example Upserting into tables with constraints
    * ```ts
    * const { data, error } = await supabase
    *   .from('users')
    *   .upsert({ id: 42, handle: 'saoirse', display_name: 'Saoirse' })
    *   .select()
    * ```
    *
    * @exampleSql Upserting into tables with constraints
    * ```sql
    * create table
    *   users (
    *     id int8 generated by default as identity primary key,
    *     handle text not null unique,
    *     display_name text
    *   );
    *
    * insert into
    *   users (id, handle, display_name)
    * values
    *   (1, 'saoirse', null);
    * ```
    *
    * @exampleResponse Upserting into tables with constraints
    * ```json
    * {
    *   "error": {
    *     "code": "23505",
    *     "details": "Key (handle)=(saoirse) already exists.",
    *     "hint": null,
    *     "message": "duplicate key value violates unique constraint \"users_handle_key\""
    *   },
    *   "status": 409,
    *   "statusText": ""
    * }
    * ```
    */
    upsert(values, { onConflict, ignoreDuplicates = false, count, defaultToNull = true } = {}) {
      var _this$fetch2;
      const method = "POST";
      const { url, headers } = this.cloneRequestState();
      headers.append("Prefer", `resolution=${ignoreDuplicates ? "ignore" : "merge"}-duplicates`);
      if (onConflict !== void 0) url.searchParams.set("on_conflict", onConflict);
      if (count) headers.append("Prefer", `count=${count}`);
      if (!defaultToNull) headers.append("Prefer", "missing=default");
      if (Array.isArray(values)) {
        const columns = values.reduce((acc, x) => acc.concat(Object.keys(x)), []);
        if (columns.length > 0) {
          const uniqueColumns = [...new Set(columns)].map((column) => `"${column}"`);
          url.searchParams.set("columns", uniqueColumns.join(","));
        }
      }
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        body: values,
        fetch: (_this$fetch2 = this.fetch) !== null && _this$fetch2 !== void 0 ? _this$fetch2 : fetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
    /**
    * Perform an UPDATE on the table or view.
    *
    * By default, updated rows are not returned. To return it, chain the call
    * with `.select()` after filters.
    *
    * @param values - The values to update with
    *
    * @param options - Named parameters
    *
    * @param options.count - Count algorithm to use to count updated rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @category Database
    *
    * @remarks
    * - `update()` should always be combined with [Filters](/docs/reference/javascript/using-filters) to target the item(s) you wish to update.
    *
    * @example Updating your data
    * ```ts
    * const { error } = await supabase
    *   .from('instruments')
    *   .update({ name: 'piano' })
    *   .eq('id', 1)
    * ```
    *
    * @exampleSql Updating your data
    * ```sql
    * create table
    *   instruments (id int8 primary key, name text);
    *
    * insert into
    *   instruments (id, name)
    * values
    *   (1, 'harpsichord');
    * ```
    *
    * @exampleResponse Updating your data
    * ```json
    * {
    *   "status": 204,
    *   "statusText": ""
    * }
    * ```
    *
    * @exampleDescription Handling errors
    * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT UPDATE ON public.instruments TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
    *
    * @example Handling errors
    * ```js
    * const { error } = await supabase.from('instruments').update({ name: 'piano' }).eq('id', 1)
    * if (error) console.error(error)
    * ```
    *
    * @example Update a record and return it
    * ```ts
    * const { data, error } = await supabase
    *   .from('instruments')
    *   .update({ name: 'piano' })
    *   .eq('id', 1)
    *   .select()
    * ```
    *
    * @exampleSql Update a record and return it
    * ```sql
    * create table
    *   instruments (id int8 primary key, name text);
    *
    * insert into
    *   instruments (id, name)
    * values
    *   (1, 'harpsichord');
    * ```
    *
    * @exampleResponse Update a record and return it
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "piano"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Updating JSON data
    * Postgres offers some
    * [operators](/docs/guides/database/json#query-the-jsonb-data) for
    * working with JSON data. Currently, it is only possible to update the entire JSON document.
    *
    * @example Updating JSON data
    * ```ts
    * const { data, error } = await supabase
    *   .from('users')
    *   .update({
    *     address: {
    *       street: 'Melrose Place',
    *       postcode: 90210
    *     }
    *   })
    *   .eq('address->postcode', 90210)
    *   .select()
    * ```
    *
    * @exampleSql Updating JSON data
    * ```sql
    * create table
    *   users (
    *     id int8 primary key,
    *     name text,
    *     address jsonb
    *   );
    *
    * insert into
    *   users (id, name, address)
    * values
    *   (1, 'Michael', '{ "postcode": 90210 }');
    * ```
    *
    * @exampleResponse Updating JSON data
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Michael",
    *       "address": {
    *         "street": "Melrose Place",
    *         "postcode": 90210
    *       }
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    update(values, { count } = {}) {
      var _this$fetch3;
      const method = "PATCH";
      const { url, headers } = this.cloneRequestState();
      if (count) headers.append("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        body: values,
        fetch: (_this$fetch3 = this.fetch) !== null && _this$fetch3 !== void 0 ? _this$fetch3 : fetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
    /**
    * Perform a DELETE on the table or view.
    *
    * By default, deleted rows are not returned. To return it, chain the call
    * with `.select()` after filters.
    *
    * @param options - Named parameters
    *
    * @param options.count - Count algorithm to use to count deleted rows.
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @category Database
    *
    * @remarks
    * - `delete()` should always be combined with [filters](/docs/reference/javascript/using-filters) to target the item(s) you wish to delete.
    * - If you use `delete()` with filters and you have
    *   [RLS](/docs/learn/auth-deep-dive/auth-row-level-security) enabled, only
    *   rows visible through `SELECT` policies are deleted. Note that by default
    *   no rows are visible, so you need at least one `SELECT`/`ALL` policy that
    *   makes the rows visible.
    * - When using `delete().in()`, specify an array of values to target multiple rows with a single query. This is particularly useful for batch deleting entries that share common criteria, such as deleting users by their IDs. Ensure that the array you provide accurately represents all records you intend to delete to avoid unintended data removal.
    *
    * @example Delete a single record
    * ```ts
    * const response = await supabase
    *   .from('countries')
    *   .delete()
    *   .eq('id', 1)
    * ```
    *
    * @exampleSql Delete a single record
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    *
    * insert into
    *   countries (id, name)
    * values
    *   (1, 'Mordor');
    * ```
    *
    * @exampleResponse Delete a single record
    * ```json
    * {
    *   "status": 204,
    *   "statusText": ""
    * }
    * ```
    *
    * @exampleDescription Handling errors
    * `error.hint` from Postgres often contains the actionable fix (e.g. `"Grant the required privileges to the current role with: GRANT DELETE ON public.countries TO anon;"` for a `42501` permission-denied error). Log the full `error` object so it isn't hidden behind `error.message`.
    *
    * @example Handling errors
    * ```js
    * const { error } = await supabase.from('countries').delete().eq('id', 1)
    * if (error) console.error(error)
    * ```
    *
    * @example Delete a record and return it
    * ```ts
    * const { data, error } = await supabase
    *   .from('countries')
    *   .delete()
    *   .eq('id', 1)
    *   .select()
    * ```
    *
    * @exampleSql Delete a record and return it
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    *
    * insert into
    *   countries (id, name)
    * values
    *   (1, 'Mordor');
    * ```
    *
    * @exampleResponse Delete a record and return it
    * ```json
    * {
    *   "data": [
    *     {
    *       "id": 1,
    *       "name": "Mordor"
    *     }
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @example Delete multiple records
    * ```ts
    * const response = await supabase
    *   .from('countries')
    *   .delete()
    *   .in('id', [1, 2, 3])
    * ```
    *
    * @exampleSql Delete multiple records
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    *
    * insert into
    *   countries (id, name)
    * values
    *   (1, 'Rohan'), (2, 'The Shire'), (3, 'Mordor');
    * ```
    *
    * @exampleResponse Delete multiple records
    * ```json
    * {
    *   "status": 204,
    *   "statusText": ""
    * }
    * ```
    */
    delete({ count } = {}) {
      var _this$fetch4;
      const method = "DELETE";
      const { url, headers } = this.cloneRequestState();
      if (count) headers.append("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schema,
        fetch: (_this$fetch4 = this.fetch) !== null && _this$fetch4 !== void 0 ? _this$fetch4 : fetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
  };
  function toOpenApiError(body, statusText) {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        var _parsed$message, _parsed$details, _parsed$hint, _parsed$code;
        return new PostgrestError({
          message: String((_parsed$message = parsed.message) !== null && _parsed$message !== void 0 ? _parsed$message : body),
          details: (_parsed$details = parsed.details) !== null && _parsed$details !== void 0 ? _parsed$details : "",
          hint: (_parsed$hint = parsed.hint) !== null && _parsed$hint !== void 0 ? _parsed$hint : "",
          code: (_parsed$code = parsed.code) !== null && _parsed$code !== void 0 ? _parsed$code : ""
        });
      }
    } catch (_unused) {
    }
    return new PostgrestError({
      message: body || statusText,
      details: "",
      hint: "",
      code: ""
    });
  }
  function toTransportFailure(cause, status, statusText) {
    var _err$name;
    const err = cause;
    return {
      success: false,
      error: new PostgrestError({
        message: `${(_err$name = err === null || err === void 0 ? void 0 : err.name) !== null && _err$name !== void 0 ? _err$name : "FetchError"}: ${err === null || err === void 0 ? void 0 : err.message}`,
        details: "",
        hint: "",
        code: ""
      }),
      data: null,
      count: null,
      status,
      statusText
    };
  }
  function withTimeout(fetch$1, timeout) {
    if (timeout === void 0 || timeout <= 0) return fetch$1;
    return (input, init) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      const existingSignal = init === null || init === void 0 ? void 0 : init.signal;
      if (existingSignal) {
        if (existingSignal.aborted) {
          clearTimeout(timeoutId);
          return fetch$1(input, init);
        }
        const abortHandler = () => {
          clearTimeout(timeoutId);
          controller.abort();
        };
        existingSignal.addEventListener("abort", abortHandler, { once: true });
        return fetch$1(input, _objectSpread2(_objectSpread2({}, init), {}, { signal: controller.signal })).finally(() => {
          clearTimeout(timeoutId);
          existingSignal.removeEventListener("abort", abortHandler);
        });
      }
      return fetch$1(input, _objectSpread2(_objectSpread2({}, init), {}, { signal: controller.signal })).finally(() => clearTimeout(timeoutId));
    };
  }
  var PostgrestClient = class PostgrestClient2 {
    /**
    * Creates a PostgREST client.
    *
    * @param url - URL of the PostgREST endpoint
    * @param options - Named parameters
    * @param options.headers - Custom headers
    * @param options.schema - Postgres schema to switch to
    * @param options.fetch - Custom fetch
    * @param options.timeout - Optional timeout in milliseconds for all requests. When set, requests will automatically abort after this duration to prevent indefinite hangs.
    * @param options.urlLengthLimit - Maximum URL length in characters before warnings/errors are triggered. Defaults to 8000.
    * @param options.retry - Enable or disable automatic retries for transient errors.
    *   When enabled, idempotent requests (GET, HEAD, OPTIONS) that fail with network
    *   errors or HTTP 503/520 responses will be automatically retried up to 3 times
    *   with exponential backoff (1s, 2s, 4s). Defaults to `true`.
    * @param options.wrapFetch - Wraps every fetch this client uses, including a per-request
    *   `fetch` passed to `from()`, and is carried over to clients returned by `schema()`.
    *   Use it for headers or instrumentation that must reach every request regardless of
    *   which fetch performs it.
    * @example Using supabase-js (recommended)
    * ```ts
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * const { data, error } = await supabase.from('profiles').select('*')
    * ```
    *
    * @category Database
    *
    * @remarks
    * - A `timeout` option (in milliseconds) can be set to automatically abort requests that take too long.
    * - A `urlLengthLimit` option (default: 8000) can be set to control when URL length warnings are included in error messages for aborted requests.
    *
    * @example Standalone import for bundle-sensitive environments
    * ```ts
    * import { PostgrestClient } from '@supabase/postgrest-js'
    *
    * const postgrest = new PostgrestClient('https://xyzcompany.supabase.co/rest/v1', {
    *   headers: { apikey: 'your-publishable-key' },
    *   schema: 'public',
    *   timeout: 30000, // 30 second timeout
    * })
    * ```
    */
    constructor(url, { headers = {}, schema, fetch: fetch$1, timeout, urlLengthLimit = 8e3, retry, wrapFetch } = {}) {
      this.url = url;
      this.headers = new Headers(headers);
      this.schemaName = schema;
      this.urlLengthLimit = urlLengthLimit;
      this.timeout = timeout;
      this.wrapFetch = wrapFetch;
      this.baseFetch = fetch$1 !== null && fetch$1 !== void 0 ? fetch$1 : globalThis.fetch;
      this.fetch = this.baseFetch ? this.decorateFetch(this.baseFetch) : void 0;
      this.retry = retry;
    }
    /**
    * Applies the client's decorations to a fetch implementation: `wrapFetch`
    * first, then the timeout guard, so the timeout bounds the whole wrapped call.
    * The client-level fetch and every per-request `fetch` passed to `from()` go
    * through this.
    */
    decorateFetch(fetch$1) {
      return withTimeout(this.wrapFetch ? this.wrapFetch(fetch$1) : fetch$1, this.timeout);
    }
    from(relation, options2) {
      var _options$urlLengthLim, _options$retry;
      if (!relation || typeof relation !== "string" || relation.trim() === "") throw new Error("Invalid relation name: relation must be a non-empty string.");
      return new PostgrestQueryBuilder(new URL(`${this.url}/${relation}`), {
        headers: new Headers(this.headers),
        schema: this.schemaName,
        fetch: (options2 === null || options2 === void 0 ? void 0 : options2.fetch) ? this.decorateFetch(options2.fetch) : this.fetch,
        urlLengthLimit: (_options$urlLengthLim = options2 === null || options2 === void 0 ? void 0 : options2.urlLengthLimit) !== null && _options$urlLengthLim !== void 0 ? _options$urlLengthLim : this.urlLengthLimit,
        retry: (_options$retry = options2 === null || options2 === void 0 ? void 0 : options2.retry) !== null && _options$retry !== void 0 ? _options$retry : this.retry
      });
    }
    /**
    * Select a schema to query or perform an function (rpc) call.
    *
    * The schema needs to be on the list of exposed schemas inside Supabase.
    *
    * @param schema - The schema to query
    *
    * @category Database
    */
    schema(schema) {
      return new PostgrestClient2(this.url, {
        headers: this.headers,
        schema,
        fetch: this.baseFetch,
        timeout: this.timeout,
        wrapFetch: this.wrapFetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
    /**
    * Fetch the OpenAPI description PostgREST publishes for this client's schema.
    *
    * The document lists only the tables, views and functions the caller's role
    * holds privileges on; PostgREST applies that filtering server-side. The
    * schema is the one this client was created with, so call `.schema()` first
    * to describe a different one. Transient failures are retried according to
    * the client's `retry` option, like any other idempotent request.
    *
    * @example
    * ```ts
    * const { data, error } = await supabase.getOpenApiSpec()
    * ```
    *
    * @example Describe a schema other than the client default
    * ```ts
    * const { data, error } = await supabase.schema('billing').getOpenApiSpec()
    * ```
    *
    * @category Database
    */
    async getOpenApiSpec() {
      var _this = this;
      var _this$fetch;
      const headers = new Headers(_this.headers);
      headers.set("Accept", "application/openapi+json");
      if (_this.schemaName) headers.set("Accept-Profile", _this.schemaName);
      const requestHeaders = {};
      headers.forEach((value, key) => {
        requestHeaders[key] = value;
      });
      const fetchImpl = (_this$fetch = _this.fetch) !== null && _this$fetch !== void 0 ? _this$fetch : globalThis.fetch;
      let res;
      try {
        var _this$retry;
        res = await fetchWithRetry(fetchImpl, `${_this.url}/`, {
          method: "GET",
          headers: requestHeaders
        }, (_this$retry = _this.retry) !== null && _this$retry !== void 0 ? _this$retry : true);
      } catch (fetchError) {
        return toTransportFailure(fetchError, 0, "");
      }
      let body;
      try {
        body = await res.text();
      } catch (readError) {
        return toTransportFailure(readError, res.status, res.statusText);
      }
      if (res.ok) try {
        return {
          success: true,
          error: null,
          data: JSON.parse(body),
          count: null,
          status: res.status,
          statusText: res.statusText
        };
      } catch (_unused2) {
      }
      return {
        success: false,
        error: toOpenApiError(body, res.statusText),
        data: null,
        count: null,
        status: res.status,
        statusText: res.statusText
      };
    }
    /**
    * Perform a function call.
    *
    * @param fn - The function name to call
    * @param args - The arguments to pass to the function call
    * @param options - Named parameters
    * @param options.head - When set to `true`, `data` will not be returned.
    * Useful if you only need the count.
    * @param options.get - When set to `true`, the function will be called with
    * read-only access mode.
    * @param options.count - Count algorithm to use to count rows returned by the
    * function. Only applicable for [set-returning
    * functions](https://www.postgresql.org/docs/current/functions-srf.html).
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    *
    * @example
    * ```ts
    * // For cross-schema functions where type inference fails, use overrideTypes:
    * const { data } = await supabase
    *   .schema('schema_b')
    *   .rpc('function_a', {})
    *   .overrideTypes<{ id: string; user_id: string }[]>()
    * ```
    *
    * @category Database
    *
    * @example Call a Postgres function without arguments
    * ```ts
    * const { data, error } = await supabase.rpc('hello_world')
    * ```
    *
    * @exampleSql Call a Postgres function without arguments
    * ```sql
    * create function hello_world() returns text as $$
    *   select 'Hello world';
    * $$ language sql;
    * ```
    *
    * @exampleResponse Call a Postgres function without arguments
    * ```json
    * {
    *   "data": "Hello world",
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @example Call a Postgres function with arguments
    * ```ts
    * const { data, error } = await supabase.rpc('echo', { say: '👋' })
    * ```
    *
    * @exampleSql Call a Postgres function with arguments
    * ```sql
    * create function echo(say text) returns text as $$
    *   select say;
    * $$ language sql;
    * ```
    *
    * @exampleResponse Call a Postgres function with arguments
    * ```json
    *   {
    *     "data": "👋",
    *     "status": 200,
    *     "statusText": "OK"
    *   }
    *
    * ```
    *
    * @exampleDescription Bulk processing
    * You can process large payloads by passing in an array as an argument.
    *
    * @example Bulk processing
    * ```ts
    * const { data, error } = await supabase.rpc('add_one_each', { arr: [1, 2, 3] })
    * ```
    *
    * @exampleSql Bulk processing
    * ```sql
    * create function add_one_each(arr int[]) returns int[] as $$
    *   select array_agg(n + 1) from unnest(arr) as n;
    * $$ language sql;
    * ```
    *
    * @exampleResponse Bulk processing
    * ```json
    * {
    *   "data": [
    *     2,
    *     3,
    *     4
    *   ],
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @exampleDescription Call a Postgres function with filters
    * Postgres functions that return tables can also be combined with [Filters](/docs/reference/javascript/using-filters) and [Modifiers](/docs/reference/javascript/using-modifiers).
    *
    * @example Call a Postgres function with filters
    * ```ts
    * const { data, error } = await supabase
    *   .rpc('list_stored_countries')
    *   .eq('id', 1)
    *   .single()
    * ```
    *
    * @exampleSql Call a Postgres function with filters
    * ```sql
    * create table
    *   countries (id int8 primary key, name text);
    *
    * insert into
    *   countries (id, name)
    * values
    *   (1, 'Rohan'),
    *   (2, 'The Shire');
    *
    * create function list_stored_countries() returns setof countries as $$
    *   select * from countries;
    * $$ language sql;
    * ```
    *
    * @exampleResponse Call a Postgres function with filters
    * ```json
    * {
    *   "data": {
    *     "id": 1,
    *     "name": "Rohan"
    *   },
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    *
    * @example Call a read-only Postgres function
    * ```ts
    * const { data, error } = await supabase.rpc('hello_world', undefined, { get: true })
    * ```
    *
    * @exampleSql Call a read-only Postgres function
    * ```sql
    * create function hello_world() returns text as $$
    *   select 'Hello world';
    * $$ language sql;
    * ```
    *
    * @exampleResponse Call a read-only Postgres function
    * ```json
    * {
    *   "data": "Hello world",
    *   "status": 200,
    *   "statusText": "OK"
    * }
    * ```
    */
    rpc(fn, args = {}, { head: head2 = false, get: get2 = false, count } = {}) {
      var _this$fetch2;
      let method;
      const url = new URL(`${this.url}/rpc/${fn}`);
      let body;
      const _isObject = (v) => v !== null && typeof v === "object" && (!Array.isArray(v) || v.some(_isObject));
      const _hasObjectArg = head2 && Object.values(args).some(_isObject);
      if (_hasObjectArg) {
        method = "POST";
        body = args;
      } else if (head2 || get2) {
        method = head2 ? "HEAD" : "GET";
        Object.entries(args).filter(([_, value]) => value !== void 0).map(([name, value]) => [name, Array.isArray(value) ? `{${value.join(",")}}` : `${value}`]).forEach(([name, value]) => {
          url.searchParams.append(name, value);
        });
      } else {
        method = "POST";
        body = args;
      }
      const headers = new Headers(this.headers);
      if (_hasObjectArg) headers.set("Prefer", count ? `count=${count},return=minimal` : "return=minimal");
      else if (count) headers.set("Prefer", `count=${count}`);
      return new PostgrestFilterBuilder({
        method,
        url,
        headers,
        schema: this.schemaName,
        body,
        fetch: (_this$fetch2 = this.fetch) !== null && _this$fetch2 !== void 0 ? _this$fetch2 : fetch,
        urlLengthLimit: this.urlLengthLimit,
        retry: this.retry
      });
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/lib/websocket-factory.js
  var WebSocketFactory = class {
    /**
     * Static-only utility – prevent instantiation.
     */
    constructor() {
    }
    static detectEnvironment() {
      var _a;
      if (typeof WebSocket !== "undefined") {
        return { type: "native", wsConstructor: WebSocket };
      }
      const gt = globalThis;
      if (typeof globalThis !== "undefined" && typeof gt.WebSocket !== "undefined") {
        return { type: "native", wsConstructor: gt.WebSocket };
      }
      const gl = typeof global !== "undefined" ? global : void 0;
      if (gl && typeof gl.WebSocket !== "undefined") {
        return { type: "native", wsConstructor: gl.WebSocket };
      }
      if (typeof globalThis !== "undefined" && typeof gt.WebSocketPair !== "undefined" && typeof globalThis.WebSocket === "undefined") {
        return {
          type: "cloudflare",
          error: "Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",
          workaround: "Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."
        };
      }
      if (typeof globalThis !== "undefined" && gt.EdgeRuntime || typeof navigator !== "undefined" && ((_a = navigator.userAgent) === null || _a === void 0 ? void 0 : _a.includes("Vercel-Edge"))) {
        return {
          type: "unsupported",
          error: "Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",
          workaround: "Use serverless functions or a different deployment target for WebSocket functionality."
        };
      }
      const _process = globalThis["process"];
      if (_process) {
        const processVersions = _process["versions"];
        if (processVersions && processVersions["node"]) {
          return {
            type: "unsupported",
            error: "Node.js detected but native WebSocket not found.",
            workaround: "Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."
          };
        }
      }
      return {
        type: "unsupported",
        error: "Unknown JavaScript runtime without WebSocket support.",
        workaround: "Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."
      };
    }
    /**
     * Returns the best available WebSocket constructor for the current runtime.
     *
     * @category Realtime
     *
     * @example Example with error handling
     * ```ts
     * try {
     *   const WS = WebSocketFactory.getWebSocketConstructor()
     *   const socket = new WS('wss://example.com/socket')
     * } catch (error) {
     *   console.error('WebSocket not available in this environment.', error)
     * }
     * ```
     */
    static getWebSocketConstructor() {
      const env = this.detectEnvironment();
      if (env.wsConstructor) {
        return env.wsConstructor;
      }
      let errorMessage = env.error || "WebSocket not supported in this environment.";
      if (env.workaround) {
        errorMessage += `

Suggested solution: ${env.workaround}`;
      }
      throw new Error(errorMessage);
    }
    /**
     * Detects whether the runtime can establish WebSocket connections.
     *
     * @category Realtime
     *
     * @example Example in a Node.js script
     * ```ts
     * if (!WebSocketFactory.isWebSocketSupported()) {
     *   console.error('WebSockets are required for this script.')
     *   process.exitCode = 1
     * }
     * ```
     */
    static isWebSocketSupported() {
      try {
        const env = this.detectEnvironment();
        return env.type === "native";
      } catch (_a) {
        return false;
      }
    }
  };
  var websocket_factory_default = WebSocketFactory;

  // node_modules/@supabase/realtime-js/dist/module/lib/version.js
  var version = "2.119.2";

  // node_modules/@supabase/realtime-js/dist/module/lib/constants.js
  var DEFAULT_VERSION = `realtime-js/${version}`;
  var VSN_1_0_0 = "1.0.0";
  var VSN_2_0_0 = "2.0.0";
  var DEFAULT_VSN = VSN_2_0_0;
  var DEFAULT_TIMEOUT = 1e4;
  var DEFAULT_POSTGRES_CHANGES_WAIT_TIMEOUT = 15e3;
  var POSTGRES_CHANGES_WAIT_ERROR_GRACE = 1e4;
  var MAX_PUSH_BUFFER_SIZE = 100;
  var CHANNEL_STATES = {
    closed: "closed",
    errored: "errored",
    joined: "joined",
    joining: "joining",
    leaving: "leaving"
  };
  var CHANNEL_EVENTS = {
    close: "phx_close",
    error: "phx_error",
    join: "phx_join",
    reply: "phx_reply",
    leave: "phx_leave",
    access_token: "access_token"
  };
  var CONNECTION_STATE = {
    connecting: "connecting",
    open: "open",
    closing: "closing",
    closed: "closed"
  };

  // node_modules/@supabase/realtime-js/dist/module/lib/serializer.js
  var Serializer = class _Serializer {
    constructor(allowedMetadataKeys) {
      this.HEADER_LENGTH = 1;
      this.USER_BROADCAST_PUSH_META_LENGTH = 6;
      this.KINDS = { userBroadcastPush: 3, userBroadcast: 4 };
      this.BINARY_ENCODING = 0;
      this.JSON_ENCODING = 1;
      this.BROADCAST_EVENT = "broadcast";
      this.allowedMetadataKeys = _Serializer.DEFAULT_METADATA_KEYS;
      this.allowedMetadataKeys = allowedMetadataKeys !== null && allowedMetadataKeys !== void 0 ? allowedMetadataKeys : _Serializer.DEFAULT_METADATA_KEYS;
    }
    encode(msg, callback) {
      if (msg.event === this.BROADCAST_EVENT && !(msg.payload instanceof ArrayBuffer) && typeof msg.payload.event === "string") {
        return callback(this._binaryEncodeUserBroadcastPush(msg));
      }
      let payload = [msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload];
      return callback(JSON.stringify(payload));
    }
    _binaryEncodeUserBroadcastPush(message) {
      var _a;
      if (this._isArrayBuffer((_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload)) {
        return this._encodeBinaryUserBroadcastPush(message);
      } else {
        return this._encodeJsonUserBroadcastPush(message);
      }
    }
    _encodeBinaryUserBroadcastPush(message) {
      var _a, _b;
      const userPayload = (_b = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : new ArrayBuffer(0);
      return this._encodeUserBroadcastPush(message, this.BINARY_ENCODING, userPayload);
    }
    _encodeJsonUserBroadcastPush(message) {
      var _a, _b;
      const userPayload = (_b = (_a = message.payload) === null || _a === void 0 ? void 0 : _a.payload) !== null && _b !== void 0 ? _b : {};
      const encoder = new TextEncoder();
      const encodedUserPayload = encoder.encode(JSON.stringify(userPayload)).buffer;
      return this._encodeUserBroadcastPush(message, this.JSON_ENCODING, encodedUserPayload);
    }
    _encodeUserBroadcastPush(message, encodingType, encodedPayload) {
      var _a, _b;
      const encoder = new TextEncoder();
      const topic = encoder.encode(message.topic);
      const ref = encoder.encode((_a = message.ref) !== null && _a !== void 0 ? _a : "");
      const joinRef = encoder.encode((_b = message.join_ref) !== null && _b !== void 0 ? _b : "");
      const userEvent = encoder.encode(message.payload.event);
      const rest = this.allowedMetadataKeys ? this._pick(message.payload, this.allowedMetadataKeys) : {};
      const metadata = encoder.encode(Object.keys(rest).length === 0 ? "" : JSON.stringify(rest));
      if (joinRef.length > 255) {
        throw new Error(`joinRef length ${joinRef.length} exceeds maximum of 255`);
      }
      if (ref.length > 255) {
        throw new Error(`ref length ${ref.length} exceeds maximum of 255`);
      }
      if (topic.length > 255) {
        throw new Error(`topic length ${topic.length} exceeds maximum of 255`);
      }
      if (userEvent.length > 255) {
        throw new Error(`userEvent length ${userEvent.length} exceeds maximum of 255`);
      }
      if (metadata.length > 255) {
        throw new Error(`metadata length ${metadata.length} exceeds maximum of 255`);
      }
      const metaLength = this.USER_BROADCAST_PUSH_META_LENGTH + joinRef.length + ref.length + topic.length + userEvent.length + metadata.length;
      const header = new ArrayBuffer(this.HEADER_LENGTH + metaLength);
      const view = new DataView(header);
      const bytes = new Uint8Array(header);
      let offset = 0;
      view.setUint8(offset++, this.KINDS.userBroadcastPush);
      view.setUint8(offset++, joinRef.length);
      view.setUint8(offset++, ref.length);
      view.setUint8(offset++, topic.length);
      view.setUint8(offset++, userEvent.length);
      view.setUint8(offset++, metadata.length);
      view.setUint8(offset++, encodingType);
      bytes.set(joinRef, offset);
      offset += joinRef.length;
      bytes.set(ref, offset);
      offset += ref.length;
      bytes.set(topic, offset);
      offset += topic.length;
      bytes.set(userEvent, offset);
      offset += userEvent.length;
      bytes.set(metadata, offset);
      offset += metadata.length;
      var combined = new Uint8Array(header.byteLength + encodedPayload.byteLength);
      combined.set(new Uint8Array(header), 0);
      combined.set(new Uint8Array(encodedPayload), header.byteLength);
      return combined.buffer;
    }
    decode(rawPayload, callback) {
      if (this._isArrayBuffer(rawPayload)) {
        let result = this._binaryDecode(rawPayload);
        return callback(result);
      }
      if (typeof rawPayload === "string") {
        const jsonPayload = JSON.parse(rawPayload);
        const [join_ref, ref, topic, event, payload] = jsonPayload;
        return callback({ join_ref, ref, topic, event, payload });
      }
      return callback({});
    }
    _binaryDecode(buffer) {
      const view = new DataView(buffer);
      const kind = view.getUint8(0);
      const decoder = new TextDecoder();
      switch (kind) {
        case this.KINDS.userBroadcast:
          return this._decodeUserBroadcast(buffer, view, decoder);
      }
    }
    _decodeUserBroadcast(buffer, view, decoder) {
      const topicSize = view.getUint8(1);
      const userEventSize = view.getUint8(2);
      const metadataSize = view.getUint8(3);
      const payloadEncoding = view.getUint8(4);
      let offset = this.HEADER_LENGTH + 4;
      const topic = decoder.decode(buffer.slice(offset, offset + topicSize));
      offset = offset + topicSize;
      const userEvent = decoder.decode(buffer.slice(offset, offset + userEventSize));
      offset = offset + userEventSize;
      const metadata = decoder.decode(buffer.slice(offset, offset + metadataSize));
      offset = offset + metadataSize;
      const payload = buffer.slice(offset, buffer.byteLength);
      const parsedPayload = payloadEncoding === this.JSON_ENCODING ? JSON.parse(decoder.decode(payload)) : payload;
      const data = {
        type: this.BROADCAST_EVENT,
        event: userEvent,
        payload: parsedPayload
      };
      if (metadataSize > 0) {
        data["meta"] = JSON.parse(metadata);
      }
      return { join_ref: null, ref: null, topic, event: this.BROADCAST_EVENT, payload: data };
    }
    _isArrayBuffer(buffer) {
      var _a;
      return buffer instanceof ArrayBuffer || ((_a = buffer === null || buffer === void 0 ? void 0 : buffer.constructor) === null || _a === void 0 ? void 0 : _a.name) === "ArrayBuffer";
    }
    _pick(obj, keys) {
      if (!obj || typeof obj !== "object") {
        return {};
      }
      return Object.fromEntries(Object.entries(obj).filter(([key]) => keys.includes(key)));
    }
  };
  Serializer.DEFAULT_METADATA_KEYS = ["persist"];
  var serializer_default = Serializer;

  // node_modules/@supabase/realtime-js/dist/module/lib/transformers.js
  var PostgresTypes;
  (function(PostgresTypes2) {
    PostgresTypes2["abstime"] = "abstime";
    PostgresTypes2["bool"] = "bool";
    PostgresTypes2["date"] = "date";
    PostgresTypes2["daterange"] = "daterange";
    PostgresTypes2["float4"] = "float4";
    PostgresTypes2["float8"] = "float8";
    PostgresTypes2["int2"] = "int2";
    PostgresTypes2["int4"] = "int4";
    PostgresTypes2["int4range"] = "int4range";
    PostgresTypes2["int8"] = "int8";
    PostgresTypes2["int8range"] = "int8range";
    PostgresTypes2["json"] = "json";
    PostgresTypes2["jsonb"] = "jsonb";
    PostgresTypes2["money"] = "money";
    PostgresTypes2["numeric"] = "numeric";
    PostgresTypes2["oid"] = "oid";
    PostgresTypes2["reltime"] = "reltime";
    PostgresTypes2["text"] = "text";
    PostgresTypes2["time"] = "time";
    PostgresTypes2["timestamp"] = "timestamp";
    PostgresTypes2["timestamptz"] = "timestamptz";
    PostgresTypes2["timetz"] = "timetz";
    PostgresTypes2["tsrange"] = "tsrange";
    PostgresTypes2["tstzrange"] = "tstzrange";
  })(PostgresTypes || (PostgresTypes = {}));
  var convertChangeData = (columns, record, options2 = {}) => {
    var _a;
    const skipTypes = (_a = options2.skipTypes) !== null && _a !== void 0 ? _a : [];
    if (!record) {
      return {};
    }
    return Object.keys(record).reduce((acc, rec_key) => {
      acc[rec_key] = convertColumn(rec_key, columns, record, skipTypes);
      return acc;
    }, {});
  };
  var convertColumn = (columnName, columns, record, skipTypes) => {
    const column = columns.find((x) => x.name === columnName);
    const colType = column === null || column === void 0 ? void 0 : column.type;
    const value = record[columnName];
    if (colType && !skipTypes.includes(colType)) {
      return convertCell(colType, value);
    }
    return noop(value);
  };
  var convertCell = (type, value) => {
    if (type.charAt(0) === "_") {
      const dataType = type.slice(1, type.length);
      return toArray(value, dataType);
    }
    switch (type) {
      case PostgresTypes.bool:
        return toBoolean(value);
      case PostgresTypes.float4:
      case PostgresTypes.float8:
      case PostgresTypes.int2:
      case PostgresTypes.int4:
      case PostgresTypes.int8:
      case PostgresTypes.numeric:
      case PostgresTypes.oid:
        return toNumber(value);
      case PostgresTypes.json:
      case PostgresTypes.jsonb:
        return toJson(value);
      case PostgresTypes.timestamp:
        return toTimestampString(value);
      // Format to be consistent with PostgREST
      case PostgresTypes.abstime:
      // To allow users to cast it based on Timezone
      case PostgresTypes.date:
      // To allow users to cast it based on Timezone
      case PostgresTypes.daterange:
      case PostgresTypes.int4range:
      case PostgresTypes.int8range:
      case PostgresTypes.money:
      case PostgresTypes.reltime:
      // To allow users to cast it based on Timezone
      case PostgresTypes.text:
      case PostgresTypes.time:
      // To allow users to cast it based on Timezone
      case PostgresTypes.timestamptz:
      // To allow users to cast it based on Timezone
      case PostgresTypes.timetz:
      // To allow users to cast it based on Timezone
      case PostgresTypes.tsrange:
      case PostgresTypes.tstzrange:
        return noop(value);
      default:
        return noop(value);
    }
  };
  var noop = (value) => {
    return value;
  };
  var toBoolean = (value) => {
    switch (value) {
      case "t":
        return true;
      case "f":
        return false;
      default:
        return value;
    }
  };
  var toNumber = (value) => {
    if (typeof value === "string") {
      const parsedValue = parseFloat(value);
      if (!Number.isNaN(parsedValue)) {
        return parsedValue;
      }
    }
    return value;
  };
  var toJson = (value) => {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch (_a) {
        return value;
      }
    }
    return value;
  };
  var toArray = (value, type) => {
    if (typeof value !== "string") {
      return value;
    }
    const lastIdx = value.length - 1;
    const closeBrace = value[lastIdx];
    const openBrace = value[0];
    if (openBrace === "{" && closeBrace === "}") {
      let arr;
      const valTrim = value.slice(1, lastIdx);
      try {
        arr = JSON.parse("[" + valTrim + "]");
      } catch (_) {
        arr = valTrim ? valTrim.split(",") : [];
      }
      return arr.map((val) => convertCell(type, val));
    }
    return value;
  };
  var toTimestampString = (value) => {
    if (typeof value === "string") {
      return value.replace(" ", "T");
    }
    return value;
  };
  var httpEndpointURL = (socketUrl) => {
    const wsUrl = new URL(socketUrl);
    wsUrl.protocol = wsUrl.protocol.replace(/^ws/i, "http");
    wsUrl.pathname = wsUrl.pathname.replace(/\/+$/, "").replace(/\/socket\/websocket$/i, "").replace(/\/socket$/i, "").replace(/\/websocket$/i, "");
    if (wsUrl.pathname === "" || wsUrl.pathname === "/") {
      wsUrl.pathname = "/api/broadcast";
    } else {
      wsUrl.pathname = wsUrl.pathname + "/api/broadcast";
    }
    return wsUrl.href;
  };

  // node_modules/@supabase/phoenix/priv/static/phoenix.mjs
  var closure = (value) => {
    if (typeof value === "function") {
      return (
        /** @type {() => T} */
        value
      );
    } else {
      let closure2 = function() {
        return value;
      };
      return closure2;
    }
  };
  var globalSelf = typeof self !== "undefined" ? self : null;
  var phxWindow = typeof window !== "undefined" ? window : null;
  var global2 = globalSelf || phxWindow || globalThis;
  var DEFAULT_VSN2 = "2.0.0";
  var DEFAULT_TIMEOUT2 = 1e4;
  var WS_CLOSE_NORMAL = 1e3;
  var MAX_LONGPOLL_BATCH_SIZE = 100;
  var SOCKET_STATES = (
    /** @type {const} */
    { connecting: 0, open: 1, closing: 2, closed: 3 }
  );
  var CHANNEL_STATES2 = (
    /** @type {const} */
    {
      closed: "closed",
      errored: "errored",
      joined: "joined",
      joining: "joining",
      leaving: "leaving"
    }
  );
  var CHANNEL_EVENTS2 = (
    /** @type {const} */
    {
      close: "phx_close",
      error: "phx_error",
      join: "phx_join",
      reply: "phx_reply",
      leave: "phx_leave"
    }
  );
  var TRANSPORTS = (
    /** @type {const} */
    {
      longpoll: "longpoll",
      websocket: "websocket"
    }
  );
  var XHR_STATES = (
    /** @type {const} */
    {
      complete: 4
    }
  );
  var AUTH_TOKEN_PREFIX = "base64url.bearer.phx.";
  var Push = class {
    /**
     * Initializes the Push
     * @param {Channel} channel - The Channel
     * @param {ChannelEvent} event - The event, for example `"phx_join"`
     * @param {() => Record<string, unknown>} payload - The payload, for example `{user_id: 123}`
     * @param {number} timeout - The push timeout in milliseconds
     */
    constructor(channel, event, payload, timeout) {
      this.channel = channel;
      this.event = event;
      this.payload = payload || function() {
        return {};
      };
      this.receivedResp = null;
      this.timeout = timeout;
      this.timeoutTimer = null;
      this.recHooks = [];
      this.sent = false;
      this.ref = void 0;
    }
    /**
     *
     * @param {number} timeout
     */
    resend(timeout) {
      this.timeout = timeout;
      this.reset();
      this.send();
    }
    /**
     *
     */
    send() {
      if (this.hasReceived("timeout")) {
        return;
      }
      this.startTimeout();
      this.sent = true;
      this.channel.socket.push({
        topic: this.channel.topic,
        event: this.event,
        payload: this.payload(),
        ref: this.ref,
        join_ref: this.channel.joinRef()
      });
    }
    /**
     *
     * @param {string} status
     * @param {(response: any) => void} callback
     */
    receive(status, callback) {
      if (this.hasReceived(status)) {
        callback(this.receivedResp.response);
      }
      this.recHooks.push({ status, callback });
      return this;
    }
    reset() {
      this.cancelRefEvent();
      this.ref = null;
      this.refEvent = null;
      this.receivedResp = null;
      this.sent = false;
    }
    destroy() {
      this.cancelRefEvent();
      this.cancelTimeout();
    }
    /**
     * @private
     */
    matchReceive({ status, response, _ref }) {
      this.recHooks.filter((h) => h.status === status).forEach((h) => h.callback(response));
    }
    /**
     * @private
     */
    cancelRefEvent() {
      if (!this.refEvent) {
        return;
      }
      this.channel.off(this.refEvent);
    }
    cancelTimeout() {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    startTimeout() {
      if (this.timeoutTimer) {
        this.cancelTimeout();
      }
      this.ref = this.channel.socket.makeRef();
      this.refEvent = this.channel.replyEventName(this.ref);
      this.channel.on(this.refEvent, (payload) => {
        this.cancelRefEvent();
        this.cancelTimeout();
        this.receivedResp = payload;
        this.matchReceive(payload);
      });
      this.timeoutTimer = setTimeout(() => {
        this.trigger("timeout", {});
      }, this.timeout);
    }
    /**
     * @private
     */
    hasReceived(status) {
      return this.receivedResp && this.receivedResp.status === status;
    }
    trigger(status, response) {
      this.channel.trigger(this.refEvent, { status, response });
    }
  };
  var Timer = class {
    /**
    * @param {() => void} callback
    * @param {(tries: number) => number} timerCalc
    */
    constructor(callback, timerCalc) {
      this.callback = callback;
      this.timerCalc = timerCalc;
      this.timer = void 0;
      this.tries = 0;
    }
    reset() {
      this.tries = 0;
      clearTimeout(this.timer);
    }
    /**
     * Cancels any previous scheduleTimeout and schedules callback
     */
    scheduleTimeout() {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.tries = this.tries + 1;
        this.callback();
      }, this.timerCalc(this.tries + 1));
    }
  };
  var Channel = class {
    /**
     * @param {string} topic
     * @param {Params | (() => Params)} params
     * @param {Socket} socket
     */
    constructor(topic, params, socket) {
      this.state = CHANNEL_STATES2.closed;
      this.topic = topic;
      this.params = closure(params || {});
      this.socket = socket;
      this.bindings = [];
      this.bindingRef = 0;
      this.timeout = this.socket.timeout;
      this.joinedOnce = false;
      this.joinPush = new Push(this, CHANNEL_EVENTS2.join, this.params, this.timeout);
      this.pushBuffer = [];
      this.stateChangeRefs = [];
      this.rejoinTimer = new Timer(() => {
        if (this.socket.isConnected()) {
          this.rejoin();
        }
      }, this.socket.rejoinAfterMs);
      this.stateChangeRefs.push(this.socket.onError(() => this.rejoinTimer.reset()));
      this.stateChangeRefs.push(
        this.socket.onOpen(() => {
          this.rejoinTimer.reset();
          if (this.isErrored()) {
            this.rejoin();
          }
        })
      );
      this.joinPush.receive("ok", () => {
        this.state = CHANNEL_STATES2.joined;
        this.rejoinTimer.reset();
        this.pushBuffer.forEach((pushEvent) => pushEvent.send());
        this.pushBuffer = [];
      });
      this.joinPush.receive("error", (reason) => {
        this.state = CHANNEL_STATES2.errored;
        if (this.socket.hasLogger()) this.socket.log("channel", `error ${this.topic}`, reason);
        if (this.socket.isConnected()) {
          this.rejoinTimer.scheduleTimeout();
        }
      });
      this.onClose(() => {
        this.rejoinTimer.reset();
        if (this.socket.hasLogger()) this.socket.log("channel", `close ${this.topic}`);
        this.state = CHANNEL_STATES2.closed;
        this.socket.remove(this);
      });
      this.onError((reason) => {
        if (this.socket.hasLogger()) this.socket.log("channel", `error ${this.topic}`, reason);
        if (this.isJoining()) {
          this.joinPush.reset();
        }
        this.state = CHANNEL_STATES2.errored;
        if (this.socket.isConnected()) {
          this.rejoinTimer.scheduleTimeout();
        }
      });
      this.joinPush.receive("timeout", () => {
        if (this.socket.hasLogger()) this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout);
        let leavePush = new Push(this, CHANNEL_EVENTS2.leave, closure({}), this.timeout);
        leavePush.send();
        this.state = CHANNEL_STATES2.errored;
        this.joinPush.reset();
        if (this.socket.isConnected()) {
          this.rejoinTimer.scheduleTimeout();
        }
      });
      this.on(CHANNEL_EVENTS2.reply, (payload, ref) => {
        this.trigger(this.replyEventName(ref), payload);
      });
    }
    /**
     * Join the channel
     * @param {number} timeout
     * @returns {Push}
     */
    join(timeout = this.timeout) {
      if (this.joinedOnce) {
        throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");
      } else {
        this.timeout = timeout;
        this.joinedOnce = true;
        this.rejoin();
        return this.joinPush;
      }
    }
    /**
     * Teardown the channel.
     *
     * Destroys and stops related timers.
     */
    teardown() {
      this.pushBuffer.forEach((push) => push.destroy());
      this.pushBuffer = [];
      this.rejoinTimer.reset();
      this.joinPush.destroy();
      this.state = CHANNEL_STATES2.closed;
      this.bindings = [];
    }
    /**
     * Hook into channel close
     * @param {ChannelBindingCallback} callback
     */
    onClose(callback) {
      this.on(CHANNEL_EVENTS2.close, callback);
    }
    /**
     * Hook into channel errors
     * @param {ChannelOnErrorCallback} callback
     * @return {number}
     */
    onError(callback) {
      return this.on(CHANNEL_EVENTS2.error, (reason) => callback(reason));
    }
    /**
     * Subscribes on channel events
     *
     * Subscription returns a ref counter, which can be used later to
     * unsubscribe the exact event listener
     *
     * @example
     * const ref1 = channel.on("event", do_stuff)
     * const ref2 = channel.on("event", do_other_stuff)
     * channel.off("event", ref1)
     * // Since unsubscription, do_stuff won't fire,
     * // while do_other_stuff will keep firing on the "event"
     *
     * @param {string} event
     * @param {ChannelBindingCallback} callback
     * @returns {number} ref
     */
    on(event, callback) {
      let ref = this.bindingRef++;
      this.bindings.push({ event, ref, callback });
      return ref;
    }
    /**
     * Unsubscribes off of channel events
     *
     * Use the ref returned from a channel.on() to unsubscribe one
     * handler, or pass nothing for the ref to unsubscribe all
     * handlers for the given event.
     *
     * @example
     * // Unsubscribe the do_stuff handler
     * const ref1 = channel.on("event", do_stuff)
     * channel.off("event", ref1)
     *
     * // Unsubscribe all handlers from event
     * channel.off("event")
     *
     * @param {string} event
     * @param {number} [ref]
     */
    off(event, ref) {
      this.bindings = this.bindings.filter((bind) => {
        return !(bind.event === event && (typeof ref === "undefined" || ref === bind.ref));
      });
    }
    /**
     * @private
     */
    canPush() {
      return this.socket.isConnected() && this.isJoined();
    }
    /**
     * Sends a message `event` to phoenix with the payload `payload`.
     * Phoenix receives this in the `handle_in(event, payload, socket)`
     * function. if phoenix replies or it times out (default 10000ms),
     * then optionally the reply can be received.
     *
     * @example
     * channel.push("event")
     *   .receive("ok", payload => console.log("phoenix replied:", payload))
     *   .receive("error", err => console.log("phoenix errored", err))
     *   .receive("timeout", () => console.log("timed out pushing"))
     * @param {string} event
     * @param {Object} payload
     * @param {number} [timeout]
     * @returns {Push}
     */
    push(event, payload, timeout = this.timeout) {
      payload = payload || {};
      if (!this.joinedOnce) {
        throw new Error(`tried to push '${event}' to '${this.topic}' before joining. Use channel.join() before pushing events`);
      }
      let pushEvent = new Push(this, event, function() {
        return payload;
      }, timeout);
      if (this.canPush()) {
        pushEvent.send();
      } else {
        pushEvent.startTimeout();
        this.pushBuffer.push(pushEvent);
      }
      return pushEvent;
    }
    /** Leaves the channel
     *
     * Unsubscribes from server events, and
     * instructs channel to terminate on server
     *
     * Triggers onClose() hooks
     *
     * To receive leave acknowledgements, use the `receive`
     * hook to bind to the server ack, ie:
     *
     * @example
     * channel.leave().receive("ok", () => alert("left!") )
     *
     * @param {number} timeout
     * @returns {Push}
     */
    leave(timeout = this.timeout) {
      this.rejoinTimer.reset();
      this.joinPush.cancelTimeout();
      this.state = CHANNEL_STATES2.leaving;
      let onClose = () => {
        if (this.socket.hasLogger()) this.socket.log("channel", `leave ${this.topic}`);
        this.trigger(CHANNEL_EVENTS2.close, "leave");
      };
      let leavePush = new Push(this, CHANNEL_EVENTS2.leave, closure({}), timeout);
      leavePush.receive("ok", () => onClose()).receive("timeout", () => onClose());
      leavePush.send();
      if (!this.canPush()) {
        leavePush.trigger("ok", {});
      }
      return leavePush;
    }
    /**
     * Overridable message hook
     *
     * Receives all events for specialized message handling
     * before dispatching to the channel callbacks.
     *
     * Must return the payload, modified or unmodified
     * @type{ChannelOnMessage}
     */
    onMessage(_event, payload, _ref) {
      return payload;
    }
    /**
     * Overridable filter hook
     *
     * If this function returns `true`, `binding`'s callback will be called.
     *
     * @type{ChannelFilterBindings}
     */
    filterBindings(_binding, _payload, _ref) {
      return true;
    }
    isMember(topic, event, payload, joinRef) {
      if (this.topic !== topic) {
        return false;
      }
      if (joinRef && joinRef !== this.joinRef()) {
        if (this.socket.hasLogger()) this.socket.log("channel", "dropping outdated message", { topic, event, payload, joinRef });
        return false;
      } else {
        return true;
      }
    }
    joinRef() {
      return this.joinPush.ref;
    }
    /**
     * @private
     */
    rejoin(timeout = this.timeout) {
      if (this.isLeaving()) {
        return;
      }
      this.socket.leaveOpenTopic(this.topic);
      this.state = CHANNEL_STATES2.joining;
      this.joinPush.resend(timeout);
    }
    /**
     * @param {string} event
     * @param {unknown} [payload]
     * @param {?string} [ref]
     * @param {?string} [joinRef]
     */
    trigger(event, payload, ref, joinRef) {
      let handledPayload = this.onMessage(event, payload, ref, joinRef);
      if (payload && !handledPayload) {
        throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");
      }
      let eventBindings = this.bindings.filter((bind) => bind.event === event && this.filterBindings(bind, payload, ref));
      for (let i = 0; i < eventBindings.length; i++) {
        let bind = eventBindings[i];
        bind.callback(handledPayload, ref, joinRef || this.joinRef());
      }
    }
    /**
    * @param {string} ref
    */
    replyEventName(ref) {
      return `chan_reply_${ref}`;
    }
    isClosed() {
      return this.state === CHANNEL_STATES2.closed;
    }
    isErrored() {
      return this.state === CHANNEL_STATES2.errored;
    }
    isJoined() {
      return this.state === CHANNEL_STATES2.joined;
    }
    isJoining() {
      return this.state === CHANNEL_STATES2.joining;
    }
    isLeaving() {
      return this.state === CHANNEL_STATES2.leaving;
    }
  };
  var Ajax = class {
    static request(method, endPoint, headers, body, timeout, ontimeout, callback) {
      if (global2.XDomainRequest) {
        let req = new global2.XDomainRequest();
        return this.xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback);
      } else if (global2.XMLHttpRequest) {
        let req = new global2.XMLHttpRequest();
        return this.xhrRequest(req, method, endPoint, headers, body, timeout, ontimeout, callback);
      } else if (global2.fetch && global2.AbortController) {
        return this.fetchRequest(method, endPoint, headers, body, timeout, ontimeout, callback);
      } else {
        throw new Error("No suitable XMLHttpRequest implementation found");
      }
    }
    static fetchRequest(method, endPoint, headers, body, timeout, ontimeout, callback) {
      let options2 = {
        method,
        headers,
        body
      };
      let controller = null;
      if (timeout) {
        controller = new AbortController();
        const _timeoutId = setTimeout(() => controller.abort(), timeout);
        options2.signal = controller.signal;
      }
      global2.fetch(endPoint, options2).then((response) => response.text()).then((data) => this.parseJSON(data)).then((data) => callback && callback(data)).catch((err) => {
        if (err.name === "AbortError" && ontimeout) {
          ontimeout();
        } else {
          callback && callback(null);
        }
      });
      return controller;
    }
    static xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback) {
      req.timeout = timeout;
      req.open(method, endPoint);
      req.onload = () => {
        let response = this.parseJSON(req.responseText);
        callback && callback(response);
      };
      if (ontimeout) {
        req.ontimeout = ontimeout;
      }
      req.onprogress = () => {
      };
      req.send(body);
      return req;
    }
    static xhrRequest(req, method, endPoint, headers, body, timeout, ontimeout, callback) {
      req.open(method, endPoint, true);
      req.timeout = timeout;
      for (let [key, value] of Object.entries(headers)) {
        req.setRequestHeader(key, value);
      }
      req.onerror = () => callback && callback(null);
      req.onreadystatechange = () => {
        if (req.readyState === XHR_STATES.complete && callback) {
          let response = this.parseJSON(req.responseText);
          callback(response);
        }
      };
      if (ontimeout) {
        req.ontimeout = ontimeout;
      }
      req.send(body);
      return req;
    }
    static parseJSON(resp) {
      if (!resp || resp === "") {
        return null;
      }
      try {
        return JSON.parse(resp);
      } catch {
        console && console.log("failed to parse JSON response", resp);
        return null;
      }
    }
    static serialize(obj, parentKey) {
      let queryStr = [];
      for (var key in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, key)) {
          continue;
        }
        let paramKey = parentKey ? `${parentKey}[${key}]` : key;
        let paramVal = obj[key];
        if (typeof paramVal === "object") {
          queryStr.push(this.serialize(paramVal, paramKey));
        } else {
          queryStr.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(paramVal));
        }
      }
      return queryStr.join("&");
    }
    static appendParams(url, params) {
      if (Object.keys(params).length === 0) {
        return url;
      }
      let prefix = url.match(/\?/) ? "&" : "?";
      return `${url}${prefix}${this.serialize(params)}`;
    }
  };
  var arrayBufferToBase64 = (buffer) => {
    let binary = "";
    let bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };
  var LongPoll = class {
    constructor(endPoint, protocols) {
      if (protocols && protocols.length === 2 && protocols[1].startsWith(AUTH_TOKEN_PREFIX)) {
        this.authToken = atob(protocols[1].slice(AUTH_TOKEN_PREFIX.length));
      }
      this.endPoint = null;
      this.token = null;
      this.skipHeartbeat = true;
      this.reqs = /* @__PURE__ */ new Set();
      this.awaitingBatchAck = false;
      this.currentBatch = null;
      this.currentBatchTimer = null;
      this.batchBuffer = [];
      this.onopen = function() {
      };
      this.onerror = function() {
      };
      this.onmessage = function() {
      };
      this.onclose = function() {
      };
      this.pollEndpoint = this.normalizeEndpoint(endPoint);
      this.readyState = SOCKET_STATES.connecting;
      setTimeout(() => this.poll(), 0);
    }
    normalizeEndpoint(endPoint) {
      return endPoint.replace("ws://", "http://").replace("wss://", "https://").replace(new RegExp("(.*)/" + TRANSPORTS.websocket), "$1/" + TRANSPORTS.longpoll);
    }
    endpointURL() {
      return Ajax.appendParams(this.pollEndpoint, { token: this.token });
    }
    closeAndRetry(code, reason, wasClean) {
      this.close(code, reason, wasClean);
      this.readyState = SOCKET_STATES.connecting;
    }
    ontimeout() {
      this.onerror("timeout");
      this.closeAndRetry(1005, "timeout", false);
    }
    isActive() {
      return this.readyState === SOCKET_STATES.open || this.readyState === SOCKET_STATES.connecting;
    }
    poll() {
      const headers = { "Accept": "application/json" };
      if (this.authToken) {
        headers["X-Phoenix-AuthToken"] = this.authToken;
      }
      this.ajax("GET", headers, null, () => this.ontimeout(), (resp) => {
        if (resp) {
          var { status, token, messages } = resp;
          if (status === 410 && this.token !== null) {
            this.onerror(410);
            this.closeAndRetry(3410, "session_gone", false);
            return;
          }
          this.token = token;
        } else {
          status = 0;
        }
        switch (status) {
          case 200:
            messages.forEach((msg) => {
              setTimeout(() => this.onmessage({ data: msg }), 0);
            });
            this.poll();
            break;
          case 204:
            this.poll();
            break;
          case 410:
            this.readyState = SOCKET_STATES.open;
            this.onopen({});
            this.poll();
            break;
          case 403:
            this.onerror(403);
            this.close(1008, "forbidden", false);
            break;
          case 0:
          case 500:
            this.onerror(500);
            this.closeAndRetry(1011, "internal server error", 500);
            break;
          default:
            throw new Error(`unhandled poll status ${status}`);
        }
      });
    }
    // we collect all pushes within the current event loop by
    // setTimeout 0, which optimizes back-to-back procedural
    // pushes against an empty buffer
    send(body) {
      if (typeof body !== "string") {
        body = arrayBufferToBase64(body);
      }
      if (this.currentBatch) {
        this.currentBatch.push(body);
      } else if (this.awaitingBatchAck) {
        this.batchBuffer.push(body);
      } else {
        this.currentBatch = [body];
        this.currentBatchTimer = setTimeout(() => {
          this.batchSend(this.currentBatch);
          this.currentBatch = null;
        }, 0);
      }
    }
    batchSend(messages, offset = 0) {
      this.awaitingBatchAck = true;
      const next = offset + MAX_LONGPOLL_BATCH_SIZE;
      const batch = messages.slice(offset, next);
      this.ajax("POST", { "Content-Type": "application/x-ndjson" }, batch.join("\n"), () => this.onerror("timeout"), (resp) => {
        if (!resp || resp.status !== 200) {
          this.awaitingBatchAck = false;
          this.onerror(resp && resp.status);
          this.closeAndRetry(1011, "internal server error", false);
        } else if (next < messages.length) {
          this.batchSend(messages, next);
        } else if (this.batchBuffer.length > 0) {
          this.batchSend(this.batchBuffer);
          this.batchBuffer = [];
        } else {
          this.awaitingBatchAck = false;
        }
      });
    }
    close(code, reason, wasClean) {
      for (let req of this.reqs) {
        req.abort();
      }
      this.readyState = SOCKET_STATES.closed;
      let opts = Object.assign({ code: 1e3, reason: void 0, wasClean: true }, { code, reason, wasClean });
      this.batchBuffer = [];
      clearTimeout(this.currentBatchTimer);
      this.currentBatchTimer = null;
      if (typeof CloseEvent !== "undefined") {
        this.onclose(new CloseEvent("close", opts));
      } else {
        this.onclose(opts);
      }
    }
    ajax(method, headers, body, onCallerTimeout, callback) {
      let req;
      let ontimeout = () => {
        this.reqs.delete(req);
        onCallerTimeout();
      };
      req = Ajax.request(method, this.endpointURL(), headers, body, this.timeout, ontimeout, (resp) => {
        this.reqs.delete(req);
        if (this.isActive()) {
          callback(resp);
        }
      });
      this.reqs.add(req);
    }
  };
  var Presence = class _Presence {
    /**
     * Initializes the Presence
     * @param {Channel} channel - The Channel
     * @param {PresenceOptions} [opts] - The options, for example `{events: {state: "state", diff: "diff"}}`
     */
    constructor(channel, opts = {}) {
      let events = opts.events || /** @type {PresenceEvents} */
      { state: "presence_state", diff: "presence_diff" };
      this.state = /* @__PURE__ */ Object.create(null);
      this.pendingDiffs = [];
      this.channel = channel;
      this.joinRef = null;
      this.caller = {
        onJoin: function() {
        },
        onLeave: function() {
        },
        onSync: function() {
        }
      };
      this.channel.on(events.state, (newState) => {
        let { onJoin, onLeave, onSync } = this.caller;
        this.joinRef = this.channel.joinRef();
        this.state = _Presence.syncState(this.state, newState, onJoin, onLeave);
        this.pendingDiffs.forEach((diff) => {
          this.state = _Presence.syncDiff(this.state, diff, onJoin, onLeave);
        });
        this.pendingDiffs = [];
        onSync();
      });
      this.channel.on(events.diff, (diff) => {
        let { onJoin, onLeave, onSync } = this.caller;
        if (this.inPendingSyncState()) {
          this.pendingDiffs.push(diff);
        } else {
          this.state = _Presence.syncDiff(this.state, diff, onJoin, onLeave);
          onSync();
        }
      });
    }
    /**
     * @param {PresenceOnJoin} callback
     */
    onJoin(callback) {
      this.caller.onJoin = callback;
    }
    /**
     * @param {PresenceOnLeave} callback
     */
    onLeave(callback) {
      this.caller.onLeave = callback;
    }
    /**
     * @param {PresenceOnSync} callback
     */
    onSync(callback) {
      this.caller.onSync = callback;
    }
    /**
     * Returns the array of presences, with selected metadata.
     *
     * @template [T=PresenceState]
     * @param {((key: string, obj: PresenceState) => T)} [by]
     *
     * @returns {T[]}
     */
    list(by) {
      return _Presence.list(this.state, by);
    }
    inPendingSyncState() {
      return !this.joinRef || this.joinRef !== this.channel.joinRef();
    }
    // lower-level public static API
    /**
     * Used to sync the list of presences on the server
     * with the client's state. An optional `onJoin` and `onLeave` callback can
     * be provided to react to changes in the client's local presences across
     * disconnects and reconnects with the server.
     *
     * @param {Record<string, PresenceState>} currentState
     * @param {Record<string, PresenceState>} newState
     * @param {PresenceOnJoin} onJoin
     * @param {PresenceOnLeave} onLeave
     *
     * @returns {Record<string, PresenceState>}
     */
    static syncState(currentState, newState, onJoin, onLeave) {
      let state = this.toNullProtoObj(this.clone(currentState));
      newState = this.toNullProtoObj(newState);
      let joins = /* @__PURE__ */ Object.create(null);
      let leaves = /* @__PURE__ */ Object.create(null);
      this.map(state, (key, presence) => {
        if (!newState[key]) {
          leaves[key] = presence;
        }
      });
      this.map(newState, (key, newPresence) => {
        let currentPresence = state[key];
        if (currentPresence) {
          let newRefs = newPresence.metas.map((m) => m.phx_ref);
          let curRefs = currentPresence.metas.map((m) => m.phx_ref);
          let joinedMetas = newPresence.metas.filter((m) => curRefs.indexOf(m.phx_ref) < 0);
          let leftMetas = currentPresence.metas.filter((m) => newRefs.indexOf(m.phx_ref) < 0);
          if (joinedMetas.length > 0) {
            joins[key] = newPresence;
            joins[key].metas = joinedMetas;
          }
          if (leftMetas.length > 0) {
            leaves[key] = this.clone(currentPresence);
            leaves[key].metas = leftMetas;
          }
        } else {
          joins[key] = newPresence;
        }
      });
      return this.syncDiff(state, { joins, leaves }, onJoin, onLeave);
    }
    /**
     *
     * Used to sync a diff of presence join and leave
     * events from the server, as they happen. Like `syncState`, `syncDiff`
     * accepts optional `onJoin` and `onLeave` callbacks to react to a user
     * joining or leaving from a device.
     *
     * @param {Record<string, PresenceState>} state
     * @param {PresenceDiff} diff
     * @param {PresenceOnJoin} onJoin
     * @param {PresenceOnLeave} onLeave
     *
     * @returns {Record<string, PresenceState>}
     */
    static syncDiff(state, diff, onJoin, onLeave) {
      state = this.toNullProtoObj(state);
      let { joins, leaves } = this.clone(diff);
      if (!onJoin) {
        onJoin = function() {
        };
      }
      if (!onLeave) {
        onLeave = function() {
        };
      }
      this.map(joins, (key, newPresence) => {
        let currentPresence = state[key];
        state[key] = this.clone(newPresence);
        if (currentPresence) {
          let joinedRefs = state[key].metas.map((m) => m.phx_ref);
          let curMetas = currentPresence.metas.filter((m) => joinedRefs.indexOf(m.phx_ref) < 0);
          state[key].metas.unshift(...curMetas);
        }
        onJoin(key, currentPresence, newPresence);
      });
      this.map(leaves, (key, leftPresence) => {
        let currentPresence = state[key];
        if (!currentPresence) {
          return;
        }
        let refsToRemove = leftPresence.metas.map((m) => m.phx_ref);
        currentPresence.metas = currentPresence.metas.filter((p) => {
          return refsToRemove.indexOf(p.phx_ref) < 0;
        });
        onLeave(key, currentPresence, leftPresence);
        if (currentPresence.metas.length === 0) {
          delete state[key];
        }
      });
      return state;
    }
    /**
     * Returns the array of presences, with selected metadata.
     *
     * @template [T=PresenceState]
     * @param {Record<string, PresenceState>} presences
     * @param {((key: string, obj: PresenceState) => T)} [chooser]
     *
     * @returns {T[]}
     */
    static list(presences, chooser) {
      if (!chooser) {
        chooser = function(key, pres) {
          return pres;
        };
      }
      return this.map(presences, (key, presence) => {
        return chooser(key, presence);
      });
    }
    // private
    /**
    * @template T
    * @param {Record<string, PresenceState>} obj
    * @param {(key: string, obj: PresenceState) => T} func
    */
    static map(obj, func) {
      return Object.getOwnPropertyNames(obj).map((key) => func(key, obj[key]));
    }
    // Presence keys are chosen on the server and may collide with
    // Object.prototype properties ("__proto__", "constructor", ...), so any
    // object indexed by presence key must not have a prototype chain
    //
    // TODO: replace the null-prototype objects with Maps in Phoenix 2.0
    // (breaking change for the lower-level static API)
    static toNullProtoObj(obj) {
      if (Object.getPrototypeOf(obj) === null) {
        return obj;
      }
      let cleaned = /* @__PURE__ */ Object.create(null);
      Object.getOwnPropertyNames(obj).forEach((key) => {
        cleaned[key] = obj[key];
      });
      return cleaned;
    }
    /**
    * @template T
    * @param {T} obj
    * @returns {T}
    */
    static clone(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  };
  var serializer_default2 = {
    HEADER_LENGTH: 1,
    META_LENGTH: 4,
    KINDS: { push: 0, reply: 1, broadcast: 2 },
    /**
    * @template T
    * @param {Message<Record<string, any>>} msg
    * @param {(msg: ArrayBuffer | string) => T} callback
    * @returns {T}
    */
    encode(msg, callback) {
      if (msg.payload.constructor === ArrayBuffer) {
        return callback(this.binaryEncode(msg));
      } else {
        let payload = [msg.join_ref, msg.ref, msg.topic, msg.event, msg.payload];
        return callback(JSON.stringify(payload));
      }
    },
    /**
    * @template T
    * @param {ArrayBuffer | string} rawPayload
    * @param {(msg: Message<unknown>) => T} callback
    * @returns {T}
    */
    decode(rawPayload, callback) {
      if (rawPayload.constructor === ArrayBuffer) {
        return callback(this.binaryDecode(rawPayload));
      } else {
        let [join_ref, ref, topic, event, payload] = JSON.parse(rawPayload);
        return callback({ join_ref, ref, topic, event, payload });
      }
    },
    /** @private */
    binaryEncode(message) {
      let { join_ref, ref, event, topic, payload } = message;
      let encoder = new TextEncoder();
      let joinRefBytes = encoder.encode(join_ref);
      let refBytes = encoder.encode(ref);
      let topicBytes = encoder.encode(topic);
      let eventBytes = encoder.encode(event);
      this.assertFieldSize(joinRefBytes.byteLength, "join_ref");
      this.assertFieldSize(refBytes.byteLength, "ref");
      this.assertFieldSize(topicBytes.byteLength, "topic");
      this.assertFieldSize(eventBytes.byteLength, "event");
      let metaLength = this.META_LENGTH + joinRefBytes.byteLength + refBytes.byteLength + topicBytes.byteLength + eventBytes.byteLength;
      let header = new ArrayBuffer(this.HEADER_LENGTH + metaLength);
      let headerBytes = new Uint8Array(header);
      let view = new DataView(header);
      let offset = 0;
      view.setUint8(offset++, this.KINDS.push);
      view.setUint8(offset++, joinRefBytes.byteLength);
      view.setUint8(offset++, refBytes.byteLength);
      view.setUint8(offset++, topicBytes.byteLength);
      view.setUint8(offset++, eventBytes.byteLength);
      headerBytes.set(joinRefBytes, offset);
      offset += joinRefBytes.byteLength;
      headerBytes.set(refBytes, offset);
      offset += refBytes.byteLength;
      headerBytes.set(topicBytes, offset);
      offset += topicBytes.byteLength;
      headerBytes.set(eventBytes, offset);
      offset += eventBytes.byteLength;
      var combined = new Uint8Array(header.byteLength + payload.byteLength);
      combined.set(headerBytes, 0);
      combined.set(new Uint8Array(payload), header.byteLength);
      return combined.buffer;
    },
    assertFieldSize(size, name) {
      if (size > 255) {
        throw new Error(`unable to convert ${name} to binary: must be less than or equal to 255 bytes, but is ${size} bytes`);
      }
    },
    /**
    * @private
    */
    binaryDecode(buffer) {
      let view = new DataView(buffer);
      let kind = view.getUint8(0);
      let decoder = new TextDecoder();
      switch (kind) {
        case this.KINDS.push:
          return this.decodePush(buffer, view, decoder);
        case this.KINDS.reply:
          return this.decodeReply(buffer, view, decoder);
        case this.KINDS.broadcast:
          return this.decodeBroadcast(buffer, view, decoder);
      }
    },
    /** @private */
    decodePush(buffer, view, decoder) {
      let joinRefSize = view.getUint8(1);
      let topicSize = view.getUint8(2);
      let eventSize = view.getUint8(3);
      let offset = this.HEADER_LENGTH + this.META_LENGTH - 1;
      let joinRef = decoder.decode(buffer.slice(offset, offset + joinRefSize));
      offset = offset + joinRefSize;
      let topic = decoder.decode(buffer.slice(offset, offset + topicSize));
      offset = offset + topicSize;
      let event = decoder.decode(buffer.slice(offset, offset + eventSize));
      offset = offset + eventSize;
      let data = buffer.slice(offset, buffer.byteLength);
      return { join_ref: joinRef, ref: null, topic, event, payload: data };
    },
    /** @private */
    decodeReply(buffer, view, decoder) {
      let joinRefSize = view.getUint8(1);
      let refSize = view.getUint8(2);
      let topicSize = view.getUint8(3);
      let eventSize = view.getUint8(4);
      let offset = this.HEADER_LENGTH + this.META_LENGTH;
      let joinRef = decoder.decode(buffer.slice(offset, offset + joinRefSize));
      offset = offset + joinRefSize;
      let ref = decoder.decode(buffer.slice(offset, offset + refSize));
      offset = offset + refSize;
      let topic = decoder.decode(buffer.slice(offset, offset + topicSize));
      offset = offset + topicSize;
      let event = decoder.decode(buffer.slice(offset, offset + eventSize));
      offset = offset + eventSize;
      let data = buffer.slice(offset, buffer.byteLength);
      let payload = { status: event, response: data };
      return { join_ref: joinRef, ref, topic, event: CHANNEL_EVENTS2.reply, payload };
    },
    /** @private */
    decodeBroadcast(buffer, view, decoder) {
      let topicSize = view.getUint8(1);
      let eventSize = view.getUint8(2);
      let offset = this.HEADER_LENGTH + 2;
      let topic = decoder.decode(buffer.slice(offset, offset + topicSize));
      offset = offset + topicSize;
      let event = decoder.decode(buffer.slice(offset, offset + eventSize));
      offset = offset + eventSize;
      let data = buffer.slice(offset, buffer.byteLength);
      return { join_ref: null, ref: null, topic, event, payload: data };
    }
  };
  var Socket = class {
    /** Initializes the Socket *
     *
     * For IE8 support use an ES5-shim (https://github.com/es-shims/es5-shim)
     *
     * @constructor
     * @param {string} endPoint - The string WebSocket endpoint, ie, `"ws://example.com/socket"`,
     *                                               `"wss://example.com"`
     *                                               `"/socket"` (inherited host & protocol)
     * @param {SocketOptions} [opts] - Optional configuration
     */
    constructor(endPoint, opts = {}) {
      this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] };
      this.channels = [];
      this.sendBuffer = [];
      this.ref = 0;
      this.fallbackRef = null;
      this.timeout = opts.timeout || DEFAULT_TIMEOUT2;
      this.transport = opts.transport || global2.WebSocket || LongPoll;
      this.conn = void 0;
      this.primaryPassedHealthCheck = false;
      this.longPollFallbackMs = opts.longPollFallbackMs;
      this.fallbackTimer = null;
      let envSessionStorage = null;
      try {
        envSessionStorage = global2 && global2.sessionStorage;
      } catch {
      }
      this.sessionStore = opts.sessionStorage || envSessionStorage;
      this.establishedConnections = 0;
      this.defaultEncoder = serializer_default2.encode.bind(serializer_default2);
      this.defaultDecoder = serializer_default2.decode.bind(serializer_default2);
      this.closeWasClean = true;
      this.disconnecting = false;
      this.binaryType = opts.binaryType || "arraybuffer";
      this.connectClock = 1;
      this.pageHidden = false;
      this.encode = void 0;
      this.decode = void 0;
      if (this.transport !== LongPoll) {
        this.encode = opts.encode || this.defaultEncoder;
        this.decode = opts.decode || this.defaultDecoder;
      } else {
        this.encode = this.defaultEncoder;
        this.decode = this.defaultDecoder;
      }
      let awaitingConnectionOnPageShow = null;
      if (phxWindow && phxWindow.addEventListener) {
        phxWindow.addEventListener("pagehide", (_e) => {
          if (this.conn) {
            this.disconnect();
            awaitingConnectionOnPageShow = this.connectClock;
          }
        });
        phxWindow.addEventListener("pageshow", (_e) => {
          if (awaitingConnectionOnPageShow === this.connectClock) {
            awaitingConnectionOnPageShow = null;
            this.connect();
          }
        });
        phxWindow.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "hidden") {
            this.pageHidden = true;
          } else {
            this.pageHidden = false;
            if (!this.isConnected() && !this.closeWasClean) {
              this.teardown(() => this.connect());
            }
          }
        });
      }
      this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 3e4;
      this.autoSendHeartbeat = opts.autoSendHeartbeat ?? true;
      this.heartbeatCallback = opts.heartbeatCallback ?? (() => {
      });
      this.rejoinAfterMs = (tries) => {
        if (opts.rejoinAfterMs) {
          return opts.rejoinAfterMs(tries);
        } else {
          return [1e3, 2e3, 5e3][tries - 1] || 1e4;
        }
      };
      this.reconnectAfterMs = (tries) => {
        if (opts.reconnectAfterMs) {
          return opts.reconnectAfterMs(tries);
        } else {
          return [10, 50, 100, 150, 200, 250, 500, 1e3, 2e3][tries - 1] || 5e3;
        }
      };
      this.logger = opts.logger || null;
      if (!this.logger && opts.debug) {
        this.logger = (kind, msg, data) => {
          console.log(`${kind}: ${msg}`, data);
        };
      }
      this.longpollerTimeout = opts.longpollerTimeout || 2e4;
      this.params = closure(opts.params || {});
      this.endPoint = `${endPoint}/${TRANSPORTS.websocket}`;
      this.vsn = opts.vsn || DEFAULT_VSN2;
      this.heartbeatTimeoutTimer = null;
      this.heartbeatTimer = null;
      this.heartbeatSentAt = null;
      this.pendingHeartbeatRef = null;
      this.reconnectTimer = new Timer(() => {
        if (this.pageHidden) {
          this.log("Not reconnecting as page is hidden!");
          this.teardown();
          return;
        }
        this.teardown(async () => {
          if (opts.beforeReconnect) await opts.beforeReconnect();
          this.connect();
        });
      }, this.reconnectAfterMs);
      this.authToken = opts.authToken && closure(opts.authToken);
    }
    /**
     * Returns the LongPoll transport reference
     */
    getLongPollTransport() {
      return LongPoll;
    }
    /**
     * Disconnects and replaces the active transport
     *
     * @param {SocketTransport} newTransport - The new transport class to instantiate
     *
     */
    replaceTransport(newTransport) {
      this.connectClock++;
      this.closeWasClean = true;
      clearTimeout(this.fallbackTimer);
      this.reconnectTimer.reset();
      if (this.conn) {
        this.conn.close();
        this.conn = null;
      }
      this.transport = newTransport;
    }
    /**
     * Returns the socket protocol
     *
     * @returns {"wss" | "ws"}
     */
    protocol() {
      return location.protocol.match(/^https/) ? "wss" : "ws";
    }
    /**
     * The fully qualified socket url
     *
     * @returns {string}
     */
    endPointURL() {
      let uri = Ajax.appendParams(
        Ajax.appendParams(this.endPoint, this.params()),
        { vsn: this.vsn }
      );
      if (uri.charAt(0) !== "/") {
        return uri;
      }
      if (uri.charAt(1) === "/") {
        return `${this.protocol()}:${uri}`;
      }
      return `${this.protocol()}://${location.host}${uri}`;
    }
    /**
     * Disconnects the socket
     *
     * See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes for valid status codes.
     *
     * @param {() => void} [callback] - Optional callback which is called after socket is disconnected.
     * @param {number} [code] - A status code for disconnection (Optional).
     * @param {string} [reason] - A textual description of the reason to disconnect. (Optional)
     */
    disconnect(callback, code, reason) {
      this.connectClock++;
      this.disconnecting = true;
      this.closeWasClean = true;
      clearTimeout(this.fallbackTimer);
      this.reconnectTimer.reset();
      this.teardown(() => {
        this.disconnecting = false;
        callback && callback();
      }, code, reason);
    }
    /**
     * @param {Params} [params] - [DEPRECATED] The params to send when connecting, for example `{user_id: userToken}`
     *
     * Passing params to connect is deprecated; pass them in the Socket constructor instead:
     * `new Socket("/socket", {params: {user_id: userToken}})`.
     */
    connect(params) {
      if (params) {
        console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor");
        this.params = closure(params);
      }
      if (this.conn && !this.disconnecting) {
        return;
      }
      if (this.longPollFallbackMs && this.transport !== LongPoll) {
        this.connectWithFallback(LongPoll, this.longPollFallbackMs);
      } else {
        this.transportConnect();
      }
    }
    /**
     * Logs the message. Override `this.logger` for specialized logging. noops by default
     * @param {string} kind
     * @param {string} msg
     * @param {Object} data
     */
    log(kind, msg, data) {
      this.logger && this.logger(kind, msg, data);
    }
    /**
     * Returns true if a logger has been set on this socket.
     */
    hasLogger() {
      return this.logger !== null;
    }
    /**
     * Registers callbacks for connection open events
     *
     * @example socket.onOpen(function(){ console.info("the socket was opened") })
     *
     * @param {SocketOnOpen} callback
     */
    onOpen(callback) {
      let ref = this.makeRef();
      this.stateChangeCallbacks.open.push([ref, callback]);
      return ref;
    }
    /**
     * Registers callbacks for connection close events
     * @param {SocketOnClose} callback
     * @returns {string}
     */
    onClose(callback) {
      let ref = this.makeRef();
      this.stateChangeCallbacks.close.push([ref, callback]);
      return ref;
    }
    /**
     * Registers callbacks for connection error events
     *
     * @example socket.onError(function(error){ alert("An error occurred") })
     *
     * @param {SocketOnError} callback
     * @returns {string}
     */
    onError(callback) {
      let ref = this.makeRef();
      this.stateChangeCallbacks.error.push([ref, callback]);
      return ref;
    }
    /**
     * Registers callbacks for connection message events
     * @param {SocketOnMessage} callback
     * @returns {string}
     */
    onMessage(callback) {
      let ref = this.makeRef();
      this.stateChangeCallbacks.message.push([ref, callback]);
      return ref;
    }
    /**
     * Sets a callback that receives lifecycle events for internal heartbeat messages.
     * Useful for instrumenting connection health (e.g. sent/ok/timeout/disconnected).
     * @param {HeartbeatCallback} callback
     */
    onHeartbeat(callback) {
      this.heartbeatCallback = callback;
    }
    /**
     * Pings the server and invokes the callback with the RTT in milliseconds
     * @param {(timeDelta: number) => void} callback
     *
     * Returns true if the ping was pushed or false if unable to be pushed.
     */
    ping(callback) {
      if (!this.isConnected()) {
        return false;
      }
      let ref = this.makeRef();
      let startTime = Date.now();
      this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref });
      let onMsgRef = this.onMessage((msg) => {
        if (msg.ref === ref) {
          this.off([onMsgRef]);
          callback(Date.now() - startTime);
        }
      });
      return true;
    }
    /**
     * @private
     *
     * @param {Function}
     */
    transportName(transport) {
      switch (transport) {
        case LongPoll:
          return "LongPoll";
        default:
          return transport.name;
      }
    }
    /**
     * @private
     */
    transportConnect() {
      this.connectClock++;
      this.closeWasClean = false;
      let protocols = void 0;
      if (this.authToken) {
        protocols = ["phoenix", `${AUTH_TOKEN_PREFIX}${btoa(this.authToken()).replace(/=/g, "")}`];
      }
      this.conn = new this.transport(this.endPointURL(), protocols);
      this.conn.binaryType = this.binaryType;
      this.conn.timeout = this.longpollerTimeout;
      this.conn.onopen = () => this.onConnOpen();
      this.conn.onerror = (error) => this.onConnError(error);
      this.conn.onmessage = (event) => this.onConnMessage(event);
      this.conn.onclose = (event) => this.onConnClose(event);
    }
    getSession(key) {
      return this.sessionStore && this.sessionStore.getItem(key);
    }
    storeSession(key, val) {
      this.sessionStore && this.sessionStore.setItem(key, val);
    }
    connectWithFallback(fallbackTransport, fallbackThreshold = 2500) {
      clearTimeout(this.fallbackTimer);
      let established = false;
      let primaryTransport = true;
      let openRef, errorRef;
      let fallbackTransportName = this.transportName(fallbackTransport);
      let fallback = (reason) => {
        this.log("transport", `falling back to ${fallbackTransportName}...`, reason);
        this.off([openRef, errorRef]);
        primaryTransport = false;
        this.replaceTransport(fallbackTransport);
        this.transportConnect();
      };
      if (this.getSession(`phx:fallback:${fallbackTransportName}`)) {
        return fallback("memorized");
      }
      this.fallbackTimer = setTimeout(fallback, fallbackThreshold);
      errorRef = this.onError((reason) => {
        this.log("transport", "error", reason);
        if (primaryTransport && !established) {
          clearTimeout(this.fallbackTimer);
          fallback(reason);
        }
      });
      if (this.fallbackRef) {
        this.off([this.fallbackRef]);
      }
      this.fallbackRef = this.onOpen(() => {
        established = true;
        if (!primaryTransport) {
          let fallbackTransportName2 = this.transportName(fallbackTransport);
          if (!this.primaryPassedHealthCheck) {
            this.storeSession(`phx:fallback:${fallbackTransportName2}`, "true");
          }
          return this.log("transport", `established ${fallbackTransportName2} fallback`);
        }
        clearTimeout(this.fallbackTimer);
        this.fallbackTimer = setTimeout(fallback, fallbackThreshold);
        this.ping((rtt) => {
          this.log("transport", "connected to primary after", rtt);
          this.primaryPassedHealthCheck = true;
          clearTimeout(this.fallbackTimer);
        });
      });
      this.transportConnect();
    }
    clearHeartbeats() {
      clearTimeout(this.heartbeatTimer);
      clearTimeout(this.heartbeatTimeoutTimer);
    }
    onConnOpen() {
      if (this.hasLogger()) this.log("transport", `connected to ${this.endPointURL()}`);
      this.closeWasClean = false;
      this.disconnecting = false;
      this.establishedConnections++;
      this.flushSendBuffer();
      this.reconnectTimer.reset();
      if (this.autoSendHeartbeat) {
        this.resetHeartbeat();
      }
      this.triggerStateCallbacks("open");
    }
    /**
     * @private
     */
    heartbeatTimeout() {
      if (this.pendingHeartbeatRef) {
        this.pendingHeartbeatRef = null;
        this.heartbeatSentAt = null;
        if (this.hasLogger()) {
          this.log("transport", "heartbeat timeout. Attempting to re-establish connection");
        }
        try {
          this.heartbeatCallback("timeout");
        } catch (e) {
          this.log("error", "error in heartbeat callback", e);
        }
        this.triggerChanError(new Error("heartbeat timeout"));
        this.closeWasClean = false;
        this.teardown(() => this.reconnectTimer.scheduleTimeout(), WS_CLOSE_NORMAL, "heartbeat timeout");
      }
    }
    resetHeartbeat() {
      if (this.conn && this.conn.skipHeartbeat) {
        return;
      }
      this.pendingHeartbeatRef = null;
      this.clearHeartbeats();
      this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
    }
    teardown(callback, code, reason) {
      if (!this.conn) {
        return callback && callback();
      }
      const connToClose = this.conn;
      this.waitForBufferDone(connToClose, () => {
        if (code) {
          connToClose.close(code, reason || "");
        } else {
          connToClose.close();
        }
        this.waitForSocketClosed(connToClose, () => {
          if (this.conn === connToClose) {
            this.conn.onopen = function() {
            };
            this.conn.onerror = function() {
            };
            this.conn.onmessage = function() {
            };
            this.conn.onclose = function() {
            };
            this.conn = null;
          }
          callback && callback();
        });
      });
    }
    waitForBufferDone(conn, callback, tries = 1) {
      if (tries === 5 || !conn.bufferedAmount) {
        callback();
        return;
      }
      setTimeout(() => {
        this.waitForBufferDone(conn, callback, tries + 1);
      }, 150 * tries);
    }
    waitForSocketClosed(conn, callback, tries = 1) {
      if (tries === 5 || conn.readyState === SOCKET_STATES.closed) {
        callback();
        return;
      }
      setTimeout(() => {
        this.waitForSocketClosed(conn, callback, tries + 1);
      }, 150 * tries);
    }
    /**
    * @param {CloseEvent} event
    */
    onConnClose(event) {
      if (this.conn) this.conn.onclose = () => {
      };
      if (this.hasLogger()) this.log("transport", "close", event);
      this.triggerChanError(event);
      this.clearHeartbeats();
      if (!this.closeWasClean) {
        this.reconnectTimer.scheduleTimeout();
      }
      this.triggerStateCallbacks("close", event);
    }
    /**
     * @private
     * @param {Event} error
     */
    onConnError(error) {
      if (this.hasLogger()) this.log("transport", "error", error);
      let transportBefore = this.transport;
      let establishedBefore = this.establishedConnections;
      this.triggerStateCallbacks("error", error, transportBefore, establishedBefore);
      if (transportBefore === this.transport || establishedBefore > 0) {
        this.triggerChanError(error);
      }
    }
    /**
     * @private
     * @param {unknown} [reason] underlying close/error event forwarded to channel error listeners
     */
    triggerChanError(reason) {
      this.channels.forEach((channel) => {
        if (!(channel.isErrored() || channel.isLeaving() || channel.isClosed())) {
          channel.trigger(CHANNEL_EVENTS2.error, reason);
        }
      });
    }
    /**
     * @returns {string}
     */
    connectionState() {
      switch (this.conn && this.conn.readyState) {
        case SOCKET_STATES.connecting:
          return "connecting";
        case SOCKET_STATES.open:
          return "open";
        case SOCKET_STATES.closing:
          return "closing";
        default:
          return "closed";
      }
    }
    /**
     * @returns {boolean}
     */
    isConnected() {
      return this.connectionState() === "open";
    }
    /**
     *
     * @param {Channel} channel
     */
    remove(channel) {
      this.off(channel.stateChangeRefs);
      this.channels = this.channels.filter((c) => c !== channel);
    }
    /**
     * Removes `onOpen`, `onClose`, `onError,` and `onMessage` registrations.
     *
     * @param {string[]} refs - list of refs returned by calls to
     *                 `onOpen`, `onClose`, `onError,` and `onMessage`
     */
    off(refs) {
      for (let key in this.stateChangeCallbacks) {
        this.stateChangeCallbacks[key] = this.stateChangeCallbacks[key].filter(([ref]) => {
          return refs.indexOf(ref) === -1;
        });
      }
    }
    /**
     * Initiates a new channel for the given topic
     *
     * @param {string} topic
     * @param {Params | (() => Params)} [chanParams]- Parameters for the channel
     * @returns {Channel}
     */
    channel(topic, chanParams = {}) {
      let chan = new Channel(topic, chanParams, this);
      this.channels.push(chan);
      return chan;
    }
    /**
     * @param {Message<Record<string, any>>} data
     */
    push(data) {
      if (this.hasLogger()) {
        let { topic, event, payload, ref, join_ref } = data;
        this.log("push", `${topic} ${event} (${join_ref}, ${ref})`, payload);
      }
      if (this.isConnected()) {
        this.encode(data, (result) => this.conn.send(result));
      } else {
        this.sendBuffer.push(() => this.encode(data, (result) => this.conn.send(result)));
      }
    }
    /**
     * Return the next message ref, accounting for overflows
     * @returns {string}
     */
    makeRef() {
      let newRef = this.ref + 1;
      if (newRef === this.ref) {
        this.ref = 0;
      } else {
        this.ref = newRef;
      }
      return this.ref.toString();
    }
    sendHeartbeat() {
      if (!this.isConnected()) {
        try {
          this.heartbeatCallback("disconnected");
        } catch (e) {
          this.log("error", "error in heartbeat callback", e);
        }
        return;
      }
      if (this.pendingHeartbeatRef) {
        this.heartbeatTimeout();
        return;
      }
      this.pendingHeartbeatRef = this.makeRef();
      this.heartbeatSentAt = Date.now();
      this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.pendingHeartbeatRef });
      try {
        this.heartbeatCallback("sent");
      } catch (e) {
        this.log("error", "error in heartbeat callback", e);
      }
      this.heartbeatTimeoutTimer = setTimeout(() => this.heartbeatTimeout(), this.heartbeatIntervalMs);
    }
    flushSendBuffer() {
      if (this.isConnected() && this.sendBuffer.length > 0) {
        this.sendBuffer.forEach((callback) => callback());
        this.sendBuffer = [];
      }
    }
    /**
    * @param {MessageEvent<any>} rawMessage
    */
    onConnMessage(rawMessage) {
      this.decode(rawMessage.data, (msg) => {
        let { topic, event, payload, ref, join_ref } = msg;
        if (ref && ref === this.pendingHeartbeatRef) {
          const latency = this.heartbeatSentAt ? Date.now() - this.heartbeatSentAt : void 0;
          this.clearHeartbeats();
          try {
            this.heartbeatCallback(payload.status === "ok" ? "ok" : "error", latency);
          } catch (e) {
            this.log("error", "error in heartbeat callback", e);
          }
          this.pendingHeartbeatRef = null;
          this.heartbeatSentAt = null;
          if (this.autoSendHeartbeat) {
            this.heartbeatTimer = setTimeout(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
          }
        }
        if (this.hasLogger()) this.log("receive", `${payload.status || ""} ${topic} ${event} ${ref && "(" + ref + ")" || ""}`.trim(), payload);
        for (let i = 0; i < this.channels.length; i++) {
          const channel = this.channels[i];
          if (!channel.isMember(topic, event, payload, join_ref)) {
            continue;
          }
          channel.trigger(event, payload, ref, join_ref);
        }
        this.triggerStateCallbacks("message", msg);
      });
    }
    /**
     * @private
     * @template {keyof SocketStateChangeCallbacks} K
     * @param {K} event
     * @param {...Parameters<SocketStateChangeCallbacks[K][number][1]>} args
     * @returns {void}
     */
    triggerStateCallbacks(event, ...args) {
      try {
        this.stateChangeCallbacks[event].forEach(([_, callback]) => {
          try {
            callback(...args);
          } catch (e) {
            this.log("error", `error in ${event} callback`, e);
          }
        });
      } catch (e) {
        this.log("error", `error triggering ${event} callbacks`, e);
      }
    }
    leaveOpenTopic(topic) {
      let dupChannel = this.channels.find((c) => c.topic === topic && (c.isJoined() || c.isJoining()));
      if (dupChannel) {
        if (this.hasLogger()) this.log("transport", `leaving duplicate topic "${topic}"`);
        dupChannel.leave();
      }
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/phoenix/presenceAdapter.js
  var PresenceAdapter = class _PresenceAdapter {
    constructor(channel, opts) {
      const phoenixOptions = phoenixPresenceOptions(opts);
      this.presence = new Presence(channel.getChannel(), phoenixOptions);
      this.presence.onJoin((key, currentPresence, newPresence) => {
        const onJoinPayload = _PresenceAdapter.onJoinPayload(key, currentPresence, newPresence);
        channel.getChannel().trigger("presence", onJoinPayload);
      });
      this.presence.onLeave((key, currentPresence, leftPresence) => {
        const onLeavePayload = _PresenceAdapter.onLeavePayload(key, currentPresence, leftPresence);
        channel.getChannel().trigger("presence", onLeavePayload);
      });
      this.presence.onSync(() => {
        channel.getChannel().trigger("presence", { event: "sync" });
      });
    }
    get state() {
      return _PresenceAdapter.transformState(this.presence.state);
    }
    /**
     * @private
     * Remove 'metas' key
     * Change 'phx_ref' to 'presence_ref'
     * Remove 'phx_ref' and 'phx_ref_prev'
     *
     * @example Transform state
     * // returns {
     *  abc123: [
     *    { presence_ref: '2', user_id: 1 },
     *    { presence_ref: '3', user_id: 2 }
     *  ]
     * }
     * RealtimePresence.transformState({
     *  abc123: {
     *    metas: [
     *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
     *      { phx_ref: '3', user_id: 2 }
     *    ]
     *  }
     * })
     *
     */
    static transformState(state) {
      state = cloneState(state);
      return Object.getOwnPropertyNames(state).reduce((newState, key) => {
        const presences = state[key];
        newState[key] = transformState(presences);
        return newState;
      }, {});
    }
    static onJoinPayload(key, currentPresence, newPresence) {
      const currentPresences = parseCurrentPresences(currentPresence);
      const newPresences = transformState(newPresence);
      return {
        event: "join",
        key,
        currentPresences,
        newPresences
      };
    }
    static onLeavePayload(key, currentPresence, leftPresence) {
      const currentPresences = parseCurrentPresences(currentPresence);
      const leftPresences = transformState(leftPresence);
      return {
        event: "leave",
        key,
        currentPresences,
        leftPresences
      };
    }
  };
  function transformState(presences) {
    return presences.metas.map((presence) => {
      const descriptors = Object.getOwnPropertyDescriptors(presence);
      const transformedPresence = Object.defineProperties({}, descriptors);
      transformedPresence["presence_ref"] = transformedPresence["phx_ref"];
      delete transformedPresence["phx_ref"];
      delete transformedPresence["phx_ref_prev"];
      return transformedPresence;
    });
  }
  function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
  }
  function phoenixPresenceOptions(opts) {
    return (opts === null || opts === void 0 ? void 0 : opts.events) && { events: opts.events };
  }
  function parseCurrentPresences(currentPresences) {
    return (currentPresences === null || currentPresences === void 0 ? void 0 : currentPresences.metas) ? transformState(currentPresences) : [];
  }

  // node_modules/@supabase/realtime-js/dist/module/RealtimePresence.js
  var REALTIME_PRESENCE_LISTEN_EVENTS;
  (function(REALTIME_PRESENCE_LISTEN_EVENTS2) {
    REALTIME_PRESENCE_LISTEN_EVENTS2["SYNC"] = "sync";
    REALTIME_PRESENCE_LISTEN_EVENTS2["JOIN"] = "join";
    REALTIME_PRESENCE_LISTEN_EVENTS2["LEAVE"] = "leave";
  })(REALTIME_PRESENCE_LISTEN_EVENTS || (REALTIME_PRESENCE_LISTEN_EVENTS = {}));
  var RealtimePresence = class {
    get state() {
      return this.presenceAdapter.state;
    }
    /**
     * Creates a Presence helper that keeps the local presence state in sync with the server.
     *
     * @param channel - The realtime channel to bind to.
     * @param opts - Optional custom event names, e.g. `{ events: { state: 'state', diff: 'diff' } }`.
     *
     * @category Realtime
     *
     * @example Example for a presence channel
     * ```ts
     * const presence = new RealtimePresence(channel)
     *
     * channel.on('presence', ({ event, key }) => {
     *   console.log(`Presence ${event} on ${key}`)
     * })
     * ```
     */
    constructor(channel, opts) {
      this.channel = channel;
      this.presenceAdapter = new PresenceAdapter(this.channel.channelAdapter, opts);
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/lib/normalizeChannelError.js
  function normalizeChannelError(reason) {
    if (reason instanceof Error) {
      return reason;
    }
    if (typeof reason === "string") {
      return new Error(reason);
    }
    if (reason && typeof reason === "object") {
      const obj = reason;
      if (typeof obj.code === "number") {
        const detail = typeof obj.reason === "string" && obj.reason ? ` (${obj.reason})` : "";
        return new Error(`socket closed: ${obj.code}${detail}`, { cause: reason });
      }
      return new Error("channel error: transport failure", { cause: reason });
    }
    return new Error("channel error: connection lost");
  }

  // node_modules/@supabase/realtime-js/dist/module/phoenix/channelAdapter.js
  var ChannelAdapter = class {
    constructor(socket, topic, params) {
      const phoenixParams = phoenixChannelParams(params);
      this.channel = socket.getSocket().channel(topic, phoenixParams);
      this.socket = socket;
    }
    get state() {
      return this.channel.state;
    }
    set state(state) {
      this.channel.state = state;
    }
    get joinedOnce() {
      return this.channel.joinedOnce;
    }
    get joinPush() {
      return this.channel.joinPush;
    }
    get rejoinTimer() {
      return this.channel.rejoinTimer;
    }
    on(event, callback) {
      return this.channel.on(event, callback);
    }
    off(event, refNumber) {
      this.channel.off(event, refNumber);
    }
    subscribe(timeout) {
      return this.channel.join(timeout);
    }
    unsubscribe(timeout) {
      return this.channel.leave(timeout);
    }
    teardown() {
      this.channel.teardown();
    }
    onClose(callback) {
      this.channel.onClose(callback);
    }
    onError(callback) {
      return this.channel.onError(callback);
    }
    push(event, payload, timeout) {
      let push;
      try {
        push = this.channel.push(event, payload, timeout);
      } catch (error) {
        throw new Error(`tried to push '${event}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`);
      }
      if (this.channel.pushBuffer.length > MAX_PUSH_BUFFER_SIZE) {
        const removedPush = this.channel.pushBuffer.shift();
        removedPush.cancelTimeout();
        this.socket.log("channel", `discarded push due to buffer overflow: ${removedPush.event}`, removedPush.payload());
      }
      return push;
    }
    updateJoinPayload(payload) {
      const oldPayload = this.channel.joinPush.payload();
      this.channel.joinPush.payload = () => Object.assign(Object.assign({}, oldPayload), payload);
    }
    canPush() {
      return this.socket.isConnected() && this.state === CHANNEL_STATES.joined;
    }
    isJoined() {
      return this.state === CHANNEL_STATES.joined;
    }
    isJoining() {
      return this.state === CHANNEL_STATES.joining;
    }
    isClosed() {
      return this.state === CHANNEL_STATES.closed;
    }
    isLeaving() {
      return this.state === CHANNEL_STATES.leaving;
    }
    updateFilterBindings(filterBindings) {
      this.channel.filterBindings = filterBindings;
    }
    updatePayloadTransform(callback) {
      this.channel.onMessage = callback;
    }
    /**
     * @internal
     */
    getChannel() {
      return this.channel;
    }
  };
  function phoenixChannelParams(options2) {
    return {
      config: Object.assign({
        broadcast: { ack: false, self: false },
        presence: { key: "", enabled: false },
        private: false
      }, options2.config)
    };
  }

  // node_modules/@supabase/realtime-js/dist/module/RealtimePostgresFilterBuilder.js
  var PostgrestReservedCharsRegexp2 = /[,()"\\]/;
  var needsQuoting = (value) => PostgrestReservedCharsRegexp2.test(value) || value !== value.trim();
  var quote = (value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  var serializeScalar = (value) => {
    const serialized = value === null ? "null" : String(value);
    return needsQuoting(serialized) ? quote(serialized) : serialized;
  };
  var serializeIsValue = (value) => value === null ? "null" : String(value);
  var serialize = (operator, value) => {
    if (operator === "in") {
      const values = Array.isArray(value) ? value : [value];
      if (values.length === 0) {
        throw new Error("Realtime `in` filter requires at least one value.");
      }
      const items = Array.from(new Set(values)).map((v) => serializeScalar(v)).join(",");
      return `in.(${items})`;
    }
    if (operator === "is") {
      return `is.${serializeIsValue(value)}`;
    }
    return `${operator}.${serializeScalar(value)}`;
  };
  var RealtimePostgresFilterBuilder = class {
    constructor() {
      this.filters = [];
    }
    add(column, operator, value, negate = false) {
      const prefix = negate ? "not." : "";
      this.filters.push(`${column}=${prefix}${serialize(operator, value)}`);
      return this;
    }
    /** Match rows where `column` equals `value` (`column=eq.value`). */
    eq(column, value) {
      return this.add(column, "eq", value);
    }
    /** Match rows where `column` does not equal `value` (`column=neq.value`). */
    neq(column, value) {
      return this.add(column, "neq", value);
    }
    /** Match rows where `column` is greater than `value` (`column=gt.value`). */
    gt(column, value) {
      return this.add(column, "gt", value);
    }
    /** Match rows where `column` is greater than or equal to `value` (`column=gte.value`). */
    gte(column, value) {
      return this.add(column, "gte", value);
    }
    /** Match rows where `column` is less than `value` (`column=lt.value`). */
    lt(column, value) {
      return this.add(column, "lt", value);
    }
    /** Match rows where `column` is less than or equal to `value` (`column=lte.value`). */
    lte(column, value) {
      return this.add(column, "lte", value);
    }
    /**
     * Match rows where `column` is one of `values` (`column=in.(a,b,c)`).
     * Requires at least one value; duplicates are removed. An element containing a
     * reserved character is double-quoted (`in.("a,b",c)`), so commas inside an
     * element are preserved. `null` is intentionally not accepted (`IN (null)`
     * never matches in SQL) — use `is`/`not('col','is',null)` for null checks.
     */
    in(column, values) {
      return this.add(column, "in", values);
    }
    /** Match rows where `column` matches the case-sensitive `pattern` (`column=like.pattern`). */
    like(column, pattern) {
      return this.add(column, "like", pattern);
    }
    /** Match rows where `column` matches the case-insensitive `pattern` (`column=ilike.pattern`). */
    ilike(column, pattern) {
      return this.add(column, "ilike", pattern);
    }
    /** Match rows where `column` matches the POSIX regex `pattern` (`column=match.pattern`). */
    match(column, pattern) {
      return this.add(column, "match", pattern);
    }
    /** Match rows where `column` matches the case-insensitive POSIX regex `pattern` (`column=imatch.pattern`). */
    imatch(column, pattern) {
      return this.add(column, "imatch", pattern);
    }
    /**
     * Match rows where `column` `IS` the given value (`column=is.null`).
     * Accepts `null`, a boolean, or the keywords `'null' | 'true' | 'false' | 'unknown'`.
     */
    is(column, value) {
      return this.add(column, "is", value);
    }
    /** Match rows where `column` is distinct from `value` (`column=isdistinct.value`). NULL-safe inequality. */
    isDistinct(column, value) {
      return this.add(column, "isdistinct", value);
    }
    not(column, operator, value) {
      return this.add(column, operator, value, true);
    }
    /**
     * Serialize all conditions into the comma-separated (AND) filter string.
     *
     * Conditions are joined by commas, which the server applies as `AND`. A scalar
     * value (or single `in` element) that contains a reserved character — `,`,
     * `(`, `)`, `"`, `\` — or surrounding whitespace is double-quoted and escaped
     * the way PostgREST does, so commas inside a value are preserved rather than
     * read as a condition boundary.
     */
    build() {
      return this.filters.join(",");
    }
    /** Alias for {@link build}; lets the builder be used wherever a string is expected. */
    toString() {
      return this.build();
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/RealtimeChannel.js
  var REALTIME_POSTGRES_CHANGES_LISTEN_EVENT;
  (function(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2) {
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["ALL"] = "*";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["INSERT"] = "INSERT";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["UPDATE"] = "UPDATE";
    REALTIME_POSTGRES_CHANGES_LISTEN_EVENT2["DELETE"] = "DELETE";
  })(REALTIME_POSTGRES_CHANGES_LISTEN_EVENT || (REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {}));
  var REALTIME_LISTEN_TYPES;
  (function(REALTIME_LISTEN_TYPES2) {
    REALTIME_LISTEN_TYPES2["BROADCAST"] = "broadcast";
    REALTIME_LISTEN_TYPES2["PRESENCE"] = "presence";
    REALTIME_LISTEN_TYPES2["POSTGRES_CHANGES"] = "postgres_changes";
    REALTIME_LISTEN_TYPES2["SYSTEM"] = "system";
  })(REALTIME_LISTEN_TYPES || (REALTIME_LISTEN_TYPES = {}));
  var REALTIME_SUBSCRIBE_STATES;
  (function(REALTIME_SUBSCRIBE_STATES2) {
    REALTIME_SUBSCRIBE_STATES2["SUBSCRIBED"] = "SUBSCRIBED";
    REALTIME_SUBSCRIBE_STATES2["TIMED_OUT"] = "TIMED_OUT";
    REALTIME_SUBSCRIBE_STATES2["CLOSED"] = "CLOSED";
    REALTIME_SUBSCRIBE_STATES2["CHANNEL_ERROR"] = "CHANNEL_ERROR";
  })(REALTIME_SUBSCRIBE_STATES || (REALTIME_SUBSCRIBE_STATES = {}));
  var RealtimeChannel = class _RealtimeChannel {
    get state() {
      return this.channelAdapter.state;
    }
    set state(state) {
      this.channelAdapter.state = state;
    }
    get joinedOnce() {
      return this.channelAdapter.joinedOnce;
    }
    get timeout() {
      return this.socket.timeout;
    }
    get joinPush() {
      return this.channelAdapter.joinPush;
    }
    get rejoinTimer() {
      return this.channelAdapter.rejoinTimer;
    }
    /**
     * Creates a channel that can broadcast messages, sync presence, and listen to Postgres changes.
     *
     * The topic determines which realtime stream you are subscribing to. Config options let you
     * enable acknowledgement for broadcasts, presence tracking, or private channels.
     *
     * @category Realtime
     *
     * @example Using supabase-js (recommended)
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
     * const channel = supabase.channel('room1')
     * channel
     *   .on('broadcast', { event: 'cursor-pos' }, (payload) => console.log(payload))
     *   .subscribe()
     * ```
     *
     * @example Standalone import for bundle-sensitive environments
     * ```ts
     * import RealtimeClient from '@supabase/realtime-js'
     *
     * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
     *   params: { apikey: 'your-publishable-key' },
     * })
     * const channel = new RealtimeChannel('realtime:public:messages', { config: {} }, client)
     * ```
     */
    constructor(topic, params = { config: {} }, socket) {
      var _a, _b;
      this.topic = topic;
      this.params = params;
      this.socket = socket;
      this.bindings = {};
      this.subTopic = topic.replace(/^realtime:/i, "");
      this.params.config = Object.assign({
        broadcast: { ack: false, self: false },
        presence: { key: "", enabled: false },
        private: false
      }, params.config);
      this.channelAdapter = new ChannelAdapter(this.socket.socketAdapter, topic, this.params);
      this.presence = new RealtimePresence(this);
      this._onClose(() => {
        this.socket._remove(this);
      });
      this._updateFilterTransform();
      this.broadcastEndpointURL = httpEndpointURL(this.socket.socketAdapter.endPointURL());
      this.private = this.params.config.private || false;
      if (!this.private && ((_b = (_a = this.params.config) === null || _a === void 0 ? void 0 : _a.broadcast) === null || _b === void 0 ? void 0 : _b.replay)) {
        throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`);
      }
    }
    /**
     * Subscribe registers your client with the server.
     *
     * The optional `callback` receives a `status` and, on failure, an `err` argument.
     * Log the full `err` so its `cause`, `name`, and any structured fields aren't hidden
     * behind `err.message`.
     *
     * @category Realtime
     *
     * @example Handling errors
     * ```js
     * supabase.channel('room1').subscribe((status, err) => {
     *   if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
     *     // Log the full error: its `cause` often holds the underlying reason.
     *     console.error(status, err)
     *   }
     * })
     * ```
     */
    subscribe(callback, timeout = this.timeout) {
      var _a, _b, _c, _d;
      if (!this.socket.isConnected()) {
        this.socket.connect();
      }
      if (this.channelAdapter.isClosed()) {
        const { config: { broadcast, presence, private: isPrivate, postgres_changes_options } } = this.params;
        const postgres_changes = (_b = (_a = this.bindings.postgres_changes) === null || _a === void 0 ? void 0 : _a.map((r) => r.filter)) !== null && _b !== void 0 ? _b : [];
        const presence_enabled = !!this.bindings[REALTIME_LISTEN_TYPES.PRESENCE] && this.bindings[REALTIME_LISTEN_TYPES.PRESENCE].length > 0 || ((_c = this.params.config.presence) === null || _c === void 0 ? void 0 : _c.enabled) === true;
        const accessTokenPayload = {};
        const config = Object.assign({ broadcast, presence: Object.assign(Object.assign({}, presence), { enabled: presence_enabled }), postgres_changes, private: isPrivate }, postgres_changes_options ? { postgres_changes_options } : {});
        if (this.socket.accessTokenValue) {
          accessTokenPayload.access_token = this.socket.accessTokenValue;
        }
        this._onError((reason) => {
          callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, normalizeChannelError(reason));
        });
        this._onClose(() => callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CLOSED));
        this.updateJoinPayload(Object.assign({ config }, accessTokenPayload));
        this._updateFilterMessage();
        const joinTimeout = (postgres_changes_options === null || postgres_changes_options === void 0 ? void 0 : postgres_changes_options.wait) && postgres_changes.length > 0 ? Math.max(timeout, ((_d = postgres_changes_options.timeout) !== null && _d !== void 0 ? _d : DEFAULT_POSTGRES_CHANGES_WAIT_TIMEOUT) + POSTGRES_CHANGES_WAIT_ERROR_GRACE) : timeout;
        this.channelAdapter.subscribe(joinTimeout).receive("ok", async ({ postgres_changes: postgres_changes2 }) => {
          if (!this.socket._isManualToken()) {
            this.socket.setAuth();
          }
          if (postgres_changes2 === void 0) {
            callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
            return;
          }
          this._updatePostgresBindings(postgres_changes2, callback);
        }).receive("error", (error) => {
          this.state = CHANNEL_STATES.errored;
          const message = Object.values(error).join(", ") || "error";
          callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error(message, { cause: error }));
        }).receive("timeout", () => {
          callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.TIMED_OUT);
        });
      }
      return this;
    }
    _updatePostgresBindings(postgres_changes, callback) {
      var _a;
      const clientPostgresBindings = this.bindings.postgres_changes;
      const bindingsLen = (_a = clientPostgresBindings === null || clientPostgresBindings === void 0 ? void 0 : clientPostgresBindings.length) !== null && _a !== void 0 ? _a : 0;
      const newPostgresBindings = [];
      for (let i = 0; i < bindingsLen; i++) {
        const clientPostgresBinding = clientPostgresBindings[i];
        const { filter: { event, schema, table, filter } } = clientPostgresBinding;
        const serverPostgresFilter = postgres_changes && postgres_changes[i];
        if (serverPostgresFilter && serverPostgresFilter.event === event && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.schema, schema) && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.table, table) && _RealtimeChannel.isFilterValueEqual(serverPostgresFilter.filter, filter)) {
          newPostgresBindings.push(Object.assign(Object.assign({}, clientPostgresBinding), { id: serverPostgresFilter.id }));
        } else {
          this.unsubscribe();
          this.state = CHANNEL_STATES.errored;
          callback === null || callback === void 0 ? void 0 : callback(REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
          return;
        }
      }
      this.bindings.postgres_changes = newPostgresBindings;
      if (this.state != CHANNEL_STATES.errored && callback) {
        callback(REALTIME_SUBSCRIBE_STATES.SUBSCRIBED);
      }
    }
    /**
     * Returns the current presence state for this channel.
     *
     * The shape is a map keyed by presence key (for example a user id) where each entry contains the
     * tracked metadata for that user.
     *
     * @category Realtime
     */
    presenceState() {
      return this.presence.state;
    }
    /**
     * Sends the supplied payload to the presence tracker so other subscribers can see that this
     * client is online. Use `untrack` to stop broadcasting presence for the same key.
     *
     * Tracking makes this client visible to other subscribers immediately, regardless of this
     * channel's `config.presence.enabled` setting or whether it has a `presence` listener — that
     * flag only affects whether *this* client receives presence updates from others (and, on
     * RLS-protected channels, whether it's authorized to do so).
     *
     * @category Realtime
     */
    async track(payload, opts = {}) {
      return await this.send({
        type: "presence",
        event: "track",
        payload
      }, opts);
    }
    /**
     * Removes the current presence state for this client.
     *
     * @category Realtime
     */
    async untrack(opts = {}) {
      return await this.send({
        type: "presence",
        event: "untrack"
      }, opts);
    }
    /**
     * Listen to realtime events on this channel.
     * @category Realtime
     *
     * @remarks
     * - By default, Broadcast and Presence are enabled for all projects.
     * - By default, listening to database changes is disabled for new projects due to database performance and security concerns. You can turn it on by managing Realtime's [replication](/docs/guides/api#realtime-api-overview).
     * - You can receive the "previous" data for updates and deletes by setting the table's `REPLICA IDENTITY` to `FULL` (e.g., `ALTER TABLE your_table REPLICA IDENTITY FULL;`).
     * - Row level security is not applied to delete statements. When RLS is enabled and replica identity is set to full, only the primary key is sent to clients.
     *
     * @example Listen to broadcast messages
     * ```js
     * const channel = supabase.channel("room1")
     *
     * channel.on("broadcast", { event: "cursor-pos" }, (payload) => {
     *   console.log("Cursor position received!", payload);
     * }).subscribe((status) => {
     *   if (status === "SUBSCRIBED") {
     *     channel.send({
     *       type: "broadcast",
     *       event: "cursor-pos",
     *       payload: { x: Math.random(), y: Math.random() },
     *     });
     *   }
     * });
     * ```
     *
     * @example Listen to presence sync
     * ```js
     * const channel = supabase.channel('room1')
     * channel
     *   .on('presence', { event: 'sync' }, () => {
     *     console.log('Synced presence state: ', channel.presenceState())
     *   })
     *   .subscribe(async (status) => {
     *     if (status === 'SUBSCRIBED') {
     *       await channel.track({ online_at: new Date().toISOString() })
     *     }
     *   })
     * ```
     *
     * @example Listen to presence join
     * ```js
     * const channel = supabase.channel('room1')
     * channel
     *   .on('presence', { event: 'join' }, ({ newPresences }) => {
     *     console.log('Newly joined presences: ', newPresences)
     *   })
     *   .subscribe(async (status) => {
     *     if (status === 'SUBSCRIBED') {
     *       await channel.track({ online_at: new Date().toISOString() })
     *     }
     *   })
     * ```
     *
     * @example Listen to presence leave
     * ```js
     * const channel = supabase.channel('room1')
     * channel
     *   .on('presence', { event: 'leave' }, ({ leftPresences }) => {
     *     console.log('Newly left presences: ', leftPresences)
     *   })
     *   .subscribe(async (status) => {
     *     if (status === 'SUBSCRIBED') {
     *       await channel.track({ online_at: new Date().toISOString() })
     *       await channel.untrack()
     *     }
     *   })
     * ```
     *
     * Registering the same `postgres_changes` filter more than once on a channel is a no-op: the
     * duplicate is ignored and an error is logged, since the server only ever creates one
     * subscription per distinct filter.
     *
     * @example Listen to all database changes
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: '*', schema: '*' }, payload => {
     *     console.log('Change received!', payload)
     *   })
     *   .subscribe()
     * ```
     *
     * @example Listen to a specific table
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: '*', schema: 'public', table: 'countries' }, payload => {
     *     console.log('Change received!', payload)
     *   })
     *   .subscribe()
     * ```
     *
     * @example Listen to inserts
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'countries' }, payload => {
     *     console.log('Change received!', payload)
     *   })
     *   .subscribe()
     * ```
     *
     * @exampleDescription Listen to updates
     * By default, Supabase will send only the updated record. If you want to receive the previous values as well you can
     * enable full replication for the table you are listening to:
     *
     * ```sql
     * alter table "your_table" replica identity full;
     * ```
     *
     * @example Listen to updates
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'countries' }, payload => {
     *     console.log('Change received!', payload)
     *   })
     *   .subscribe()
     * ```
     *
     * @exampleDescription Listen to deletes
     * By default, Supabase does not send deleted records. If you want to receive the deleted record you can
     * enable full replication for the table you are listening to:
     *
     * ```sql
     * alter table "your_table" replica identity full;
     * ```
     *
     * @example Listen to deletes
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'countries' }, payload => {
     *     console.log('Change received!', payload)
     *   })
     *   .subscribe()
     * ```
     *
     * @exampleDescription Listen to multiple events
     * You can chain listeners if you want to listen to multiple events for each table.
     *
     * @example Listen to multiple events
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'countries' }, handleRecordInserted)
     *   .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'countries' }, handleRecordDeleted)
     *   .subscribe()
     * ```
     *
     * @exampleDescription Listen to row level changes
     * You can listen to individual rows using the format `{table}:{col}=eq.{val}` - where `{col}` is the column name, and `{val}` is the value which you want to match.
     *
     * @example Listen to row level changes
     * ```js
     * supabase
     *   .channel('room1')
     *   .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'countries', filter: 'id=eq.200' }, handleRecordUpdated)
     *   .subscribe()
     * ```
     */
    on(type, filter, callback) {
      const stateCheck = this.channelAdapter.isJoined() || this.channelAdapter.isJoining();
      const typeCheck = type === REALTIME_LISTEN_TYPES.PRESENCE || type === REALTIME_LISTEN_TYPES.POSTGRES_CHANGES;
      if (stateCheck && typeCheck) {
        this.socket.log("channel", `cannot add \`${type}\` callbacks for ${this.topic} after \`subscribe()\`.`);
        throw new Error(`cannot add \`${type}\` callbacks for ${this.topic} after \`subscribe()\`.`);
      }
      return this._on(type, filter, callback);
    }
    /**
     * Sends a broadcast message explicitly via REST API.
     *
     * This method always uses the REST API endpoint regardless of WebSocket connection state.
     * Useful when you want to guarantee REST delivery or when gradually migrating from implicit REST fallback.
     *
     * Payloads that are `ArrayBuffer` or `ArrayBufferView` (e.g. `Uint8Array`) are sent as
     * `application/octet-stream`; all other payloads are JSON-encoded.
     *
     * @param event The name of the broadcast event
     * @param payload Payload to be sent (required)
     * @param opts Options including timeout and persist
     * @returns Promise resolving to object with success status, and error details if failed
     *
     * @category Realtime
     */
    async httpSend(event, payload, opts = {}) {
      var _a;
      if (payload === void 0 || payload === null) {
        return Promise.reject(new Error("Payload is required for httpSend()"));
      }
      const isBinary = payload instanceof ArrayBuffer || ArrayBuffer.isView(payload);
      const headers = {
        apikey: this.socket.apiKey ? this.socket.apiKey : "",
        "Content-Type": isBinary ? "application/octet-stream" : "application/json"
      };
      if (this.socket.accessTokenValue) {
        headers["Authorization"] = `Bearer ${this.socket.accessTokenValue}`;
      }
      const url = new URL(this.broadcastEndpointURL);
      url.pathname += `/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(event)}`;
      if (this.private) {
        url.searchParams.set("private", "true");
      }
      if (opts.persist) {
        if (!this.private) {
          return Promise.reject(new Error("Realtime httpSend() cannot store a message on a public channel."));
        }
        const ttl = typeof opts.persist === "object" ? opts.persist.ttl : void 0;
        if (ttl === void 0) {
          url.searchParams.set("persist", "true");
        } else {
          url.searchParams.set("persist[ttl]", String(ttl));
        }
      }
      const options2 = {
        method: "POST",
        headers,
        body: isBinary ? payload : JSON.stringify(payload)
      };
      const response = await this._fetchWithTimeout(url.toString(), options2, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
      if (response.status === 202) {
        return { success: true };
      }
      if (response.status === 404) {
        return Promise.reject(new Error("httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md"));
      }
      let errorMessage = response.statusText;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorBody.message || errorMessage;
      } catch (_b) {
      }
      return Promise.reject(new Error(errorMessage));
    }
    /**
     * Sends a message into the channel.
     *
     * @param args Arguments to send to channel
     * @param args.type The type of event to send
     * @param args.event The name of the event being sent
     * @param args.payload Payload to be sent
     * @param args.persist Stores the broadcast for replay on a private channel
     * @param opts Options to be used during the send process
     *
     * @category Realtime
     *
     * @remarks
     * - When using REST you don't need to subscribe to the channel
     * - REST calls are only available from 2.37.0 onwards
     * - If you create a channel only to send a REST broadcast, remove it from
     *   the client when the send completes
     *
     * @example Send a message via websocket
     * ```js
     * const channel = supabase.channel('room1')
     *
     * channel.subscribe((status) => {
     *   if (status === 'SUBSCRIBED') {
     *     channel.send({
     *       type: 'broadcast',
     *       event: 'cursor-pos',
     *       payload: { x: Math.random(), y: Math.random() },
     *     })
     *   }
     * })
     * ```
     *
     * @exampleResponse Send a message via websocket
     * ```js
     * ok | timed out | error
     * ```
     *
     * @example Send a message via REST
     * ```js
     * const channel = supabase.channel('room1')
     *
     * try {
     *   await channel.httpSend('cursor-pos', { x: Math.random(), y: Math.random() })
     * } finally {
     *   await supabase.removeChannel(channel)
     * }
     * ```
     */
    async send(args, opts = {}) {
      var _a, _b;
      if (args.type === "broadcast" && args.persist && (!this.private || this.socket.vsn === VSN_1_0_0)) {
        const persistError = this.private ? "Realtime send() cannot store a message with protocol 1.0.0. Use httpSend() or connect with vsn 2.0.0." : "Realtime send() cannot store a message on a public channel.";
        if (this.socket.hasLogger()) {
          this.socket.log("channel", persistError);
        } else {
          console.error(persistError);
        }
        return "error";
      }
      if (!this.channelAdapter.canPush() && args.type === "broadcast") {
        const fallbackWarning = "Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.";
        if (this.socket.hasLogger()) {
          this.socket.log("channel", fallbackWarning);
        } else {
          console.warn(fallbackWarning);
        }
        const { event, payload: endpoint_payload } = args;
        if (args.persist) {
          const persistError = "Realtime send() fell back to REST and cannot store this message. The batch endpoint does not support persistence. Use httpSend() or send after the channel is connected and subscribed.";
          if (this.socket.hasLogger()) {
            this.socket.log("channel", persistError);
          } else {
            console.error(persistError);
          }
          return "error";
        }
        const headers = {
          apikey: this.socket.apiKey ? this.socket.apiKey : "",
          "Content-Type": "application/json"
        };
        if (this.socket.accessTokenValue) {
          headers["Authorization"] = `Bearer ${this.socket.accessTokenValue}`;
        }
        const options2 = {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [
              {
                topic: this.subTopic,
                event,
                payload: endpoint_payload,
                private: this.private
              }
            ]
          })
        };
        try {
          const response = await this._fetchWithTimeout(this.broadcastEndpointURL, options2, (_a = opts.timeout) !== null && _a !== void 0 ? _a : this.timeout);
          await ((_b = response.body) === null || _b === void 0 ? void 0 : _b.cancel());
          return response.ok ? "ok" : "error";
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return "timed out";
          } else {
            return "error";
          }
        }
      } else {
        return new Promise((resolve) => {
          var _a2, _b2, _c;
          const push = this.channelAdapter.push(args.type, args, opts.timeout || this.timeout);
          if (args.type === "broadcast" && !((_c = (_b2 = (_a2 = this.params) === null || _a2 === void 0 ? void 0 : _a2.config) === null || _b2 === void 0 ? void 0 : _b2.broadcast) === null || _c === void 0 ? void 0 : _c.ack)) {
            resolve("ok");
          }
          push.receive("ok", () => resolve("ok"));
          push.receive("error", (response) => resolve(args.persist && typeof (response === null || response === void 0 ? void 0 : response.error) === "string" ? response.error : "error"));
          push.receive("timeout", () => resolve("timed out"));
        });
      }
    }
    /**
     * Updates the payload that will be sent the next time the channel joins (reconnects).
     * Useful for rotating access tokens or updating config without re-creating the channel.
     *
     * @category Realtime
     */
    updateJoinPayload(payload) {
      this.channelAdapter.updateJoinPayload(payload);
    }
    /**
     * Leaves the channel.
     *
     * Unsubscribes from server events, and instructs channel to terminate on server.
     * Triggers onClose() hooks.
     *
     * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
     * channel.unsubscribe().receive("ok", () => alert("left!") )
     *
     * @category Realtime
     */
    async unsubscribe(timeout = this.timeout) {
      return new Promise((resolve) => {
        this.channelAdapter.unsubscribe(timeout).receive("ok", () => resolve("ok")).receive("timeout", () => resolve("timed out")).receive("error", () => resolve("error"));
      });
    }
    /**
     * Destroys and stops related timers.
     *
     * @category Realtime
     */
    teardown() {
      this.channelAdapter.teardown();
    }
    /** @internal */
    async _fetchWithTimeout(url, options2, timeout) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await this.socket.fetch(url, Object.assign(Object.assign({}, options2), { signal: controller.signal }));
      clearTimeout(id);
      return response;
    }
    /** @internal */
    _on(type, filter, callback) {
      var _a;
      const typeLower = type.toLocaleLowerCase();
      const filterValue = filter === null || filter === void 0 ? void 0 : filter.filter;
      if (filterValue instanceof RealtimePostgresFilterBuilder || typeof filterValue === "object" && filterValue !== null && typeof filterValue.build === "function") {
        filter = Object.assign(Object.assign({}, filter), { filter: filterValue.build() });
      }
      if (typeLower === REALTIME_LISTEN_TYPES.POSTGRES_CHANGES) {
        const duplicate = (_a = this.bindings[typeLower]) === null || _a === void 0 ? void 0 : _a.find((bind) => _RealtimeChannel.isSamePostgresFilter(bind.filter, filter));
        if (duplicate) {
          this.socket.log("error", `duplicate \`postgres_changes\` binding for ${this.topic} ignored`, filter);
          return this;
        }
      }
      const ref = this.channelAdapter.on(type, callback);
      const binding = {
        type: typeLower,
        filter,
        callback,
        ref
      };
      if (this.bindings[typeLower]) {
        this.bindings[typeLower].push(binding);
      } else {
        this.bindings[typeLower] = [binding];
      }
      this._updateFilterMessage();
      return this;
    }
    /**
     * Registers a callback that will be executed when the channel closes.
     *
     * @internal
     */
    _onClose(callback) {
      this.channelAdapter.onClose(callback);
    }
    /**
     * Registers a callback that will be executed when the channel encounteres an error.
     *
     * @internal
     */
    _onError(callback) {
      this.channelAdapter.onError(callback);
    }
    /** @internal */
    _updateFilterMessage() {
      this.channelAdapter.updateFilterBindings((binding, payload, ref) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const typeLower = binding.event.toLocaleLowerCase();
        if (this._notThisChannelEvent(typeLower, ref)) {
          return false;
        }
        const bind = (_a = this.bindings[typeLower]) === null || _a === void 0 ? void 0 : _a.find((bind2) => bind2.ref === binding.ref);
        if (!bind) {
          return true;
        }
        if (["broadcast", "presence", "postgres_changes"].includes(typeLower)) {
          if ("id" in bind) {
            const bindId = bind.id;
            const bindEvent = (_b = bind.filter) === null || _b === void 0 ? void 0 : _b.event;
            return bindId && ((_c = payload.ids) === null || _c === void 0 ? void 0 : _c.includes(bindId)) && (bindEvent === "*" || (bindEvent === null || bindEvent === void 0 ? void 0 : bindEvent.toLocaleLowerCase()) === ((_d = payload.data) === null || _d === void 0 ? void 0 : _d.type.toLocaleLowerCase()));
          } else {
            const bindEvent = (_f = (_e = bind === null || bind === void 0 ? void 0 : bind.filter) === null || _e === void 0 ? void 0 : _e.event) === null || _f === void 0 ? void 0 : _f.toLocaleLowerCase();
            return bindEvent === "*" || bindEvent === ((_g = payload === null || payload === void 0 ? void 0 : payload.event) === null || _g === void 0 ? void 0 : _g.toLocaleLowerCase());
          }
        } else {
          return bind.type.toLocaleLowerCase() === typeLower;
        }
      });
    }
    /** @internal */
    _notThisChannelEvent(event, ref) {
      const { close, error, leave, join } = CHANNEL_EVENTS;
      const events = [close, error, leave, join];
      return ref && events.includes(event) && ref !== this.joinPush.ref;
    }
    /** @internal */
    _updateFilterTransform() {
      this.channelAdapter.updatePayloadTransform((event, payload, ref) => {
        if (typeof payload === "object" && "ids" in payload) {
          const postgresChanges = payload.data;
          const { schema, table, commit_timestamp, type, errors } = postgresChanges;
          const enrichedPayload = {
            schema,
            table,
            commit_timestamp,
            eventType: type,
            new: {},
            old: {},
            errors
          };
          return Object.assign(Object.assign({}, enrichedPayload), this._getPayloadRecords(postgresChanges));
        }
        return payload;
      });
    }
    copyBindings(other) {
      if (this.joinedOnce) {
        throw new Error("cannot copy bindings into joined channel");
      }
      for (const kind in other.bindings) {
        for (const binding of other.bindings[kind]) {
          this._on(binding.type, binding.filter, binding.callback);
        }
      }
    }
    /**
     * Compares two optional filter values for equality.
     * Treats undefined, null, and empty string as equivalent empty values.
     * @internal
     */
    static isFilterValueEqual(serverValue, clientValue) {
      const normalizedServer = serverValue !== null && serverValue !== void 0 ? serverValue : void 0;
      const normalizedClient = clientValue !== null && clientValue !== void 0 ? clientValue : void 0;
      return normalizedServer === normalizedClient;
    }
    /**
     * Two `postgres_changes` filters are the same when the server would collapse them into a single
     * subscription.
     * @internal
     */
    static isSamePostgresFilter(a, b) {
      var _a, _b, _c, _d;
      const selectA = (_b = (_a = a === null || a === void 0 ? void 0 : a.select) === null || _a === void 0 ? void 0 : _a.join()) !== null && _b !== void 0 ? _b : void 0;
      const selectB = (_d = (_c = b === null || b === void 0 ? void 0 : b.select) === null || _c === void 0 ? void 0 : _c.join()) !== null && _d !== void 0 ? _d : void 0;
      return (a === null || a === void 0 ? void 0 : a.event) === (b === null || b === void 0 ? void 0 : b.event) && _RealtimeChannel.isFilterValueEqual(a === null || a === void 0 ? void 0 : a.schema, b === null || b === void 0 ? void 0 : b.schema) && _RealtimeChannel.isFilterValueEqual(a === null || a === void 0 ? void 0 : a.table, b === null || b === void 0 ? void 0 : b.table) && _RealtimeChannel.isFilterValueEqual(a === null || a === void 0 ? void 0 : a.filter, b === null || b === void 0 ? void 0 : b.filter) && selectA === selectB;
    }
    /** @internal */
    _getPayloadRecords(payload) {
      const records = {
        new: {},
        old: {}
      };
      if (payload.type === "INSERT" || payload.type === "UPDATE") {
        records.new = convertChangeData(payload.columns, payload.record);
      }
      if (payload.type === "UPDATE" || payload.type === "DELETE") {
        records.old = convertChangeData(payload.columns, payload.old_record);
      }
      return records;
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/phoenix/socketAdapter.js
  var SocketAdapter = class {
    constructor(endPoint, options2) {
      this.socket = new Socket(endPoint, options2);
    }
    get timeout() {
      return this.socket.timeout;
    }
    get endPoint() {
      return this.socket.endPoint;
    }
    get transport() {
      return this.socket.transport;
    }
    get heartbeatIntervalMs() {
      return this.socket.heartbeatIntervalMs;
    }
    get heartbeatCallback() {
      return this.socket.heartbeatCallback;
    }
    set heartbeatCallback(callback) {
      this.socket.heartbeatCallback = callback;
    }
    get heartbeatTimer() {
      return this.socket.heartbeatTimer;
    }
    get pendingHeartbeatRef() {
      return this.socket.pendingHeartbeatRef;
    }
    get reconnectTimer() {
      return this.socket.reconnectTimer;
    }
    get vsn() {
      return this.socket.vsn;
    }
    get encode() {
      return this.socket.encode;
    }
    get decode() {
      return this.socket.decode;
    }
    get reconnectAfterMs() {
      return this.socket.reconnectAfterMs;
    }
    get sendBuffer() {
      return this.socket.sendBuffer;
    }
    get stateChangeCallbacks() {
      return this.socket.stateChangeCallbacks;
    }
    connect() {
      this.socket.connect();
    }
    disconnect(callback, code, reason, timeout = 1e4) {
      return new Promise((resolve) => {
        setTimeout(() => resolve("timeout"), timeout);
        this.socket.disconnect(() => {
          callback();
          resolve("ok");
        }, code, reason);
      });
    }
    push(data) {
      this.socket.push(data);
    }
    log(kind, msg, data) {
      this.socket.log(kind, msg, data);
    }
    hasLogger() {
      return this.socket.hasLogger();
    }
    makeRef() {
      return this.socket.makeRef();
    }
    onOpen(callback) {
      this.socket.onOpen(callback);
    }
    onClose(callback) {
      this.socket.onClose(callback);
    }
    onError(callback) {
      this.socket.onError(callback);
    }
    onMessage(callback) {
      this.socket.onMessage(callback);
    }
    isConnected() {
      return this.socket.isConnected();
    }
    isConnecting() {
      return this.socket.connectionState() == CONNECTION_STATE.connecting;
    }
    isDisconnecting() {
      return this.socket.connectionState() == CONNECTION_STATE.closing;
    }
    connectionState() {
      return this.socket.connectionState();
    }
    endPointURL() {
      return this.socket.endPointURL();
    }
    sendHeartbeat() {
      this.socket.sendHeartbeat();
    }
    /**
     * @internal
     */
    getSocket() {
      return this.socket;
    }
  };

  // node_modules/@supabase/realtime-js/dist/module/RealtimeClient.js
  var CONNECTION_TIMEOUTS = {
    HEARTBEAT_INTERVAL: 25e3,
    RECONNECT_DELAY: 10,
    HEARTBEAT_TIMEOUT_FALLBACK: 100
  };
  var RECONNECT_INTERVALS = [1e3, 2e3, 5e3, 1e4];
  var DEFAULT_RECONNECT_FALLBACK = 1e4;
  function createMemorySessionStorage() {
    const store = /* @__PURE__ */ new Map();
    return {
      get length() {
        return store.size;
      },
      clear() {
        store.clear();
      },
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      key(index) {
        var _a;
        return (_a = Array.from(store.keys())[index]) !== null && _a !== void 0 ? _a : null;
      },
      removeItem(key) {
        store.delete(key);
      },
      setItem(key, value) {
        store.set(key, String(value));
      }
    };
  }
  function resolveSessionStorage() {
    try {
      if (typeof globalThis !== "undefined" && globalThis.sessionStorage) {
        return globalThis.sessionStorage;
      }
    } catch (_a) {
    }
    return createMemorySessionStorage();
  }
  var WORKER_SCRIPT = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
  var RealtimeClient = class {
    get endPoint() {
      return this.socketAdapter.endPoint;
    }
    get timeout() {
      return this.socketAdapter.timeout;
    }
    get transport() {
      return this.socketAdapter.transport;
    }
    get heartbeatCallback() {
      return this.socketAdapter.heartbeatCallback;
    }
    get heartbeatIntervalMs() {
      return this.socketAdapter.heartbeatIntervalMs;
    }
    get heartbeatTimer() {
      if (this.worker) {
        return this._workerHeartbeatTimer;
      }
      return this.socketAdapter.heartbeatTimer;
    }
    get pendingHeartbeatRef() {
      if (this.worker) {
        return this._pendingWorkerHeartbeatRef;
      }
      return this.socketAdapter.pendingHeartbeatRef;
    }
    get reconnectTimer() {
      return this.socketAdapter.reconnectTimer;
    }
    get vsn() {
      return this.socketAdapter.vsn;
    }
    get encode() {
      return this.socketAdapter.encode;
    }
    get decode() {
      return this.socketAdapter.decode;
    }
    get reconnectAfterMs() {
      return this.socketAdapter.reconnectAfterMs;
    }
    get sendBuffer() {
      return this.socketAdapter.sendBuffer;
    }
    get stateChangeCallbacks() {
      return this.socketAdapter.stateChangeCallbacks;
    }
    /**
     * Initializes the Socket.
     *
     * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
     * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
     * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
     * @param options.params The optional params to pass when connecting.
     * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
     * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
     * @param options.heartbeatCallback The optional function to handle heartbeat status and latency.
     * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
     * @param options.logLevel Sets the log level for Realtime
     * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
     * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
     * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
     * @param options.worker Use Web Worker to set a side flow. Defaults to false.
     * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
     * @param options.vsn The protocol version to use when connecting. Supported versions are "1.0.0" and "2.0.0". Defaults to "2.0.0".
     *
     * @category Realtime
     *
     * @example Using supabase-js (recommended)
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
     * const channel = supabase.channel('room1')
     * channel
     *   .on('broadcast', { event: 'cursor-pos' }, (payload) => console.log(payload))
     *   .subscribe()
     * ```
     *
     * @example Standalone import for bundle-sensitive environments
     * ```ts
     * import RealtimeClient from '@supabase/realtime-js'
     *
     * const client = new RealtimeClient('https://xyzcompany.supabase.co/realtime/v1', {
     *   params: { apikey: 'your-publishable-key' },
     * })
     * client.connect()
     * ```
     */
    constructor(endPoint, options2) {
      var _a;
      this.channels = new Array();
      this.accessTokenValue = null;
      this.accessToken = null;
      this.apiKey = null;
      this.httpEndpoint = "";
      this.headers = {};
      this.params = {};
      this.ref = 0;
      this.serializer = new serializer_default();
      this._manuallySetToken = false;
      this._authPromise = null;
      this._authGeneration = 0;
      this._workerHeartbeatTimer = void 0;
      this._pendingWorkerHeartbeatRef = null;
      this._pendingDisconnectTimer = null;
      this._disconnectOnEmptyChannelsAfterMs = 0;
      this._resolveFetch = (customFetch) => {
        if (customFetch) {
          return (...args) => customFetch(...args);
        }
        return (...args) => fetch(...args);
      };
      if (!((_a = options2 === null || options2 === void 0 ? void 0 : options2.params) === null || _a === void 0 ? void 0 : _a.apikey)) {
        throw new Error("API key is required to connect to Realtime");
      }
      this.apiKey = options2.params.apikey;
      const socketAdapterOptions = this._initializeOptions(options2);
      this.socketAdapter = new SocketAdapter(endPoint, socketAdapterOptions);
      this.httpEndpoint = httpEndpointURL(endPoint);
      this.fetch = this._resolveFetch(options2 === null || options2 === void 0 ? void 0 : options2.fetch);
    }
    /**
     * Connects the socket, unless already connected.
     *
     * @category Realtime
     */
    connect() {
      if (this.isConnecting() || this.isDisconnecting() || this.isConnected()) {
        return;
      }
      if (this.accessToken && !this._authPromise) {
        this._setAuthSafely("connect");
      }
      this._setupConnectionHandlers();
      try {
        this.socketAdapter.connect();
      } catch (error) {
        const errorMessage = error.message;
        throw new Error(`WebSocket not available: ${errorMessage}`);
      }
      this._handleNodeJsRaceCondition();
    }
    /**
     * Returns the URL of the websocket.
     * @returns string The URL of the websocket.
     *
     * @category Realtime
     */
    endpointURL() {
      return this.socketAdapter.endPointURL();
    }
    /**
     * Disconnects the socket.
     *
     * @param code A numeric status code to send on disconnect.
     * @param reason A custom reason for the disconnect.
     *
     * @category Realtime
     */
    async disconnect(code, reason) {
      this._cancelPendingDisconnect();
      if (this.isDisconnecting()) {
        return "ok";
      }
      return await this.socketAdapter.disconnect(() => {
        clearInterval(this._workerHeartbeatTimer);
        this._terminateWorker();
      }, code, reason);
    }
    /**
     * Returns all created channels
     *
     * @category Realtime
     */
    getChannels() {
      return this.channels;
    }
    /**
     * Unsubscribes, removes and tears down a single channel
     * @param channel A RealtimeChannel instance
     *
     * @category Realtime
     */
    async removeChannel(channel) {
      const status = await channel.unsubscribe();
      if (status === "ok") {
        channel.teardown();
      }
      return status;
    }
    /**
     * Unsubscribes, removes and tears down all channels
     *
     * @category Realtime
     */
    async removeAllChannels() {
      const promises = this.channels.map(async (channel) => {
        const result2 = await channel.unsubscribe();
        channel.teardown();
        return result2;
      });
      const result = await Promise.all(promises);
      await this.disconnect();
      return result;
    }
    /**
     * Logs the message.
     *
     * For customized logging, `this.logger` can be overridden in Client constructor.
     *
     * @category Realtime
     */
    log(kind, msg, data) {
      this.socketAdapter.log(kind, msg, data);
    }
    /**
     * Returns true if a custom `logger` has been configured on this client.
     *
     * @category Realtime
     */
    hasLogger() {
      return this.socketAdapter.hasLogger();
    }
    /**
     * Returns the current state of the socket.
     *
     * @category Realtime
     */
    connectionState() {
      return this.socketAdapter.connectionState() || CONNECTION_STATE.closed;
    }
    /**
     * Returns `true` is the connection is open.
     *
     * @category Realtime
     */
    isConnected() {
      return this.socketAdapter.isConnected();
    }
    /**
     * Returns `true` if the connection is currently connecting.
     *
     * @category Realtime
     */
    isConnecting() {
      return this.socketAdapter.isConnecting();
    }
    /**
     * Returns `true` if the connection is currently disconnecting.
     *
     * @category Realtime
     */
    isDisconnecting() {
      return this.socketAdapter.isDisconnecting();
    }
    /**
     * Creates (or reuses) a {@link RealtimeChannel} for the provided topic.
     *
     * Topics are automatically prefixed with `realtime:` to match the Realtime service.
     * If a channel with the same topic already exists it will be returned instead of creating
     * a duplicate connection.
     *
     * @category Realtime
     */
    channel(topic, params = { config: {} }) {
      const realtimeTopic = `realtime:${topic}`;
      const exists = this.getChannels().find((c) => c.topic === realtimeTopic);
      if (!exists) {
        const chan = new RealtimeChannel(`realtime:${topic}`, params, this);
        this._cancelPendingDisconnect();
        this.channels.push(chan);
        return chan;
      } else {
        return exists;
      }
    }
    /**
     * Push out a message if the socket is connected.
     *
     * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
     *
     * @category Realtime
     */
    push(data) {
      this.socketAdapter.push(data);
    }
    /**
     * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
     *
     * If param is null it will use the `accessToken` callback function or the token set on the client.
     *
     * On callback used, it will set the value of the token internal to the client.
     *
     * When a token is explicitly provided AND no `accessToken` callback is configured,
     * it will be preserved across channel operations (including removeChannel and
     * resubscribe) and the client stays in manual-token mode.
     *
     * When an `accessToken` callback IS configured, the callback is the source of truth:
     * the client remains in callback mode and continues to refresh from it on heartbeat,
     * even after a bootstrap/override `setAuth(token)` call.
     *
     * The callback is called on connect and on every heartbeat (`heartbeatIntervalMs`,
     * default 25000ms). Its token must stay valid past the next call, or the server closes
     * the channel at expiry with no automatic resubscribe.
     *
     * @param token A JWT string to override the token set on the client.
     *
     * @example Setting the authorization header
     * // Use a manual token (preserved across resubscribes when no accessToken callback is set)
     * client.realtime.setAuth('my-custom-jwt')
     *
     * // Switch back to using the accessToken callback
     * client.realtime.setAuth()
     *
     * @category Realtime
     */
    async setAuth(token = null) {
      const authGeneration = ++this._authGeneration;
      const authPromise = this._performAuth(token, authGeneration);
      if (authGeneration === this._authGeneration) {
        this._authPromise = authPromise;
      }
      try {
        await authPromise;
      } finally {
        if (this._authPromise === authPromise) {
          this._authPromise = null;
        }
      }
    }
    /**
     * Returns true if the current access token was explicitly set via setAuth(token),
     * false if it was obtained via the accessToken callback.
     * @internal
     */
    _isManualToken() {
      return this._manuallySetToken;
    }
    /**
     * Sends a heartbeat message if the socket is connected.
     *
     * @category Realtime
     */
    async sendHeartbeat() {
      this.socketAdapter.sendHeartbeat();
    }
    /**
     * Sets a callback that receives lifecycle events for internal heartbeat messages.
     * Useful for instrumenting connection health (e.g. sent/ok/timeout).
     *
     * @category Realtime
     */
    onHeartbeat(callback) {
      this.socketAdapter.heartbeatCallback = this._wrapHeartbeatCallback(callback);
    }
    /**
     * Return the next message ref, accounting for overflows
     *
     * @internal
     */
    _makeRef() {
      return this.socketAdapter.makeRef();
    }
    /**
     * Removes a channel from RealtimeClient
     *
     * @param channel An open subscription.
     *
     * @internal
     */
    _remove(channel) {
      this.channels = this.channels.filter((c) => c.topic !== channel.topic);
      if (this.channels.length === 0) {
        this.log("transport", "no channels remaining, scheduling disconnect");
        this._schedulePendingDisconnect();
      }
    }
    /** @internal */
    _schedulePendingDisconnect() {
      this._cancelPendingDisconnect();
      if (this._disconnectOnEmptyChannelsAfterMs === 0) {
        this.log("transport", "disconnecting immediately - no channels");
        this.disconnect();
        return;
      }
      this._pendingDisconnectTimer = setTimeout(() => {
        this._pendingDisconnectTimer = null;
        if (this.channels.length === 0) {
          this.log("transport", "deferred disconnect fired - no channels, disconnecting");
          this.disconnect();
        }
      }, this._disconnectOnEmptyChannelsAfterMs);
      this.log("transport", `deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`);
    }
    /** @internal */
    _cancelPendingDisconnect() {
      if (this._pendingDisconnectTimer !== null) {
        this.log("transport", "pending disconnect cancelled - channel activity detected");
        clearTimeout(this._pendingDisconnectTimer);
        this._pendingDisconnectTimer = null;
      }
    }
    /**
     * Perform the actual auth operation
     * @internal
     */
    async _performAuth(token, authGeneration) {
      let tokenToSend;
      let isManualToken = false;
      if (token) {
        tokenToSend = token;
        isManualToken = true;
      } else if (this.accessToken) {
        try {
          tokenToSend = await this.accessToken();
        } catch (e) {
          this.log("error", "Error fetching access token from callback", e);
          tokenToSend = this.accessTokenValue;
        }
      } else {
        tokenToSend = this.accessTokenValue;
      }
      if (authGeneration !== this._authGeneration) {
        return;
      }
      if (this.accessToken) {
        this._manuallySetToken = false;
      } else if (isManualToken) {
        this._manuallySetToken = true;
      }
      if (this.accessTokenValue != tokenToSend) {
        this.accessTokenValue = tokenToSend;
        this.channels.forEach((channel) => {
          const payload = {
            access_token: tokenToSend,
            version: DEFAULT_VERSION
          };
          channel.updateJoinPayload(payload);
          if (channel.joinedOnce && channel.channelAdapter.isJoined()) {
            channel.channelAdapter.push(CHANNEL_EVENTS.access_token, {
              access_token: tokenToSend
            });
          }
        });
      }
    }
    /**
     * Wait for any in-flight auth operations to complete
     * @internal
     */
    async _waitForAuthIfNeeded() {
      if (this._authPromise) {
        await this._authPromise;
      }
    }
    /**
     * Safely call setAuth with standardized error handling
     * @internal
     */
    _setAuthSafely(context = "general") {
      if (!this._isManualToken()) {
        this.setAuth().catch((e) => {
          this.log("error", `Error setting auth in ${context}`, e);
        });
      }
    }
    /** @internal */
    _setupConnectionHandlers() {
      this.socketAdapter.onOpen(() => {
        const authPromise = this._authPromise || (this.accessToken && !this.accessTokenValue ? this.setAuth() : Promise.resolve());
        authPromise.catch((e) => {
          this.log("error", "error waiting for auth on connect", e);
        });
        if (this.worker && !this.workerRef) {
          this._startWorkerHeartbeat();
        }
      });
      this.socketAdapter.onClose(() => {
        if (this.worker && this.workerRef) {
          this._terminateWorker();
        }
      });
      this.socketAdapter.onMessage((message) => {
        if (message.ref && message.ref === this._pendingWorkerHeartbeatRef) {
          this._pendingWorkerHeartbeatRef = null;
        }
      });
    }
    /** @internal */
    _handleNodeJsRaceCondition() {
      if (this.socketAdapter.isConnected()) {
        this.socketAdapter.getSocket().onConnOpen();
      }
    }
    /** @internal */
    _wrapHeartbeatCallback(heartbeatCallback) {
      return (status, latency) => {
        if (status === "disconnected")
          return;
        if (status == "sent")
          this._setAuthSafely();
        if (heartbeatCallback)
          heartbeatCallback(status, latency);
      };
    }
    /** @internal */
    _startWorkerHeartbeat() {
      if (this.workerUrl) {
        this.log("worker", `starting worker for from ${this.workerUrl}`);
      } else {
        this.log("worker", `starting default worker`);
      }
      const objectUrl = this._workerObjectUrl(this.workerUrl);
      this.workerRef = new Worker(objectUrl);
      this.workerRef.onerror = (error) => {
        this.log("worker", "worker error", error.message);
        this._terminateWorker();
        this.disconnect();
      };
      this.workerRef.onmessage = (event) => {
        if (event.data.event === "keepAlive") {
          this.sendHeartbeat();
        }
      };
      this.workerRef.postMessage({
        event: "start",
        interval: this.heartbeatIntervalMs
      });
    }
    /**
     * Terminate the Web Worker and clear the reference
     * @internal
     */
    _terminateWorker() {
      if (this.workerRef) {
        this.log("worker", "terminating worker");
        this.workerRef.terminate();
        this.workerRef = void 0;
      }
    }
    /** @internal */
    _workerObjectUrl(url) {
      let result_url;
      if (url) {
        result_url = url;
      } else {
        const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
        result_url = URL.createObjectURL(blob);
      }
      return result_url;
    }
    /**
     * Initialize socket options with defaults
     * @internal
     */
    _initializeOptions(options2) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
      this.worker = (_a = options2 === null || options2 === void 0 ? void 0 : options2.worker) !== null && _a !== void 0 ? _a : false;
      this.accessToken = (_b = options2 === null || options2 === void 0 ? void 0 : options2.accessToken) !== null && _b !== void 0 ? _b : null;
      const result = {};
      result.timeout = (_c = options2 === null || options2 === void 0 ? void 0 : options2.timeout) !== null && _c !== void 0 ? _c : DEFAULT_TIMEOUT;
      result.heartbeatIntervalMs = (_d = options2 === null || options2 === void 0 ? void 0 : options2.heartbeatIntervalMs) !== null && _d !== void 0 ? _d : CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL;
      this._disconnectOnEmptyChannelsAfterMs = (_e = options2 === null || options2 === void 0 ? void 0 : options2.disconnectOnEmptyChannelsAfterMs) !== null && _e !== void 0 ? _e : 2 * ((_f = options2 === null || options2 === void 0 ? void 0 : options2.heartbeatIntervalMs) !== null && _f !== void 0 ? _f : CONNECTION_TIMEOUTS.HEARTBEAT_INTERVAL);
      result.transport = (_g = options2 === null || options2 === void 0 ? void 0 : options2.transport) !== null && _g !== void 0 ? _g : websocket_factory_default.getWebSocketConstructor();
      result.params = options2 === null || options2 === void 0 ? void 0 : options2.params;
      result.logger = options2 === null || options2 === void 0 ? void 0 : options2.logger;
      result.heartbeatCallback = this._wrapHeartbeatCallback(options2 === null || options2 === void 0 ? void 0 : options2.heartbeatCallback);
      result.sessionStorage = (_h = options2 === null || options2 === void 0 ? void 0 : options2.sessionStorage) !== null && _h !== void 0 ? _h : resolveSessionStorage();
      result.reconnectAfterMs = (_j = options2 === null || options2 === void 0 ? void 0 : options2.reconnectAfterMs) !== null && _j !== void 0 ? _j : ((tries) => {
        return RECONNECT_INTERVALS[tries - 1] || DEFAULT_RECONNECT_FALLBACK;
      });
      let defaultEncode;
      let defaultDecode;
      const vsn = (_k = options2 === null || options2 === void 0 ? void 0 : options2.vsn) !== null && _k !== void 0 ? _k : DEFAULT_VSN;
      switch (vsn) {
        case VSN_1_0_0:
          defaultEncode = (payload, callback) => {
            return callback(JSON.stringify(payload));
          };
          defaultDecode = (payload, callback) => {
            return callback(JSON.parse(payload));
          };
          break;
        case VSN_2_0_0:
          defaultEncode = this.serializer.encode.bind(this.serializer);
          defaultDecode = this.serializer.decode.bind(this.serializer);
          break;
        default:
          throw new Error(`Unsupported serializer version: ${vsn}`);
      }
      result.vsn = vsn;
      result.encode = (_l = options2 === null || options2 === void 0 ? void 0 : options2.encode) !== null && _l !== void 0 ? _l : defaultEncode;
      result.decode = (_m = options2 === null || options2 === void 0 ? void 0 : options2.decode) !== null && _m !== void 0 ? _m : defaultDecode;
      result.beforeReconnect = this._reconnectAuth.bind(this);
      if ((options2 === null || options2 === void 0 ? void 0 : options2.logLevel) || (options2 === null || options2 === void 0 ? void 0 : options2.log_level)) {
        this.logLevel = options2.logLevel || options2.log_level;
        result.params = Object.assign(Object.assign({}, result.params), { log_level: this.logLevel });
      }
      if (this.worker) {
        if (typeof window !== "undefined" && !window.Worker) {
          throw new Error("Web Worker is not supported");
        }
        this.workerUrl = options2 === null || options2 === void 0 ? void 0 : options2.workerUrl;
        result.autoSendHeartbeat = !this.worker;
      }
      return result;
    }
    /** @internal */
    async _reconnectAuth() {
      await this._waitForAuthIfNeeded();
      if (!this.isConnected()) {
        this.connect();
      }
    }
  };

  // node_modules/iceberg-js/dist/index.mjs
  var IcebergError = class extends Error {
    constructor(message, opts) {
      super(message);
      this.name = "IcebergError";
      this.status = opts.status;
      this.icebergType = opts.icebergType;
      this.icebergCode = opts.icebergCode;
      this.details = opts.details;
      this.isCommitStateUnknown = opts.icebergType === "CommitStateUnknownException" || [500, 502, 504].includes(opts.status) && opts.icebergType?.includes("CommitState") === true;
    }
    /**
     * Returns true if the error is a 404 Not Found error.
     */
    isNotFound() {
      return this.status === 404;
    }
    /**
     * Returns true if the error is a 409 Conflict error.
     */
    isConflict() {
      return this.status === 409;
    }
    /**
     * Returns true if the error is a 419 Authentication Timeout error.
     */
    isAuthenticationTimeout() {
      return this.status === 419;
    }
  };
  function buildUrl(baseUrl, path, query) {
    const url = new URL(path, baseUrl);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== void 0) {
          url.searchParams.set(key, value);
        }
      }
    }
    return url.toString();
  }
  async function buildAuthHeaders(auth) {
    if (!auth || auth.type === "none") {
      return {};
    }
    if (auth.type === "bearer") {
      return { Authorization: `Bearer ${auth.token}` };
    }
    if (auth.type === "header") {
      return { [auth.name]: auth.value };
    }
    if (auth.type === "custom") {
      return await auth.getHeaders();
    }
    return {};
  }
  function createFetchClient(options2) {
    const fetchFn = options2.fetchImpl ?? globalThis.fetch;
    return {
      async request({
        method,
        path,
        query,
        body,
        headers
      }) {
        const url = buildUrl(options2.baseUrl, path, query);
        const authHeaders = await buildAuthHeaders(options2.auth);
        const res = await fetchFn(url, {
          method,
          headers: {
            ...body ? { "Content-Type": "application/json" } : {},
            ...authHeaders,
            ...headers
          },
          body: body ? JSON.stringify(body) : void 0
        });
        const text = await res.text();
        const isJson = (res.headers.get("content-type") || "").includes("application/json");
        const data = isJson && text ? JSON.parse(text) : text;
        if (!res.ok) {
          const errBody = isJson ? data : void 0;
          const errorDetail = errBody?.error;
          throw new IcebergError(
            errorDetail?.message ?? `Request failed with status ${res.status}`,
            {
              status: res.status,
              icebergType: errorDetail?.type,
              icebergCode: errorDetail?.code,
              details: errBody
            }
          );
        }
        return { status: res.status, headers: res.headers, data };
      }
    };
  }
  function namespaceToPath(namespace) {
    return namespace.join("");
  }
  var NamespaceOperations = class {
    constructor(client, prefix = "") {
      this.client = client;
      this.prefix = prefix;
    }
    async listNamespaces(parent) {
      const query = parent ? { parent: namespaceToPath(parent.namespace) } : void 0;
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces`,
        query
      });
      return response.data.namespaces.map((ns) => ({ namespace: ns }));
    }
    async createNamespace(id, metadata) {
      const request = {
        namespace: id.namespace,
        properties: metadata?.properties
      };
      const response = await this.client.request({
        method: "POST",
        path: `${this.prefix}/namespaces`,
        body: request
      });
      return response.data;
    }
    async dropNamespace(id) {
      await this.client.request({
        method: "DELETE",
        path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
      });
    }
    async loadNamespaceMetadata(id) {
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
      });
      return {
        properties: response.data.properties
      };
    }
    async namespaceExists(id) {
      try {
        await this.client.request({
          method: "HEAD",
          path: `${this.prefix}/namespaces/${namespaceToPath(id.namespace)}`
        });
        return true;
      } catch (error) {
        if (error instanceof IcebergError && error.status === 404) {
          return false;
        }
        throw error;
      }
    }
    async createNamespaceIfNotExists(id, metadata) {
      try {
        return await this.createNamespace(id, metadata);
      } catch (error) {
        if (error instanceof IcebergError && error.status === 409) {
          return;
        }
        throw error;
      }
    }
  };
  function namespaceToPath2(namespace) {
    return namespace.join("");
  }
  var TableOperations = class {
    constructor(client, prefix = "", accessDelegation) {
      this.client = client;
      this.prefix = prefix;
      this.accessDelegation = accessDelegation;
    }
    async listTables(namespace) {
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`
      });
      return response.data.identifiers;
    }
    async createTable(namespace, request) {
      const headers = {};
      if (this.accessDelegation) {
        headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
      }
      const response = await this.client.request({
        method: "POST",
        path: `${this.prefix}/namespaces/${namespaceToPath2(namespace.namespace)}/tables`,
        body: request,
        headers
      });
      return response.data.metadata;
    }
    async updateTable(id, request) {
      const response = await this.client.request({
        method: "POST",
        path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
        body: request
      });
      return {
        "metadata-location": response.data["metadata-location"],
        metadata: response.data.metadata
      };
    }
    async dropTable(id, options2) {
      await this.client.request({
        method: "DELETE",
        path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
        query: { purgeRequested: String(options2?.purge ?? false) }
      });
    }
    async loadTable(id) {
      const headers = {};
      if (this.accessDelegation) {
        headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
      }
      const response = await this.client.request({
        method: "GET",
        path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
        headers
      });
      return response.data.metadata;
    }
    async tableExists(id) {
      const headers = {};
      if (this.accessDelegation) {
        headers["X-Iceberg-Access-Delegation"] = this.accessDelegation;
      }
      try {
        await this.client.request({
          method: "HEAD",
          path: `${this.prefix}/namespaces/${namespaceToPath2(id.namespace)}/tables/${id.name}`,
          headers
        });
        return true;
      } catch (error) {
        if (error instanceof IcebergError && error.status === 404) {
          return false;
        }
        throw error;
      }
    }
    async createTableIfNotExists(namespace, request) {
      try {
        return await this.createTable(namespace, request);
      } catch (error) {
        if (error instanceof IcebergError && error.status === 409) {
          return await this.loadTable({ namespace: namespace.namespace, name: request.name });
        }
        throw error;
      }
    }
  };
  var IcebergRestCatalog = class {
    /**
     * Creates a new Iceberg REST Catalog client.
     *
     * @param options - Configuration options for the catalog client
     */
    constructor(options2) {
      let prefix = "v1";
      if (options2.catalogName) {
        prefix += `/${options2.catalogName}`;
      }
      const baseUrl = options2.baseUrl.endsWith("/") ? options2.baseUrl : `${options2.baseUrl}/`;
      this.client = createFetchClient({
        baseUrl,
        auth: options2.auth,
        fetchImpl: options2.fetch
      });
      this.accessDelegation = options2.accessDelegation?.join(",");
      this.namespaceOps = new NamespaceOperations(this.client, prefix);
      this.tableOps = new TableOperations(this.client, prefix, this.accessDelegation);
    }
    /**
     * Lists all namespaces in the catalog.
     *
     * @param parent - Optional parent namespace to list children under
     * @returns Array of namespace identifiers
     *
     * @example
     * ```typescript
     * // List all top-level namespaces
     * const namespaces = await catalog.listNamespaces();
     *
     * // List namespaces under a parent
     * const children = await catalog.listNamespaces({ namespace: ['analytics'] });
     * ```
     */
    async listNamespaces(parent) {
      return this.namespaceOps.listNamespaces(parent);
    }
    /**
     * Creates a new namespace in the catalog.
     *
     * @param id - Namespace identifier to create
     * @param metadata - Optional metadata properties for the namespace
     * @returns Response containing the created namespace and its properties
     *
     * @example
     * ```typescript
     * const response = await catalog.createNamespace(
     *   { namespace: ['analytics'] },
     *   { properties: { owner: 'data-team' } }
     * );
     * console.log(response.namespace); // ['analytics']
     * console.log(response.properties); // { owner: 'data-team', ... }
     * ```
     */
    async createNamespace(id, metadata) {
      return this.namespaceOps.createNamespace(id, metadata);
    }
    /**
     * Drops a namespace from the catalog.
     *
     * The namespace must be empty (contain no tables) before it can be dropped.
     *
     * @param id - Namespace identifier to drop
     *
     * @example
     * ```typescript
     * await catalog.dropNamespace({ namespace: ['analytics'] });
     * ```
     */
    async dropNamespace(id) {
      await this.namespaceOps.dropNamespace(id);
    }
    /**
     * Loads metadata for a namespace.
     *
     * @param id - Namespace identifier to load
     * @returns Namespace metadata including properties
     *
     * @example
     * ```typescript
     * const metadata = await catalog.loadNamespaceMetadata({ namespace: ['analytics'] });
     * console.log(metadata.properties);
     * ```
     */
    async loadNamespaceMetadata(id) {
      return this.namespaceOps.loadNamespaceMetadata(id);
    }
    /**
     * Lists all tables in a namespace.
     *
     * @param namespace - Namespace identifier to list tables from
     * @returns Array of table identifiers
     *
     * @example
     * ```typescript
     * const tables = await catalog.listTables({ namespace: ['analytics'] });
     * console.log(tables); // [{ namespace: ['analytics'], name: 'events' }, ...]
     * ```
     */
    async listTables(namespace) {
      return this.tableOps.listTables(namespace);
    }
    /**
     * Creates a new table in the catalog.
     *
     * @param namespace - Namespace to create the table in
     * @param request - Table creation request including name, schema, partition spec, etc.
     * @returns Table metadata for the created table
     *
     * @example
     * ```typescript
     * const metadata = await catalog.createTable(
     *   { namespace: ['analytics'] },
     *   {
     *     name: 'events',
     *     schema: {
     *       type: 'struct',
     *       fields: [
     *         { id: 1, name: 'id', type: 'long', required: true },
     *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
     *       ],
     *       'schema-id': 0
     *     },
     *     'partition-spec': {
     *       'spec-id': 0,
     *       fields: [
     *         { source_id: 2, field_id: 1000, name: 'ts_day', transform: 'day' }
     *       ]
     *     }
     *   }
     * );
     * ```
     */
    async createTable(namespace, request) {
      return this.tableOps.createTable(namespace, request);
    }
    /**
     * Updates an existing table's metadata.
     *
     * Can update the schema, partition spec, or properties of a table.
     *
     * @param id - Table identifier to update
     * @param request - Update request with fields to modify
     * @returns Response containing the metadata location and updated table metadata
     *
     * @example
     * ```typescript
     * const response = await catalog.updateTable(
     *   { namespace: ['analytics'], name: 'events' },
     *   {
     *     properties: { 'read.split.target-size': '134217728' }
     *   }
     * );
     * console.log(response['metadata-location']); // s3://...
     * console.log(response.metadata); // TableMetadata object
     * ```
     */
    async updateTable(id, request) {
      return this.tableOps.updateTable(id, request);
    }
    /**
     * Drops a table from the catalog.
     *
     * @param id - Table identifier to drop
     *
     * @example
     * ```typescript
     * await catalog.dropTable({ namespace: ['analytics'], name: 'events' });
     * ```
     */
    async dropTable(id, options2) {
      await this.tableOps.dropTable(id, options2);
    }
    /**
     * Loads metadata for a table.
     *
     * @param id - Table identifier to load
     * @returns Table metadata including schema, partition spec, location, etc.
     *
     * @example
     * ```typescript
     * const metadata = await catalog.loadTable({ namespace: ['analytics'], name: 'events' });
     * console.log(metadata.schema);
     * console.log(metadata.location);
     * ```
     */
    async loadTable(id) {
      return this.tableOps.loadTable(id);
    }
    /**
     * Checks if a namespace exists in the catalog.
     *
     * @param id - Namespace identifier to check
     * @returns True if the namespace exists, false otherwise
     *
     * @example
     * ```typescript
     * const exists = await catalog.namespaceExists({ namespace: ['analytics'] });
     * console.log(exists); // true or false
     * ```
     */
    async namespaceExists(id) {
      return this.namespaceOps.namespaceExists(id);
    }
    /**
     * Checks if a table exists in the catalog.
     *
     * @param id - Table identifier to check
     * @returns True if the table exists, false otherwise
     *
     * @example
     * ```typescript
     * const exists = await catalog.tableExists({ namespace: ['analytics'], name: 'events' });
     * console.log(exists); // true or false
     * ```
     */
    async tableExists(id) {
      return this.tableOps.tableExists(id);
    }
    /**
     * Creates a namespace if it does not exist.
     *
     * If the namespace already exists, returns void. If created, returns the response.
     *
     * @param id - Namespace identifier to create
     * @param metadata - Optional metadata properties for the namespace
     * @returns Response containing the created namespace and its properties, or void if it already exists
     *
     * @example
     * ```typescript
     * const response = await catalog.createNamespaceIfNotExists(
     *   { namespace: ['analytics'] },
     *   { properties: { owner: 'data-team' } }
     * );
     * if (response) {
     *   console.log('Created:', response.namespace);
     * } else {
     *   console.log('Already exists');
     * }
     * ```
     */
    async createNamespaceIfNotExists(id, metadata) {
      return this.namespaceOps.createNamespaceIfNotExists(id, metadata);
    }
    /**
     * Creates a table if it does not exist.
     *
     * If the table already exists, returns its metadata instead.
     *
     * @param namespace - Namespace to create the table in
     * @param request - Table creation request including name, schema, partition spec, etc.
     * @returns Table metadata for the created or existing table
     *
     * @example
     * ```typescript
     * const metadata = await catalog.createTableIfNotExists(
     *   { namespace: ['analytics'] },
     *   {
     *     name: 'events',
     *     schema: {
     *       type: 'struct',
     *       fields: [
     *         { id: 1, name: 'id', type: 'long', required: true },
     *         { id: 2, name: 'timestamp', type: 'timestamp', required: true }
     *       ],
     *       'schema-id': 0
     *     }
     *   }
     * );
     * ```
     */
    async createTableIfNotExists(namespace, request) {
      return this.tableOps.createTableIfNotExists(namespace, request);
    }
  };

  // node_modules/@supabase/storage-js/dist/index.mjs
  function _typeof2(o) {
    "@babel/helpers - typeof";
    return _typeof2 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof2(o);
  }
  function toPrimitive2(t, r) {
    if ("object" != _typeof2(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof2(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey2(t) {
    var i = toPrimitive2(t, "string");
    return "symbol" == _typeof2(i) ? i : i + "";
  }
  function _defineProperty2(e, r, t) {
    return (r = toPropertyKey2(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys2(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread22(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys2(Object(t), true).forEach(function(r$1) {
        _defineProperty2(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys2(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  var StorageError = class extends Error {
    constructor(message, namespace = "storage", status, statusCode) {
      super(message);
      this.__isStorageError = true;
      this.namespace = namespace;
      this.name = namespace === "vectors" ? "StorageVectorsError" : "StorageError";
      this.status = status;
      this.statusCode = statusCode;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        statusCode: this.statusCode
      };
    }
  };
  function isStorageError(error) {
    return typeof error === "object" && error !== null && "__isStorageError" in error;
  }
  var StorageApiError = class extends StorageError {
    constructor(message, status, statusCode, namespace = "storage", code) {
      super(message, namespace, status, statusCode);
      this.name = namespace === "vectors" ? "StorageVectorsApiError" : "StorageApiError";
      this.status = status;
      this.statusCode = statusCode;
      this.code = code;
    }
    toJSON() {
      return _objectSpread22(_objectSpread22({}, super.toJSON()), {}, { code: this.code });
    }
  };
  var StorageUnknownError = class extends StorageError {
    constructor(message, originalError, namespace = "storage") {
      super(message, namespace);
      this.name = namespace === "vectors" ? "StorageVectorsUnknownError" : "StorageUnknownError";
      this.originalError = originalError;
    }
  };
  function setHeader(headers, name, value) {
    const result = _objectSpread22({}, headers);
    const nameLower = name.toLowerCase();
    for (const key of Object.keys(result)) if (key.toLowerCase() === nameLower) delete result[key];
    result[nameLower] = value;
    return result;
  }
  function normalizeHeaders(headers) {
    const result = {};
    for (const [key, value] of Object.entries(headers)) result[key.toLowerCase()] = value;
    return result;
  }
  var resolveFetch2 = (customFetch) => {
    if (customFetch) return (...args) => customFetch(...args);
    return (...args) => fetch(...args);
  };
  var isPlainObject = (value) => {
    if (typeof value !== "object" || value === null) return false;
    const prototype = Object.getPrototypeOf(value);
    return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
  };
  var recursiveToCamel = (item) => {
    if (Array.isArray(item)) return item.map((el) => recursiveToCamel(el));
    else if (typeof item === "function" || item !== Object(item)) return item;
    const result = {};
    Object.entries(item).forEach(([key, value]) => {
      const newKey = key.replace(/([-_][a-z])/gi, (c) => c.toUpperCase().replace(/[-_]/g, ""));
      result[newKey] = recursiveToCamel(value);
    });
    return result;
  };
  var isValidBucketName = (bucketName) => {
    if (!bucketName || typeof bucketName !== "string") return false;
    if (bucketName.length === 0 || bucketName.length > 100) return false;
    if (bucketName.trim() !== bucketName) return false;
    if (bucketName.includes("/") || bucketName.includes("\\")) return false;
    return /^[\w!.\*'() &$@=;:+,?-]+$/.test(bucketName);
  };
  var encodeStoragePath = (path) => path.split("/").map(encodeURIComponent).join("/");
  var _getErrorMessage = (err) => {
    if (typeof err === "object" && err !== null) {
      const e = err;
      if (typeof e.msg === "string") return e.msg;
      if (typeof e.message === "string") return e.message;
      if (typeof e.error_description === "string") return e.error_description;
      if (typeof e.error === "string") return e.error;
      if (typeof e.error === "object" && e.error !== null) {
        const nested = e.error;
        if (typeof nested.message === "string") return nested.message;
      }
    }
    return JSON.stringify(err);
  };
  var handleError = async (error, reject, options2, namespace) => {
    if (error !== null && typeof error === "object" && "json" in error && typeof error.json === "function") {
      const responseError = error;
      let status = parseInt(String(responseError.status), 10);
      if (!Number.isFinite(status)) status = 500;
      responseError.json().then((err) => {
        const statusCode = (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 ? void 0 : err.code) || status + "";
        reject(new StorageApiError(_getErrorMessage(err), status, statusCode, namespace, err === null || err === void 0 ? void 0 : err.code));
      }).catch(() => {
        const statusCode = status + "";
        reject(new StorageApiError(responseError.statusText || `HTTP ${status} error`, status, statusCode, namespace));
      });
    } else reject(new StorageUnknownError(_getErrorMessage(error), error, namespace));
  };
  var _getRequestParams = (method, options2, parameters, body) => {
    const params = {
      method,
      headers: (options2 === null || options2 === void 0 ? void 0 : options2.headers) || {}
    };
    if (method === "GET" || method === "HEAD" || !body) return _objectSpread22(_objectSpread22({}, params), parameters);
    if (isPlainObject(body)) {
      var _contentType;
      const headers = (options2 === null || options2 === void 0 ? void 0 : options2.headers) || {};
      let contentType;
      for (const [key, value] of Object.entries(headers)) if (key.toLowerCase() === "content-type") contentType = value;
      params.headers = setHeader(headers, "Content-Type", (_contentType = contentType) !== null && _contentType !== void 0 ? _contentType : "application/json");
      params.body = JSON.stringify(body);
    } else params.body = body;
    if (options2 === null || options2 === void 0 ? void 0 : options2.duplex) params.duplex = options2.duplex;
    return _objectSpread22(_objectSpread22({}, params), parameters);
  };
  async function _handleRequest(fetcher, method, url, options2, parameters, body, namespace) {
    return new Promise((resolve, reject) => {
      fetcher(url, _getRequestParams(method, options2, parameters, body)).then((result) => {
        if (!result.ok) throw result;
        if (options2 === null || options2 === void 0 ? void 0 : options2.noResolveJson) return result;
        if (namespace === "vectors") {
          const contentType = result.headers.get("content-type");
          if (result.headers.get("content-length") === "0" || result.status === 204) return {};
          if (!contentType || !contentType.includes("application/json")) return {};
        }
        return result.json();
      }).then((data) => resolve(data)).catch((error) => handleError(error, reject, options2, namespace));
    });
  }
  function createFetchApi(namespace = "storage") {
    return {
      get: async (fetcher, url, options2, parameters) => {
        return _handleRequest(fetcher, "GET", url, options2, parameters, void 0, namespace);
      },
      post: async (fetcher, url, body, options2, parameters) => {
        return _handleRequest(fetcher, "POST", url, options2, parameters, body, namespace);
      },
      put: async (fetcher, url, body, options2, parameters) => {
        return _handleRequest(fetcher, "PUT", url, options2, parameters, body, namespace);
      },
      head: async (fetcher, url, options2, parameters) => {
        return _handleRequest(fetcher, "HEAD", url, _objectSpread22(_objectSpread22({}, options2), {}, { noResolveJson: true }), parameters, void 0, namespace);
      },
      remove: async (fetcher, url, body, options2, parameters) => {
        return _handleRequest(fetcher, "DELETE", url, options2, parameters, body, namespace);
      }
    };
  }
  var defaultApi = createFetchApi("storage");
  var { get, post, put, head, remove } = defaultApi;
  var vectorsApi = createFetchApi("vectors");
  var BaseApiClient = class {
    /**
    * Creates a new BaseApiClient instance
    * @param url - Base URL for API requests
    * @param headers - Default headers for API requests
    * @param fetch - Optional custom fetch implementation
    * @param namespace - Error namespace ('storage' or 'vectors')
    */
    constructor(url, headers = {}, fetch$1, namespace = "storage") {
      this.shouldThrowOnError = false;
      this.url = url;
      this.headers = normalizeHeaders(headers);
      this.fetch = resolveFetch2(fetch$1);
      this.namespace = namespace;
    }
    /**
    * Enable throwing errors instead of returning them.
    * When enabled, errors are thrown instead of returned in { data, error } format.
    *
    * @returns this - For method chaining
    */
    throwOnError() {
      this.shouldThrowOnError = true;
      return this;
    }
    /**
    * Set an HTTP header for the request.
    * Creates a shallow copy of headers to avoid mutating shared state.
    *
    * @param name - Header name
    * @param value - Header value
    * @returns this - For method chaining
    */
    setHeader(name, value) {
      this.headers = setHeader(this.headers, name, value);
      return this;
    }
    /**
    * Handles API operation with standardized error handling
    * Eliminates repetitive try-catch blocks across all API methods
    *
    * This wrapper:
    * 1. Executes the operation
    * 2. Returns { data, error: null } on success
    * 3. Returns { data: null, error } on failure (if shouldThrowOnError is false)
    * 4. Throws error on failure (if shouldThrowOnError is true)
    *
    * @typeParam T - The expected data type from the operation
    * @param operation - Async function that performs the API call
    * @returns Promise with { data, error } tuple
    *
    * @example Handling an operation
    * ```typescript
    * async listBuckets() {
    *   return this.handleOperation(async () => {
    *     return await get(this.fetch, `${this.url}/bucket`, {
    *       headers: this.headers,
    *     })
    *   })
    * }
    * ```
    */
    async handleOperation(operation) {
      var _this = this;
      try {
        return {
          data: await operation(),
          error: null
        };
      } catch (error) {
        if (_this.shouldThrowOnError) throw error;
        if (isStorageError(error)) return {
          data: null,
          error
        };
        throw error;
      }
    }
  };
  var _Symbol$toStringTag$1;
  _Symbol$toStringTag$1 = Symbol.toStringTag;
  var StreamDownloadBuilder = class {
    constructor(downloadFn, shouldThrowOnError) {
      this.downloadFn = downloadFn;
      this.shouldThrowOnError = shouldThrowOnError;
      this[_Symbol$toStringTag$1] = "StreamDownloadBuilder";
      this.promise = null;
    }
    then(onfulfilled, onrejected) {
      return this.getPromise().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
      return this.getPromise().catch(onrejected);
    }
    finally(onfinally) {
      return this.getPromise().finally(onfinally);
    }
    getPromise() {
      if (!this.promise) this.promise = this.execute();
      return this.promise;
    }
    async execute() {
      var _this = this;
      try {
        return {
          data: (await _this.downloadFn()).body,
          error: null
        };
      } catch (error) {
        if (_this.shouldThrowOnError) throw error;
        if (isStorageError(error)) return {
          data: null,
          error
        };
        throw error;
      }
    }
  };
  var _Symbol$toStringTag;
  _Symbol$toStringTag = Symbol.toStringTag;
  var BlobDownloadBuilder = class {
    constructor(downloadFn, shouldThrowOnError) {
      this.downloadFn = downloadFn;
      this.shouldThrowOnError = shouldThrowOnError;
      this[_Symbol$toStringTag] = "BlobDownloadBuilder";
      this.promise = null;
    }
    asStream() {
      return new StreamDownloadBuilder(this.downloadFn, this.shouldThrowOnError);
    }
    then(onfulfilled, onrejected) {
      return this.getPromise().then(onfulfilled, onrejected);
    }
    catch(onrejected) {
      return this.getPromise().catch(onrejected);
    }
    finally(onfinally) {
      return this.getPromise().finally(onfinally);
    }
    getPromise() {
      if (!this.promise) this.promise = this.execute();
      return this.promise;
    }
    async execute() {
      var _this = this;
      try {
        return {
          data: await (await _this.downloadFn()).blob(),
          error: null
        };
      } catch (error) {
        if (_this.shouldThrowOnError) throw error;
        if (isStorageError(error)) return {
          data: null,
          error
        };
        throw error;
      }
    }
  };
  function validateStorageUrl(input, expected) {
    const url = new URL(input);
    const prefix = expected.pathname.endsWith("/") ? expected.pathname : `${expected.pathname}/`;
    if (url.origin !== expected.origin || !url.pathname.startsWith(prefix)) throw new StorageError("Object path escapes the intended bucket endpoint");
    return url.href;
  }
  var DEFAULT_SEARCH_OPTIONS = {
    limit: 100,
    offset: 0,
    sortBy: {
      column: "name",
      order: "asc"
    }
  };
  var DEFAULT_FILE_OPTIONS = {
    cacheControl: "3600",
    contentType: "text/plain;charset=UTF-8",
    upsert: false
  };
  function mergeFileOptions(fileOptions) {
    const definedOptions = Object.fromEntries(Object.entries(fileOptions !== null && fileOptions !== void 0 ? fileOptions : {}).filter(([, value]) => value !== void 0));
    return _objectSpread22(_objectSpread22({}, DEFAULT_FILE_OPTIONS), definedOptions);
  }
  var StorageFileApi = class extends BaseApiClient {
    constructor(url, headers = {}, bucketId, fetch$1) {
      super(url, headers, fetch$1, "storage");
      this.bucketId = bucketId;
    }
    /**
    * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
    *
    * @param method HTTP method.
    * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
    * @param fileBody The body of the file to be stored in the bucket.
    */
    async uploadOrUpdate(method, path, fileBody, fileOptions) {
      var _this = this;
      return _this.handleOperation(async () => {
        let body;
        const options2 = mergeFileOptions(fileOptions);
        let headers = _objectSpread22(_objectSpread22({}, _this.headers), method === "POST" && { "x-upsert": String(options2.upsert) });
        const metadata = options2.metadata;
        if (typeof Blob !== "undefined" && fileBody instanceof Blob || typeof FormData !== "undefined" && fileBody instanceof FormData) body = _this.prepareUploadFormData(fileBody, options2);
        else {
          body = fileBody;
          headers["cache-control"] = `max-age=${options2.cacheControl}`;
          headers["content-type"] = options2.contentType;
          if (options2.contentEncoding) headers["content-encoding"] = options2.contentEncoding;
          if (metadata) headers["x-metadata"] = _this.toBase64(_this.encodeMetadata(metadata));
          if ((typeof ReadableStream !== "undefined" && body instanceof ReadableStream || body && typeof body === "object" && "pipe" in body && typeof body.pipe === "function") && !options2.duplex) options2.duplex = "half";
        }
        if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers) for (const [key, value] of Object.entries(fileOptions.headers)) headers = setHeader(headers, key, value);
        const cleanPath = _this._removeEmptyFolders(path);
        const data = await (method == "PUT" ? put : post)(_this.fetch, _this._getRequestUrl("object", cleanPath), body, _objectSpread22({ headers }, (options2 === null || options2 === void 0 ? void 0 : options2.duplex) ? { duplex: options2.duplex } : {}));
        return {
          path: cleanPath,
          id: data.Id,
          fullPath: data.Key
        };
      });
    }
    /**
    * Uploads a file to an existing bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
    * @param fileBody The body of the file to be stored in the bucket.
    * @param fileOptions Optional file upload options including cacheControl, contentType, contentEncoding, upsert, and metadata.
    * @returns Promise with response containing file path, id, and fullPath or error
    *
    * @example Upload file
    * ```js
    * const avatarFile = event.target.files[0]
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .upload('public/avatar1.png', avatarFile, {
    *     cacheControl: '3600',
    *     upsert: false
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "public/avatar1.png",
    *     "fullPath": "avatars/public/avatar1.png"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Upload file using `ArrayBuffer` from base64 file data
    * ```js
    * import { decode } from 'base64-arraybuffer'
    *
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .upload('public/avatar1.png', decode('base64FileData'), {
    *     contentType: 'image/png'
    *   })
    * ```
    *
    * @example Handling errors
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .upload('public/avatar1.png', avatarFile)
    *
    * if (error) {
    *   // Log the full error so fields like `statusCode` and `error` (the
    *   // Storage error name, e.g. "Duplicate") aren't hidden behind `error.message`.
    *   console.error(error)
    *   return
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: only `insert` when you are uploading new files and `select`, `insert` and `update` when you are upserting files
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    * - For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Upload file using `ArrayBuffer` from base64 file data instead, see example below.
    */
    async upload(path, fileBody, fileOptions) {
      return this.uploadOrUpdate("POST", path, fileBody, fileOptions);
    }
    /**
    * Upload a file with a token generated from `createSignedUploadUrl`.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
    * @param token The token generated from `createSignedUploadUrl`
    * @param fileBody The body of the file to be stored in the bucket.
    * @param fileOptions HTTP headers (cacheControl, contentType, contentEncoding, etc.).
    * **Note:** The `upsert` option has no effect here. To enable upsert behavior,
    * pass `{ upsert: true }` when calling `createSignedUploadUrl()` instead.
    * @returns Promise with response containing file path and fullPath or error
    *
    * @example Upload to a signed URL
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "folder/cat.jpg",
    *     "fullPath": "avatars/folder/cat.jpg"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async uploadToSignedUrl(path, token, fileBody, fileOptions) {
      var _this3 = this;
      const cleanPath = _this3._removeEmptyFolders(path);
      return _this3.handleOperation(async () => {
        const url = new URL(_this3._getRequestUrl("object/upload/sign", cleanPath));
        url.searchParams.set("token", token);
        let body;
        const options2 = mergeFileOptions(fileOptions);
        let headers = _objectSpread22(_objectSpread22({}, _this3.headers), { "x-upsert": String(options2.upsert) });
        const metadata = options2.metadata;
        if (typeof Blob !== "undefined" && fileBody instanceof Blob || typeof FormData !== "undefined" && fileBody instanceof FormData) body = _this3.prepareUploadFormData(fileBody, options2);
        else {
          body = fileBody;
          headers["cache-control"] = `max-age=${options2.cacheControl}`;
          headers["content-type"] = options2.contentType;
          if (options2.contentEncoding) headers["content-encoding"] = options2.contentEncoding;
          if (metadata) headers["x-metadata"] = _this3.toBase64(_this3.encodeMetadata(metadata));
          if ((typeof ReadableStream !== "undefined" && body instanceof ReadableStream || body && typeof body === "object" && "pipe" in body && typeof body.pipe === "function") && !options2.duplex) options2.duplex = "half";
        }
        if (fileOptions === null || fileOptions === void 0 ? void 0 : fileOptions.headers) for (const [key, value] of Object.entries(fileOptions.headers)) headers = setHeader(headers, key, value);
        return {
          path: cleanPath,
          fullPath: (await put(_this3.fetch, url.toString(), body, _objectSpread22({ headers }, (options2 === null || options2 === void 0 ? void 0 : options2.duplex) ? { duplex: options2.duplex } : {}))).Key
        };
      });
    }
    /**
    * Creates a signed upload URL.
    * Signed upload URLs can be used to upload files to the bucket without further authentication.
    * They are valid for 2 hours.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The file path, including the current file name. For example `folder/image.png`.
    * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
    * @returns Promise with response containing signed upload URL, token, and path or error
    *
    * @example Create Signed Upload URL
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUploadUrl('folder/cat.jpg')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "signedUrl": "https://example.supabase.co/storage/v1/object/upload/sign/avatars/folder/cat.jpg?token=<TOKEN>",
    *     "path": "folder/cat.jpg",
    *     "token": "<TOKEN>"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `insert`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async createSignedUploadUrl(path, options2) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        const headers = _objectSpread22({}, _this4.headers);
        if (options2 === null || options2 === void 0 ? void 0 : options2.upsert) headers["x-upsert"] = "true";
        const data = await post(_this4.fetch, _this4._getRequestUrl("object/upload/sign", path), {}, { headers });
        const url = new URL(_this4.url + data.url);
        const token = url.searchParams.get("token");
        if (!token) throw new StorageError("No token returned by API");
        return {
          signedUrl: url.toString(),
          path,
          token
        };
      });
    }
    /**
    * Replaces an existing file at the specified path with a new one.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
    * @param fileBody The body of the file to be stored in the bucket.
    * @param fileOptions Optional file upload options including cacheControl, contentType, contentEncoding, and metadata.
    * **Note:** The `upsert` option has no effect here. `update()` always replaces the
    * file at the given path, so the `x-upsert` header is not sent. To control upsert
    * behavior, use `upload()` instead.
    * @returns Promise with response containing file path, id, and fullPath or error
    *
    * @example Update file
    * ```js
    * const avatarFile = event.target.files[0]
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .update('public/avatar1.png', avatarFile, {
    *     cacheControl: '3600'
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "public/avatar1.png",
    *     "fullPath": "avatars/public/avatar1.png"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Update file using `ArrayBuffer` from base64 file data
    * ```js
    * import {decode} from 'base64-arraybuffer'
    *
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .update('public/avatar1.png', decode('base64FileData'), {
    *     contentType: 'image/png'
    *   })
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `update` and `select`
    * - `update()` always replaces the file at the given path regardless of the `upsert` option.
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    * - For React Native, using either `Blob`, `File` or `FormData` does not work as intended. Update file using `ArrayBuffer` from base64 file data instead, see example below.
    */
    async update(path, fileBody, fileOptions) {
      return this.uploadOrUpdate("PUT", path, fileBody, fileOptions);
    }
    /**
    * Moves an existing file to a new path in the same bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
    * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
    * @param options The destination options.
    * @param options.sourceVersionId The version id of the source object to move.
    * @returns Promise with response containing success message or error
    *
    * @example Move file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .move('public/avatar1.png', 'private/avatar2.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully moved"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `update` and `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async move(fromPath, toPath, options2) {
      var _this6 = this;
      return _this6.handleOperation(async () => {
        return await post(_this6.fetch, `${_this6.url}/object/move`, {
          bucketId: _this6.bucketId,
          sourceKey: fromPath,
          destinationKey: toPath,
          destinationBucket: options2 === null || options2 === void 0 ? void 0 : options2.destinationBucket,
          sourceVersionId: options2 === null || options2 === void 0 ? void 0 : options2.sourceVersionId
        }, { headers: _this6.headers });
      });
    }
    /**
    * Copies an existing file to a new path in the same bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
    * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
    * @param options The destination and metadata options.
    * @param options.sourceVersionId The version id of the source object to copy.
    * @param options.copyMetadata Whether to copy the source metadata. Defaults to true. Set to false to apply metadata overrides; custom user metadata is not copied when false.
    * @param options.metadata File metadata overrides, applied only when copyMetadata is false. Unspecified fields retain their source values.
    * @returns Promise with response containing copied file path or error
    *
    * @example Copy file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .copy('public/avatar1.png', 'private/avatar2.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "path": "avatars/private/avatar2.png"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Copy file with content encoding
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('documents')
    *   .copy('source.txt.gz', 'copy.txt.gz', {
    *     copyMetadata: false,
    *     metadata: { contentEncoding: 'gzip' },
    *   })
    * ```
    * The source must already contain gzip-encoded bytes. Copying changes metadata only.
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `insert` and `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async copy(fromPath, toPath, options2) {
      var _this7 = this;
      return _this7.handleOperation(async () => {
        const copyOptions = options2;
        return { path: (await post(_this7.fetch, `${_this7.url}/object/copy`, {
          bucketId: _this7.bucketId,
          sourceKey: fromPath,
          destinationKey: toPath,
          destinationBucket: options2 === null || options2 === void 0 ? void 0 : options2.destinationBucket,
          sourceVersionId: options2 === null || options2 === void 0 ? void 0 : options2.sourceVersionId,
          copyMetadata: typeof (copyOptions === null || copyOptions === void 0 ? void 0 : copyOptions.copyMetadata) === "boolean" ? copyOptions.copyMetadata : void 0,
          metadata: (copyOptions === null || copyOptions === void 0 ? void 0 : copyOptions.copyMetadata) === false ? copyOptions.metadata : void 0
        }, { headers: _this7.headers })).Key };
      });
    }
    /**
    * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The file path, including the current file name. For example `folder/image.png`.
    * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
    * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
    * @param options.transform Transform the asset before serving it to the client.
    * @param options.cacheNonce Append a cache nonce parameter to the URL to invalidate the cache.
    * @param options.versionId Create a signed URL for a specific object version rather than the current one.
    * @returns Promise with response containing signed URL or error
    *
    * @example Create Signed URL
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrl('folder/avatar1.png', 60)
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @example Create a signed URL for an asset with transformations
    * ```js
    * const { data } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrl('folder/avatar1.png', 60, {
    *     transform: {
    *       width: 100,
    *       height: 100,
    *     }
    *   })
    * ```
    *
    * @example Create a signed URL which triggers the download of the asset
    * ```js
    * const { data } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrl('folder/avatar1.png', 60, {
    *     download: true,
    *   })
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async createSignedUrl(path, expiresIn, options2) {
      var _this8 = this;
      return _this8.handleOperation(async () => {
        const hasTransform = typeof (options2 === null || options2 === void 0 ? void 0 : options2.transform) === "object" && options2.transform !== null && Object.keys(options2.transform).length > 0;
        let data = await post(_this8.fetch, _this8._getRequestUrl("object/sign", path), _objectSpread22(_objectSpread22({ expiresIn }, hasTransform ? { transform: options2.transform } : {}), (options2 === null || options2 === void 0 ? void 0 : options2.versionId) != null ? { versionId: options2.versionId } : {}), { headers: _this8.headers });
        const query = new URLSearchParams();
        if (options2 === null || options2 === void 0 ? void 0 : options2.download) query.set("download", options2.download === true ? "" : options2.download);
        if ((options2 === null || options2 === void 0 ? void 0 : options2.cacheNonce) != null) query.set("cacheNonce", String(options2.cacheNonce));
        const queryString = query.toString();
        return { signedUrl: encodeURI(`${_this8.url}${data.signedURL}${queryString ? `&${queryString}` : ""}`) };
      });
    }
    /**
    * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
    * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
    * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
    * @param options.cacheNonce Append a cache nonce parameter to the URL to invalidate the cache.
    * @returns Promise with response containing array of objects with signedUrl, path, and error or error
    *
    * @example Create Signed URLs
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .createSignedUrls(['folder/avatar1.png', 'folder/avatar2.png'], 60)
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [
    *     {
    *       "error": null,
    *       "path": "folder/avatar1.png",
    *       "signedURL": "/object/sign/avatars/folder/avatar1.png?token=<TOKEN>",
    *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar1.png?token=<TOKEN>"
    *     },
    *     {
    *       "error": null,
    *       "path": "folder/avatar2.png",
    *       "signedURL": "/object/sign/avatars/folder/avatar2.png?token=<TOKEN>",
    *       "signedUrl": "https://example.supabase.co/storage/v1/object/sign/avatars/folder/avatar2.png?token=<TOKEN>"
    *     }
    *   ],
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async createSignedUrls(paths, expiresIn, options2) {
      var _this9 = this;
      return _this9.handleOperation(async () => {
        const data = await post(_this9.fetch, `${_this9.url}/object/sign/${_this9.bucketId}`, {
          expiresIn,
          paths
        }, { headers: _this9.headers });
        const query = new URLSearchParams();
        if (options2 === null || options2 === void 0 ? void 0 : options2.download) query.set("download", options2.download === true ? "" : options2.download);
        if ((options2 === null || options2 === void 0 ? void 0 : options2.cacheNonce) != null) query.set("cacheNonce", String(options2.cacheNonce));
        const queryString = query.toString();
        return data.map((datum) => _objectSpread22(_objectSpread22({}, datum), {}, { signedUrl: datum.signedURL ? encodeURI(`${_this9.url}${datum.signedURL}${queryString ? `&${queryString}` : ""}`) : null }));
      });
    }
    /**
    * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
    * @param options Optional settings: `transform` to transform the asset before serving it to the client, `cacheNonce` to append a cache nonce parameter to the URL to invalidate the cache, and `versionId` to download a specific object version.
    * @param parameters Additional fetch parameters like signal for cancellation. Supports standard fetch options including cache control.
    * @returns BlobDownloadBuilder instance for downloading the file
    *
    * @example Download file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .download('folder/avatar1.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": <BLOB>,
    *   "error": null
    * }
    * ```
    *
    * @example Download file with transformations
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .download('folder/avatar1.png', {
    *     transform: {
    *       width: 100,
    *       height: 100,
    *       quality: 80
    *     }
    *   })
    * ```
    *
    * @example Download with cache control (useful in Edge Functions)
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .download('folder/avatar1.png', {}, { cache: 'no-store' })
    * ```
    *
    * @example Download with abort signal
    * ```js
    * const controller = new AbortController()
    * setTimeout(() => controller.abort(), 5000)
    *
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .download('folder/avatar1.png', {}, { signal: controller.signal })
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    download(path, options2, parameters) {
      const renderPath = typeof (options2 === null || options2 === void 0 ? void 0 : options2.transform) === "object" && options2.transform !== null && Object.keys(options2.transform).length > 0 ? "render/image/authenticated" : "object";
      const query = new URLSearchParams();
      if (options2 === null || options2 === void 0 ? void 0 : options2.transform) this.applyTransformOptsToQuery(query, options2.transform);
      if ((options2 === null || options2 === void 0 ? void 0 : options2.cacheNonce) != null) query.set("cacheNonce", String(options2.cacheNonce));
      if ((options2 === null || options2 === void 0 ? void 0 : options2.versionId) != null) query.set("versionId", String(options2.versionId));
      const queryString = query.toString();
      const downloadFn = () => get(this.fetch, this._getRequestUrl(renderPath, path, { queryString }), {
        headers: this.headers,
        noResolveJson: true
      }, parameters);
      return new BlobDownloadBuilder(downloadFn, this.shouldThrowOnError);
    }
    /**
    * Retrieves the details of an existing file.
    *
    * Returns detailed file metadata including size, content type, and timestamps.
    * Note: The API returns `last_modified` field, not `updated_at`.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The file path, including the file name. For example `folder/image.png`.
    * @param options Optional settings, including `versionId` to retrieve a specific object version.
    * @returns Promise with response containing file metadata or error
    *
    * @example Get file info
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .info('folder/avatar1.png')
    *
    * if (data) {
    *   console.log('Last modified:', data.lastModified)
    *   console.log('Size:', data.size)
    * }
    * ```
    */
    async info(path, options2) {
      var _this10 = this;
      const query = new URLSearchParams();
      if ((options2 === null || options2 === void 0 ? void 0 : options2.versionId) != null) query.set("versionId", String(options2.versionId));
      const queryString = query.toString();
      return _this10.handleOperation(async () => {
        return recursiveToCamel(await get(_this10.fetch, _this10._getRequestUrl("object/info", path, { queryString }), { headers: _this10.headers }));
      });
    }
    /**
    * Checks the existence of a file.
    *
    * This reads the object's metadata, so the result is `false` only when Storage reports that the
    * key does not exist: an error with code `NoSuchKey`, or an HTTP 404 with no error code. In that
    * case `data` is `false` and `error` holds the original error.
    *
    * Every other failure throws instead of returning `false`, including an invalid or expired JWT
    * (`InvalidJWT`), a missing bucket (`NoSuchBucket`) and network errors. With `throwOnError()`,
    * a missing key throws as well.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The file path, including the file name. For example `folder/image.png`.
    * @returns Promise with response containing boolean indicating file existence or error
    *
    * @example Check file existence
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .exists('folder/avatar1.png')
    * ```
    */
    async exists(path) {
      const { error } = await this.info(path);
      if (!error) return {
        data: true,
        error: null
      };
      if (error instanceof StorageApiError && (error.code === "NoSuchKey" || error.status === 404 && error.code === void 0)) return {
        data: false,
        error
      };
      throw error;
    }
    /**
    * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
    * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
    * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
    * @param options.transform Transform the asset before serving it to the client.
    * @param options.cacheNonce Append a cache nonce parameter to the URL to invalidate the cache.
    * @param options.versionId Return the URL for a specific object version rather than the current one.
    * @returns Object with public URL
    *
    * @example Returns the URL for an asset in a public bucket
    * ```js
    * const { data } = supabase
    *   .storage
    *   .from('public-bucket')
    *   .getPublicUrl('folder/avatar1.png')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "publicUrl": "https://example.supabase.co/storage/v1/object/public/public-bucket/folder/avatar1.png"
    *   }
    * }
    * ```
    *
    * @example Returns the URL for an asset in a public bucket with transformations
    * ```js
    * const { data } = supabase
    *   .storage
    *   .from('public-bucket')
    *   .getPublicUrl('folder/avatar1.png', {
    *     transform: {
    *       width: 100,
    *       height: 100,
    *     }
    *   })
    * ```
    *
    * @example Returns the URL which triggers the download of an asset in a public bucket
    * ```js
    * const { data } = supabase
    *   .storage
    *   .from('public-bucket')
    *   .getPublicUrl('folder/avatar1.png', {
    *     download: true,
    *   })
    * ```
    *
    * @remarks
    * - The bucket needs to be set to public, either via [updateBucket()](/docs/reference/javascript/storage-updatebucket) or by going to Storage on [supabase.com/dashboard](https://supabase.com/dashboard), clicking the overflow menu on a bucket and choosing "Make public"
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    getPublicUrl(path, options2) {
      const _path = this._getFinalPath(path);
      const query = new URLSearchParams();
      if (options2 === null || options2 === void 0 ? void 0 : options2.download) query.set("download", options2.download === true ? "" : options2.download);
      if (options2 === null || options2 === void 0 ? void 0 : options2.transform) this.applyTransformOptsToQuery(query, options2.transform);
      if ((options2 === null || options2 === void 0 ? void 0 : options2.cacheNonce) != null) query.set("cacheNonce", String(options2.cacheNonce));
      if ((options2 === null || options2 === void 0 ? void 0 : options2.versionId) != null) query.set("versionId", String(options2.versionId));
      const queryString = query.toString();
      const renderPath = typeof (options2 === null || options2 === void 0 ? void 0 : options2.transform) === "object" && options2.transform !== null && Object.keys(options2.transform).length > 0 ? "render/image" : "object";
      return { data: { publicUrl: encodeURI(`${this.url}/${renderPath}/public/${_path}`) + (queryString ? `?${queryString}` : "") } };
    }
    /**
    * Deletes files within the same bucket
    *
    * Returns an array of FileObject entries for the deleted files. Note that deprecated
    * fields like `bucket_id` may or may not be present in the response - do not rely on them.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param paths An array of files to delete. Each entry is either a path (deletes whichever
    * version is currently at that path, e.g. `'folder/image.png'`), or `{ path, versionId }` to
    * delete an exact version current or archived (e.g. `{ path: 'folder/image.png', versionId: '...' }`).
    * @returns Promise with response containing array of deleted file objects or error
    *
    * @example Delete file
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .remove(['folder/avatar1.png'])
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [],
    *   "error": null
    * }
    * ```
    *
    * @example Delete a specific object version
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .remove([{ path: 'folder/avatar1.png', versionId: 'noncurrent-version-id' }])
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `delete` and `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async remove(paths) {
      var _this12 = this;
      return _this12.handleOperation(async () => {
        return await remove(_this12.fetch, `${_this12.url}/object/${_this12.bucketId}`, { prefixes: paths }, { headers: _this12.headers });
      });
    }
    /**
    * Purges the CDN cache for a single object in this bucket.
    *
    * Maps to `DELETE /cdn/{bucket}/{path}` on the Storage API. The server
    * issues a CDN invalidation for the object and returns `{ message: 'success' }`.
    *
    * **Requires the `service_role` key.** The underlying endpoint enforces
    * `service_role` JWT — calls made with the anon key or a user JWT will be
    * rejected by the server.
    *
    * **Hosted CDN feature.** On self-hosted Supabase, the Storage service must
    * have `CDN_PURGE_ENDPOINT_URL` configured and the `purgeCache` tenant
    * feature enabled, otherwise the server returns an error.
    *
    * Operates on a single object path. There is no wildcard or recursion: pass
    * the exact path of the object you want invalidated.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The path (relative to the bucket) of the object to purge, e.g. `folder/avatar.png`.
    * @param options Optional purge cache options.
    * @param options.transformations If true, purges only transformations (resized/formatted variants), leaving the original cached file intact.
    * @param parameters Optional fetch parameters such as an `AbortController` signal.
    * @returns Promise with `{ data: { message }, error: null }` on success or `{ data: null, error }` on failure.
    *
    * @example Purge a single cached object
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .purgeCache('folder/avatar1.png')
    * ```
    *
    * @example Purge only transformations for a single object
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .purgeCache('folder/avatar1.png', { transformations: true })
    * ```
    */
    async purgeCache(path, options2, parameters) {
      var _this13 = this;
      return _this13.handleOperation(async () => {
        const query = new URLSearchParams();
        if (options2 === null || options2 === void 0 ? void 0 : options2.transformations) query.set("transformations", "true");
        const queryString = query.toString();
        return await remove(_this13.fetch, _this13._getRequestUrl("cdn", path, {
          encodePath: true,
          queryString
        }), {}, { headers: _this13.headers }, parameters);
      });
    }
    /**
    * Get file metadata
    * @param id the file id to retrieve metadata
    */
    /**
    * Update file metadata
    * @param id the file id to update metadata
    * @param meta the new file metadata
    */
    /**
    * Lists all the files and folders within a path of the bucket.
    *
    * **Important:** For folder entries, fields like `id`, `updated_at`, `created_at`,
    * `last_accessed_at`, and `metadata` will be `null`. Only files have these fields populated.
    * Additionally, deprecated fields like `bucket_id`, `owner`, and `buckets` are NOT returned
    * by this method.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param path The folder path.
    * @param options Search options including limit (defaults to 100), offset, sortBy, and search
    * @param parameters Optional fetch parameters including signal for cancellation
    * @returns Promise with response containing array of files/folders or error
    *
    * @example List files in a bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .list('folder', {
    *     limit: 100,
    *     offset: 0,
    *     sortBy: { column: 'name', order: 'asc' },
    *   })
    *
    * // Handle files vs folders
    * data?.forEach(item => {
    *   if (item.id !== null) {
    *     // It's a file
    *     console.log('File:', item.name, 'Size:', item.metadata?.size)
    *   } else {
    *     // It's a folder
    *     console.log('Folder:', item.name)
    *   }
    * })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "avatar1.png",
    *       "id": "e668cf7f-821b-4a2f-9dce-7dfa5dd1cfd2",
    *       "updated_at": "2024-05-22T23:06:05.580Z",
    *       "created_at": "2024-05-22T23:04:34.443Z",
    *       "last_accessed_at": "2024-05-22T23:04:34.443Z",
    *       "metadata": {
    *         "eTag": "\"c5e8c553235d9af30ef4f6e280790b92\"",
    *         "size": 32175,
    *         "mimetype": "image/png",
    *         "cacheControl": "max-age=3600",
    *         "lastModified": "2024-05-22T23:06:05.574Z",
    *         "contentLength": 32175,
    *         "httpStatusCode": 200
    *       }
    *     }
    *   ],
    *   "error": null
    * }
    * ```
    *
    * @example Search files in a bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .list('folder', {
    *     limit: 100,
    *     offset: 0,
    *     sortBy: { column: 'name', order: 'asc' },
    *     search: 'jon'
    *   })
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: none
    *   - `objects` table permissions: `select`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async list(path, options2, parameters) {
      var _this14 = this;
      return _this14.handleOperation(async () => {
        const sortBy = (options2 === null || options2 === void 0 ? void 0 : options2.sortBy) ? _objectSpread22(_objectSpread22({}, DEFAULT_SEARCH_OPTIONS.sortBy), options2.sortBy) : DEFAULT_SEARCH_OPTIONS.sortBy;
        const body = _objectSpread22(_objectSpread22(_objectSpread22({}, DEFAULT_SEARCH_OPTIONS), options2), {}, {
          sortBy,
          prefix: path || ""
        });
        return await post(_this14.fetch, `${_this14.url}/object/list/${_this14.bucketId}`, body, { headers: _this14.headers }, parameters);
      });
    }
    /**
    * Lists all the files and folders within a bucket using the V2 API with pagination support.
    *
    * **Important:** Folder entries in the `folders` array only contain `name` and optionally `key` —
    * they have no `id`, timestamps, or `metadata` fields. Full file metadata is only available
    * on entries in the `objects` array.
    *
    * @experimental this method signature might change in the future
    *
    * @category Storage
    * @subcategory File Buckets
    * @param options Search options including prefix, cursor for pagination, limit, with_delimiter
    * @param parameters Optional fetch parameters including signal for cancellation
    * @returns Promise with response containing folders/objects arrays with pagination info or error
    *
    * @example List files with pagination
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .from('avatars')
    *   .listV2({
    *     prefix: 'folder/',
    *     limit: 100,
    *   })
    *
    * // Handle pagination
    * if (data?.hasNext) {
    *   const nextPage = await supabase
    *     .storage
    *     .from('avatars')
    *     .listV2({
    *       prefix: 'folder/',
    *       cursor: data.nextCursor,
    *     })
    * }
    *
    * // Handle files vs folders
    * data?.objects.forEach(file => {
    *   if (file.id !== null) {
    *     console.log('File:', file.name, 'Size:', file.metadata?.size)
    *   }
    * })
    * data?.folders.forEach(folder => {
    *   console.log('Folder:', folder.name)
    * })
    * ```
    */
    async listV2(options2, parameters) {
      var _this15 = this;
      return _this15.handleOperation(async () => {
        const body = _objectSpread22({}, options2);
        return await post(_this15.fetch, `${_this15.url}/object/list-v2/${_this15.bucketId}`, body, { headers: _this15.headers }, parameters);
      });
    }
    prepareUploadFormData(fileBody, options2) {
      const body = new FormData();
      const files = [];
      if (fileBody instanceof FormData) fileBody.forEach((value, name) => {
        if (typeof value === "string") body.append(name, value);
        else files.push([name, value]);
      });
      else files.push(["", fileBody]);
      if (!body.has("cacheControl")) body.append("cacheControl", options2.cacheControl);
      if (options2.metadata && !body.has("metadata")) body.append("metadata", this.encodeMetadata(options2.metadata));
      if (options2.contentEncoding && !body.has("contentEncoding")) body.append("contentEncoding", options2.contentEncoding);
      for (const [name, file] of files) body.append(name, file);
      return body;
    }
    encodeMetadata(metadata) {
      return JSON.stringify(metadata);
    }
    toBase64(data) {
      if (typeof Buffer !== "undefined") return Buffer.from(data).toString("base64");
      return btoa(data);
    }
    /** Builds a request URL and checks that it stays within the intended Storage route and bucket. */
    _getRequestUrl(route, path, { encodePath = false, queryString = "" } = {}) {
      const finalPath = this._getFinalPath(path);
      const bucket = encodePath ? encodeStoragePath(String(this.bucketId)) : this.bucketId;
      const url = `${this.url}/${route}/${encodePath ? encodeStoragePath(finalPath) : finalPath}${queryString ? `?${queryString}` : ""}`;
      const routeUrl = new URL(`${this.url}/${route}/`);
      const requestUrl = validateStorageUrl(url, routeUrl);
      const bucketUrl = new URL(`${this.url}/${route}/${bucket}/`);
      if (bucketUrl.pathname.startsWith(routeUrl.pathname)) {
        const bucketSegment = bucketUrl.pathname.slice(routeUrl.pathname.length).split("/")[0];
        if (bucketSegment) bucketUrl.pathname = `${routeUrl.pathname}${bucketSegment}/`;
      }
      return validateStorageUrl(requestUrl, bucketUrl);
    }
    _getFinalPath(path) {
      return `${this.bucketId}/${path.replace(/^\/+/, "")}`;
    }
    _removeEmptyFolders(path) {
      return path.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
    }
    /** Modifies the `query`, appending values the from `transform` */
    applyTransformOptsToQuery(query, transform) {
      if (transform.width) query.set("width", transform.width.toString());
      if (transform.height) query.set("height", transform.height.toString());
      if (transform.resize) query.set("resize", transform.resize);
      if (transform.format) query.set("format", transform.format);
      if (transform.quality) query.set("quality", transform.quality.toString());
      return query;
    }
  };
  var version2 = "2.119.2";
  var DEFAULT_HEADERS = { "X-Client-Info": `storage-js/${version2}` };
  var StorageBucketApi = class extends BaseApiClient {
    constructor(url, headers = {}, fetch$1, opts) {
      const baseUrl = new URL(url);
      if (opts === null || opts === void 0 ? void 0 : opts.useNewHostname) {
        if (/supabase\.(co|in|red)$/.test(baseUrl.hostname) && !baseUrl.hostname.includes("storage.supabase.")) baseUrl.hostname = baseUrl.hostname.replace("supabase.", "storage.supabase.");
      }
      const finalUrl = baseUrl.href.replace(/\/$/, "");
      const finalHeaders = _objectSpread22(_objectSpread22({}, DEFAULT_HEADERS), headers);
      super(finalUrl, finalHeaders, fetch$1, "storage");
    }
    /**
    * Retrieves the details of all Storage buckets within an existing project.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param options Query parameters for listing buckets
    * @param options.limit Maximum number of buckets to return
    * @param options.offset Number of buckets to skip
    * @param options.sortColumn Column to sort by ('id', 'name', 'created_at', 'updated_at')
    * @param options.sortOrder Sort order ('asc' or 'desc')
    * @param options.search Search term to filter bucket names
    * @returns Promise with response containing array of buckets or error
    *
    * @example List buckets
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .listBuckets()
    * ```
    *
    * @example List buckets with options
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .listBuckets({
    *     limit: 10,
    *     offset: 0,
    *     sortColumn: 'created_at',
    *     sortOrder: 'desc',
    *     search: 'prod'
    *   })
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async listBuckets(options2) {
      var _this = this;
      return _this.handleOperation(async () => {
        const queryString = _this.listBucketOptionsToQueryString(options2);
        return await get(_this.fetch, `${_this.url}/bucket${queryString}`, { headers: _this.headers });
      });
    }
    /**
    * Retrieves the details of an existing Storage bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket you would like to retrieve.
    * @returns Promise with response containing bucket details or error
    *
    * @example Get bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .getBucket('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "id": "avatars",
    *     "name": "avatars",
    *     "owner": "",
    *     "public": false,
    *     "file_size_limit": 1024,
    *     "allowed_mime_types": [
    *       "image/png"
    *     ],
    *     "created_at": "2024-05-22T22:26:05.100Z",
    *     "updated_at": "2024-05-22T22:26:05.100Z"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async getBucket(id) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await get(_this2.fetch, `${_this2.url}/bucket/${id}`, { headers: _this2.headers });
      });
    }
    /**
    * Creates a new Storage bucket
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id A unique identifier for the bucket you are creating.
    * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
    * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
    * The global file size limit takes precedence over this value.
    * The default value is null, which doesn't set a per bucket file size limit.
    * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
    * The default value is null, which allows files with all mime types to be uploaded.
    * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
    * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
    *   - default bucket type is `STANDARD`
    * @param options.versioningStatus the bucket's initial object versioning status.
    * The default value is `DISABLED`
    * @returns Promise with response containing newly created bucket name or error
    *
    * @example Create bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .createBucket('avatars', {
    *     public: false,
    *     allowedMimeTypes: ['image/png'],
    *     fileSizeLimit: 1024
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "name": "avatars"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `insert`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async createBucket(id, options2 = { public: false }) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await post(_this3.fetch, `${_this3.url}/bucket`, {
          id,
          name: id,
          type: options2.type,
          public: options2.public,
          file_size_limit: options2.fileSizeLimit,
          allowed_mime_types: options2.allowedMimeTypes,
          versioning_status: options2.versioningStatus
        }, { headers: _this3.headers });
      });
    }
    /**
    * Updates a Storage bucket
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id A unique identifier for the bucket you are updating.
    * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
    * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
    * The global file size limit takes precedence over this value.
    * The default value is null, which doesn't set a per bucket file size limit.
    * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
    * The default value is null, which allows files with all mime types to be uploaded.
    * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
    * @param options.versioningStatus the bucket's new object versioning status. `DISABLED` is not
    * valid here, there's no transition back to it once versioning has been touched.
    * @returns Promise with response containing success message or error
    *
    * @example Update bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .updateBucket('avatars', {
    *     public: false,
    *     allowedMimeTypes: ['image/png'],
    *     fileSizeLimit: 1024
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully updated"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select` and `update`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async updateBucket(id, options2) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await put(_this4.fetch, `${_this4.url}/bucket/${id}`, {
          id,
          name: id,
          public: options2.public,
          file_size_limit: options2.fileSizeLimit,
          allowed_mime_types: options2.allowedMimeTypes,
          versioning_status: options2.versioningStatus
        }, { headers: _this4.headers });
      });
    }
    /**
    * Removes all objects inside a single bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket you would like to empty.
    * @returns Promise with success message or error
    *
    * @example Empty bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .emptyBucket('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully emptied"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select`
    *   - `objects` table permissions: `select` and `delete`
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async emptyBucket(id) {
      var _this5 = this;
      return _this5.handleOperation(async () => {
        return await post(_this5.fetch, `${_this5.url}/bucket/${id}/empty`, {}, { headers: _this5.headers });
      });
    }
    /**
    * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
    * You must first `empty()` the bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket you would like to delete.
    * @returns Promise with success message or error
    *
    * @example Delete bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .deleteBucket('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully deleted"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select` and `delete`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async deleteBucket(id) {
      var _this6 = this;
      return _this6.handleOperation(async () => {
        return await remove(_this6.fetch, `${_this6.url}/bucket/${id}`, {}, { headers: _this6.headers });
      });
    }
    /**
    * Returns the lifecycle policy stored on a bucket.
    *
    * Fails with `NoSuchLifecycleConfiguration` when the bucket has no policy.
    *
    * These rules expire previous versions of objects, not the current one.
    * Turn versioning on or there is nothing for the policy to act on.
    * Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off
    * for the project.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket.
    * @returns Promise with the lifecycle configuration or error
    *
    * @example Get lifecycle configuration
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .getBucketLifecycle('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "rules": [
    *       {
    *         "id": "expire-history",
    *         "status": "Enabled",
    *         "filter": {},
    *         "noncurrentVersionExpiration": {
    *           "noncurrentDays": 30,
    *           "newerNoncurrentVersions": 2
    *         }
    *       }
    *     ]
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async getBucketLifecycle(id) {
      var _this7 = this;
      return _this7.handleOperation(async () => {
        return await get(_this7.fetch, _this7.bucketLifecycleUrl(id), { headers: _this7.headers });
      });
    }
    /**
    * Replaces the lifecycle policy on a bucket.
    *
    * The `rules` array you send is the whole policy. Anything previously stored
    * is overwritten. Send at least one rule. Call {@link deleteBucketLifecycle}
    * to remove the policy.
    *
    * Each rule currently supports only `noncurrentVersionExpiration`. `filter`
    * is required and must be `{}`. Prefix filters, tag filters, and current-object
    * expiration are rejected. Rule IDs must be unique. Omit `id` and the
    * server generates one.
    *
    * Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off
    * for the project.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket.
    * @param configuration The full lifecycle configuration to store.
    * @returns Promise with the stored configuration or error
    *
    * @example Replace lifecycle configuration
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .updateBucketLifecycle('avatars', {
    *     rules: [
    *       {
    *         id: 'expire-history',
    *         status: 'Enabled',
    *         filter: {},
    *         noncurrentVersionExpiration: {
    *           noncurrentDays: 30,
    *           newerNoncurrentVersions: 2,
    *         },
    *       },
    *     ],
    *   })
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select` and `update`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async updateBucketLifecycle(id, configuration) {
      var _this8 = this;
      return _this8.handleOperation(async () => {
        return await put(_this8.fetch, _this8.bucketLifecycleUrl(id), configuration, { headers: _this8.headers });
      });
    }
    /**
    * Removes the lifecycle policy from a bucket.
    *
    * Safe to call when no policy is stored. The response is still success.
    * Standard buckets only. Returns `FeatureNotEnabled` if lifecycle is off
    * for the project.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket.
    * @returns Promise with success message or error
    *
    * @example Delete lifecycle configuration
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .deleteBucketLifecycle('avatars')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully deleted"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - RLS policy permissions required:
    *   - `buckets` table permissions: `select` and `update`
    *   - `objects` table permissions: none
    * - Refer to the [Storage guide](/docs/guides/storage/security/access-control) on how access control works
    */
    async deleteBucketLifecycle(id) {
      var _this9 = this;
      return _this9.handleOperation(async () => {
        return await remove(_this9.fetch, _this9.bucketLifecycleUrl(id), {}, { headers: _this9.headers });
      });
    }
    /**
    * Purges the CDN cache for an entire bucket.
    *
    * Maps to `DELETE /cdn/{bucket}` on the Storage API. The server
    * issues a CDN invalidation for the bucket and returns `{ message: 'success' }`.
    *
    * **Requires the `service_role` key.** The underlying endpoint enforces
    * `service_role` JWT — calls made with the anon key or a user JWT will be
    * rejected by the server.
    *
    * **Hosted CDN feature.** On self-hosted Supabase, the Storage service must
    * have `CDN_PURGE_ENDPOINT_URL` configured and the `purgeCache` tenant
    * feature enabled, otherwise the server returns an error.
    *
    * @category Storage
    * @subcategory File Buckets
    * @param id The unique identifier of the bucket you would like to purge from cache.
    * @param options Optional purge cache options.
    * @param options.transformations If true, purges only transformations (resized/formatted variants), leaving original cached files intact.
    * @param parameters Optional fetch parameters such as an `AbortController` signal.
    * @returns Promise with `{ data: { message }, error: null }` on success or `{ data: null, error }` on failure.
    *
    * @example Purge cache for an entire bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .purgeBucketCache('avatars')
    * ```
    *
    * @example Purge only transformations for an entire bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .purgeBucketCache('avatars', { transformations: true })
    * ```
    */
    async purgeBucketCache(id, options2, parameters) {
      var _this10 = this;
      return _this10.handleOperation(async () => {
        const query = new URLSearchParams();
        if (options2 === null || options2 === void 0 ? void 0 : options2.transformations) query.set("transformations", "true");
        const queryString = query.toString();
        return await remove(_this10.fetch, `${_this10.url}/cdn/${encodeStoragePath(id)}${queryString ? `?${queryString}` : ""}`, {}, { headers: _this10.headers }, parameters);
      });
    }
    bucketLifecycleUrl(id) {
      return `${this.url}/bucket/${encodeStoragePath(id)}/lifecycle`;
    }
    listBucketOptionsToQueryString(options2) {
      const params = {};
      if (options2) {
        if ("limit" in options2) params.limit = String(options2.limit);
        if ("offset" in options2) params.offset = String(options2.offset);
        if (options2.search) params.search = options2.search;
        if (options2.sortColumn) params.sortColumn = options2.sortColumn;
        if (options2.sortOrder) params.sortOrder = options2.sortOrder;
      }
      return Object.keys(params).length > 0 ? "?" + new URLSearchParams(params).toString() : "";
    }
  };
  var StorageAnalyticsClient = class extends BaseApiClient {
    /**
    * @alpha
    *
    * Creates a new StorageAnalyticsClient instance
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Analytics Buckets
    * @param url - The base URL for the storage API
    * @param headers - HTTP headers to include in requests
    * @param fetch - Optional custom fetch implementation
    *
    * @example Using supabase-js (recommended)
    * ```typescript
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * const { data, error } = await supabase.storage.analytics.listBuckets()
    * ```
    *
    * @example Standalone import for bundle-sensitive environments
    * ```typescript
    * import { StorageAnalyticsClient } from '@supabase/storage-js'
    *
    * const client = new StorageAnalyticsClient(url, headers)
    * ```
    */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread22(_objectSpread22({}, DEFAULT_HEADERS), headers);
      super(finalUrl, finalHeaders, fetch$1, "storage");
    }
    /**
    * @alpha
    *
    * Creates a new analytics bucket using Iceberg tables
    * Analytics buckets are optimized for analytical queries and data processing
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Analytics Buckets
    * @param name A unique name for the bucket you are creating
    * @returns Promise with response containing newly created analytics bucket or error
    *
    * @example Create analytics bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .analytics
    *   .createBucket('analytics-data')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "name": "analytics-data",
    *     "type": "ANALYTICS",
    *     "format": "iceberg",
    *     "created_at": "2024-05-22T22:26:05.100Z",
    *     "updated_at": "2024-05-22T22:26:05.100Z"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - Creates a new analytics bucket using Iceberg tables
    * - Analytics buckets are optimized for analytical queries and data processing
    */
    async createBucket(name) {
      var _this = this;
      return _this.handleOperation(async () => {
        return await post(_this.fetch, `${_this.url}/bucket`, { name }, { headers: _this.headers });
      });
    }
    /**
    * @alpha
    *
    * Retrieves the details of all Analytics Storage buckets within an existing project
    * Only returns buckets of type 'ANALYTICS'
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Analytics Buckets
    * @param options Query parameters for listing buckets
    * @param options.limit Maximum number of buckets to return
    * @param options.offset Number of buckets to skip
    * @param options.sortColumn Column to sort by ('name', 'created_at', 'updated_at')
    * @param options.sortOrder Sort order ('asc' or 'desc')
    * @param options.search Search term to filter bucket names
    * @returns Promise with response containing array of analytics buckets or error
    *
    * @example List analytics buckets
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .analytics
    *   .listBuckets({
    *     limit: 10,
    *     offset: 0,
    *     sortColumn: 'created_at',
    *     sortOrder: 'desc'
    *   })
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": [
    *     {
    *       "name": "analytics-data",
    *       "type": "ANALYTICS",
    *       "format": "iceberg",
    *       "created_at": "2024-05-22T22:26:05.100Z",
    *       "updated_at": "2024-05-22T22:26:05.100Z"
    *     }
    *   ],
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - Retrieves the details of all Analytics Storage buckets within an existing project
    * - Only returns buckets of type 'ANALYTICS'
    */
    async listBuckets(options2) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        const queryParams = new URLSearchParams();
        if ((options2 === null || options2 === void 0 ? void 0 : options2.limit) !== void 0) queryParams.set("limit", options2.limit.toString());
        if ((options2 === null || options2 === void 0 ? void 0 : options2.offset) !== void 0) queryParams.set("offset", options2.offset.toString());
        if (options2 === null || options2 === void 0 ? void 0 : options2.sortColumn) queryParams.set("sortColumn", options2.sortColumn);
        if (options2 === null || options2 === void 0 ? void 0 : options2.sortOrder) queryParams.set("sortOrder", options2.sortOrder);
        if (options2 === null || options2 === void 0 ? void 0 : options2.search) queryParams.set("search", options2.search);
        const queryString = queryParams.toString();
        const url = queryString ? `${_this2.url}/bucket?${queryString}` : `${_this2.url}/bucket`;
        return await get(_this2.fetch, url, { headers: _this2.headers });
      });
    }
    /**
    * @alpha
    *
    * Deletes an existing analytics bucket
    * A bucket can't be deleted with existing objects inside it
    * You must first empty the bucket before deletion
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Analytics Buckets
    * @param bucketName The unique identifier of the bucket you would like to delete
    * @returns Promise with response containing success message or error
    *
    * @example Delete analytics bucket
    * ```js
    * const { data, error } = await supabase
    *   .storage
    *   .analytics
    *   .deleteBucket('analytics-data')
    * ```
    *
    * Response:
    * ```json
    * {
    *   "data": {
    *     "message": "Successfully deleted"
    *   },
    *   "error": null
    * }
    * ```
    *
    * @remarks
    * - Deletes an analytics bucket
    */
    async deleteBucket(bucketName) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await remove(_this3.fetch, `${_this3.url}/bucket/${bucketName}`, {}, { headers: _this3.headers });
      });
    }
    /**
    * @alpha
    *
    * Get an Iceberg REST Catalog client configured for a specific analytics bucket
    * Use this to perform advanced table and namespace operations within the bucket
    * The returned client provides full access to the Apache Iceberg REST Catalog API
    * with the Supabase `{ data, error }` pattern for consistent error handling on all operations.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Analytics Buckets
    * @param bucketName - The name of the analytics bucket (warehouse) to connect to
    * @returns The wrapped Iceberg catalog client
    * @throws {StorageError} If the bucket name is invalid
    *
    * @example Get catalog and create table
    * ```js
    * // First, create an analytics bucket
    * const { data: bucket, error: bucketError } = await supabase
    *   .storage
    *   .analytics
    *   .createBucket('analytics-data')
    *
    * // Get the Iceberg catalog for that bucket
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // Create a namespace
    * const { error: nsError } = await catalog.createNamespace({ namespace: ['default'] })
    *
    * // Create a table with schema
    * const { data: tableMetadata, error: tableError } = await catalog.createTable(
    *   { namespace: ['default'] },
    *   {
    *     name: 'events',
    *     schema: {
    *       type: 'struct',
    *       fields: [
    *         { id: 1, name: 'id', type: 'long', required: true },
    *         { id: 2, name: 'timestamp', type: 'timestamp', required: true },
    *         { id: 3, name: 'user_id', type: 'string', required: false }
    *       ],
    *       'schema-id': 0,
    *       'identifier-field-ids': [1]
    *     },
    *     'partition-spec': {
    *       'spec-id': 0,
    *       fields: []
    *     },
    *     'write-order': {
    *       'order-id': 0,
    *       fields: []
    *     },
    *     properties: {
    *       'write.format.default': 'parquet'
    *     }
    *   }
    * )
    * ```
    *
    * @example List tables in namespace
    * ```js
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // List all tables in the default namespace
    * const { data: tables, error: listError } = await catalog.listTables({ namespace: ['default'] })
    * if (listError) {
    *   if (listError.isNotFound()) {
    *     console.log('Namespace not found')
    *   }
    *   return
    * }
    * console.log(tables) // [{ namespace: ['default'], name: 'events' }]
    * ```
    *
    * @example Working with namespaces
    * ```js
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // List all namespaces
    * const { data: namespaces } = await catalog.listNamespaces()
    *
    * // Create namespace with properties
    * await catalog.createNamespace(
    *   { namespace: ['production'] },
    *   { properties: { owner: 'data-team', env: 'prod' } }
    * )
    * ```
    *
    * @example Cleanup operations
    * ```js
    * const catalog = supabase.storage.analytics.from('analytics-data')
    *
    * // Drop table with purge option (removes all data)
    * const { error: dropError } = await catalog.dropTable(
    *   { namespace: ['default'], name: 'events' },
    *   { purge: true }
    * )
    *
    * if (dropError?.isNotFound()) {
    *   console.log('Table does not exist')
    * }
    *
    * // Drop namespace (must be empty)
    * await catalog.dropNamespace({ namespace: ['default'] })
    * ```
    *
    * @remarks
    * This method provides a bridge between Supabase's bucket management and the standard
    * Apache Iceberg REST Catalog API. The bucket name maps to the Iceberg warehouse parameter.
    * All authentication and configuration is handled automatically using your Supabase credentials.
    *
    * **Error Handling**: Invalid bucket names throw immediately. All catalog
    * operations return `{ data, error }` where errors are `IcebergError` instances from iceberg-js.
    * Use helper methods like `error.isNotFound()` or check `error.status` for specific error handling.
    * Use `.throwOnError()` on the analytics client if you prefer exceptions for catalog operations.
    *
    * **Cleanup Operations**: When using `dropTable`, the `purge: true` option permanently
    * deletes all table data. Without it, the table is marked as deleted but data remains.
    *
    * **Library Dependency**: The returned catalog wraps `IcebergRestCatalog` from iceberg-js.
    * For complete API documentation and advanced usage, refer to the
    * [iceberg-js documentation](https://supabase.github.io/iceberg-js/).
    */
    from(bucketName) {
      var _this4 = this;
      if (!isValidBucketName(bucketName)) throw new StorageError("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");
      const catalog = new IcebergRestCatalog({
        baseUrl: this.url,
        catalogName: bucketName,
        auth: {
          type: "custom",
          getHeaders: async () => _this4.headers
        },
        fetch: this.fetch
      });
      const shouldThrowOnError = this.shouldThrowOnError;
      return new Proxy(catalog, { get(target, prop) {
        const value = target[prop];
        if (typeof value !== "function") return value;
        return async (...args) => {
          try {
            return {
              data: await value.apply(target, args),
              error: null
            };
          } catch (error) {
            if (shouldThrowOnError) throw error;
            return {
              data: null,
              error
            };
          }
        };
      } });
    }
  };
  var VectorIndexApi = class extends BaseApiClient {
    /** Creates a new VectorIndexApi instance */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread22(_objectSpread22({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
      super(finalUrl, finalHeaders, fetch$1, "vectors");
    }
    /** Creates a new vector index within a bucket */
    async createIndex(options2) {
      var _this = this;
      return _this.handleOperation(async () => {
        return await vectorsApi.post(_this.fetch, `${_this.url}/CreateIndex`, options2, { headers: _this.headers }) || {};
      });
    }
    /** Retrieves metadata for a specific vector index */
    async getIndex(vectorBucketName, indexName) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetIndex`, {
          vectorBucketName,
          indexName
        }, { headers: _this2.headers });
      });
    }
    /** Lists vector indexes within a bucket with optional filtering and pagination */
    async listIndexes(options2) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListIndexes`, options2, { headers: _this3.headers });
      });
    }
    /** Deletes a vector index and all its data */
    async deleteIndex(vectorBucketName, indexName) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await vectorsApi.post(_this4.fetch, `${_this4.url}/DeleteIndex`, {
          vectorBucketName,
          indexName
        }, { headers: _this4.headers }) || {};
      });
    }
  };
  var VectorDataApi = class extends BaseApiClient {
    /** Creates a new VectorDataApi instance */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread22(_objectSpread22({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
      super(finalUrl, finalHeaders, fetch$1, "vectors");
    }
    /** Inserts or updates vectors in batch (1-500 per request) */
    async putVectors(options2) {
      var _this = this;
      if (options2.vectors.length < 1 || options2.vectors.length > 500) throw new Error("Vector batch size must be between 1 and 500 items");
      return _this.handleOperation(async () => {
        return await vectorsApi.post(_this.fetch, `${_this.url}/PutVectors`, options2, { headers: _this.headers }) || {};
      });
    }
    /** Retrieves vectors by their keys in batch */
    async getVectors(options2) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetVectors`, options2, { headers: _this2.headers });
      });
    }
    /** Lists vectors in an index with pagination */
    async listVectors(options2) {
      var _this3 = this;
      if (options2.segmentCount !== void 0) {
        if (options2.segmentCount < 1 || options2.segmentCount > 16) throw new Error("segmentCount must be between 1 and 16");
        if (options2.segmentIndex !== void 0) {
          if (options2.segmentIndex < 0 || options2.segmentIndex >= options2.segmentCount) throw new Error(`segmentIndex must be between 0 and ${options2.segmentCount - 1}`);
        }
      }
      return _this3.handleOperation(async () => {
        return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListVectors`, options2, { headers: _this3.headers });
      });
    }
    /** Queries for similar vectors using approximate nearest neighbor search */
    async queryVectors(options2) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await vectorsApi.post(_this4.fetch, `${_this4.url}/QueryVectors`, options2, { headers: _this4.headers });
      });
    }
    /** Deletes vectors by their keys in batch (1-500 per request) */
    async deleteVectors(options2) {
      var _this5 = this;
      if (options2.keys.length < 1 || options2.keys.length > 500) throw new Error("Keys batch size must be between 1 and 500 items");
      return _this5.handleOperation(async () => {
        return await vectorsApi.post(_this5.fetch, `${_this5.url}/DeleteVectors`, options2, { headers: _this5.headers }) || {};
      });
    }
  };
  var VectorBucketApi = class extends BaseApiClient {
    /** Creates a new VectorBucketApi instance */
    constructor(url, headers = {}, fetch$1) {
      const finalUrl = url.replace(/\/$/, "");
      const finalHeaders = _objectSpread22(_objectSpread22({}, DEFAULT_HEADERS), {}, { "Content-Type": "application/json" }, headers);
      super(finalUrl, finalHeaders, fetch$1, "vectors");
    }
    /** Creates a new vector bucket */
    async createBucket(vectorBucketName) {
      var _this = this;
      return _this.handleOperation(async () => {
        return await vectorsApi.post(_this.fetch, `${_this.url}/CreateVectorBucket`, { vectorBucketName }, { headers: _this.headers }) || {};
      });
    }
    /** Retrieves metadata for a specific vector bucket */
    async getBucket(vectorBucketName) {
      var _this2 = this;
      return _this2.handleOperation(async () => {
        return await vectorsApi.post(_this2.fetch, `${_this2.url}/GetVectorBucket`, { vectorBucketName }, { headers: _this2.headers });
      });
    }
    /** Lists vector buckets with optional filtering and pagination */
    async listBuckets(options2 = {}) {
      var _this3 = this;
      return _this3.handleOperation(async () => {
        return await vectorsApi.post(_this3.fetch, `${_this3.url}/ListVectorBuckets`, options2, { headers: _this3.headers });
      });
    }
    /** Deletes a vector bucket (must be empty first) */
    async deleteBucket(vectorBucketName) {
      var _this4 = this;
      return _this4.handleOperation(async () => {
        return await vectorsApi.post(_this4.fetch, `${_this4.url}/DeleteVectorBucket`, { vectorBucketName }, { headers: _this4.headers }) || {};
      });
    }
  };
  var StorageVectorsClient = class extends VectorBucketApi {
    /**
    * @alpha
    *
    * Creates a StorageVectorsClient that can manage buckets, indexes, and vectors.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param url - Base URL of the Storage Vectors REST API.
    * @param options.headers - Optional headers (for example `Authorization`) applied to every request.
    * @param options.fetch - Optional custom `fetch` implementation for non-browser runtimes.
    *
    * @example Using supabase-js (recommended)
    * ```typescript
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * ```
    *
    * @example Standalone import for bundle-sensitive environments
    * ```typescript
    * import { StorageVectorsClient } from '@supabase/storage-js'
    *
    * const client = new StorageVectorsClient(url, options)
    * ```
    */
    constructor(url, options2 = {}) {
      super(url, options2.headers || {}, options2.fetch);
    }
    /**
    *
    * @alpha
    *
    * Access operations for a specific vector bucket
    * Returns a scoped client for index and vector operations within the bucket
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param vectorBucketName - Name of the vector bucket
    * @returns Bucket-scoped client with index and vector operations
    *
    * @example Accessing a vector bucket
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * ```
    */
    from(vectorBucketName) {
      return new VectorBucketScope(this.url, this.headers, vectorBucketName, this.fetch);
    }
    /**
    *
    * @alpha
    *
    * Creates a new vector bucket
    * Vector buckets are containers for vector indexes and their data
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param vectorBucketName - Unique name for the vector bucket
    * @returns Promise with empty response on success or error
    *
    * @example Creating a vector bucket
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .createBucket('embeddings-prod')
    * ```
    */
    async createBucket(vectorBucketName) {
      var _superprop_getCreateBucket = () => super.createBucket, _this = this;
      return _superprop_getCreateBucket().call(_this, vectorBucketName);
    }
    /**
    *
    * @alpha
    *
    * Retrieves metadata for a specific vector bucket
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param vectorBucketName - Name of the vector bucket
    * @returns Promise with bucket metadata or error
    *
    * @example Get bucket metadata
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .getBucket('embeddings-prod')
    *
    * console.log('Bucket created:', data?.vectorBucket.creationTime)
    * ```
    */
    async getBucket(vectorBucketName) {
      var _superprop_getGetBucket = () => super.getBucket, _this2 = this;
      return _superprop_getGetBucket().call(_this2, vectorBucketName);
    }
    /**
    *
    * @alpha
    *
    * Lists all vector buckets with optional filtering and pagination
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Optional filters (prefix, maxResults, nextToken)
    * @returns Promise with list of buckets or error
    *
    * @example List vector buckets
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .listBuckets({ prefix: 'embeddings-' })
    *
    * data?.vectorBuckets.forEach(bucket => {
    *   console.log(bucket.vectorBucketName)
    * })
    * ```
    */
    async listBuckets(options2 = {}) {
      var _superprop_getListBuckets = () => super.listBuckets, _this3 = this;
      return _superprop_getListBuckets().call(_this3, options2);
    }
    /**
    *
    * @alpha
    *
    * Deletes a vector bucket (bucket must be empty)
    * All indexes must be deleted before deleting the bucket
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param vectorBucketName - Name of the vector bucket to delete
    * @returns Promise with empty response on success or error
    *
    * @example Delete a vector bucket
    * ```typescript
    * const { data, error } = await supabase
    *   .storage
    *   .vectors
    *   .deleteBucket('embeddings-old')
    * ```
    */
    async deleteBucket(vectorBucketName) {
      var _superprop_getDeleteBucket = () => super.deleteBucket, _this4 = this;
      return _superprop_getDeleteBucket().call(_this4, vectorBucketName);
    }
  };
  var VectorBucketScope = class extends VectorIndexApi {
    /**
    * @alpha
    *
    * Creates a helper that automatically scopes all index operations to the provided bucket.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @example Creating a vector bucket scope
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * ```
    */
    constructor(url, headers, vectorBucketName, fetch$1) {
      super(url, headers, fetch$1);
      this.vectorBucketName = vectorBucketName;
    }
    /**
    *
    * @alpha
    *
    * Creates a new vector index in this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Index configuration (vectorBucketName is automatically set)
    * @returns Promise with empty response on success or error
    *
    * @example Creating a vector index
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * await bucket.createIndex({
    *   indexName: 'documents-openai',
    *   dataType: 'float32',
    *   dimension: 1536,
    *   distanceMetric: 'cosine',
    *   metadataConfiguration: {
    *     nonFilterableMetadataKeys: ['raw_text']
    *   }
    * })
    * ```
    */
    async createIndex(options2) {
      var _superprop_getCreateIndex = () => super.createIndex, _this5 = this;
      return _superprop_getCreateIndex().call(_this5, _objectSpread22(_objectSpread22({}, options2), {}, { vectorBucketName: _this5.vectorBucketName }));
    }
    /**
    *
    * @alpha
    *
    * Lists indexes in this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Listing options (vectorBucketName is automatically set)
    * @returns Promise with response containing indexes array and pagination token or error
    *
    * @example List indexes
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * const { data } = await bucket.listIndexes({ prefix: 'documents-' })
    * ```
    */
    async listIndexes(options2 = {}) {
      var _superprop_getListIndexes = () => super.listIndexes, _this6 = this;
      return _superprop_getListIndexes().call(_this6, _objectSpread22(_objectSpread22({}, options2), {}, { vectorBucketName: _this6.vectorBucketName }));
    }
    /**
    *
    * @alpha
    *
    * Retrieves metadata for a specific index in this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param indexName - Name of the index to retrieve
    * @returns Promise with index metadata or error
    *
    * @example Get index metadata
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * const { data } = await bucket.getIndex('documents-openai')
    * console.log('Dimension:', data?.index.dimension)
    * ```
    */
    async getIndex(indexName) {
      var _superprop_getGetIndex = () => super.getIndex, _this7 = this;
      return _superprop_getGetIndex().call(_this7, _this7.vectorBucketName, indexName);
    }
    /**
    *
    * @alpha
    *
    * Deletes an index from this bucket
    * Convenience method that automatically includes the bucket name
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param indexName - Name of the index to delete
    * @returns Promise with empty response on success or error
    *
    * @example Delete an index
    * ```typescript
    * const bucket = supabase.storage.vectors.from('embeddings-prod')
    * await bucket.deleteIndex('old-index')
    * ```
    */
    async deleteIndex(indexName) {
      var _superprop_getDeleteIndex = () => super.deleteIndex, _this8 = this;
      return _superprop_getDeleteIndex().call(_this8, _this8.vectorBucketName, indexName);
    }
    /**
    *
    * @alpha
    *
    * Access operations for a specific index within this bucket
    * Returns a scoped client for vector data operations
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param indexName - Name of the index
    * @returns Index-scoped client with vector data operations
    *
    * @example Accessing an index
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    *
    * // Insert vectors
    * await index.putVectors({
    *   vectors: [
    *     { key: 'doc-1', data: { float32: [...] }, metadata: { title: 'Intro' } }
    *   ]
    * })
    *
    * // Query similar vectors
    * const { data } = await index.queryVectors({
    *   queryVector: { float32: [...] },
    *   topK: 5
    * })
    * ```
    */
    index(indexName) {
      return new VectorIndexScope(this.url, this.headers, this.vectorBucketName, indexName, this.fetch);
    }
  };
  var VectorIndexScope = class extends VectorDataApi {
    /**
    *
    * @alpha
    *
    * Creates a helper that automatically scopes all vector operations to the provided bucket/index names.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @example Creating a vector index scope
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * ```
    */
    constructor(url, headers, vectorBucketName, indexName, fetch$1) {
      super(url, headers, fetch$1);
      this.vectorBucketName = vectorBucketName;
      this.indexName = indexName;
    }
    /**
    *
    * @alpha
    *
    * Inserts or updates vectors in this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Vector insertion options (bucket and index names automatically set)
    * @returns Promise with empty response on success or error
    *
    * @example Insert vectors into an index
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * await index.putVectors({
    *   vectors: [
    *     {
    *       key: 'doc-1',
    *       data: { float32: [0.1, 0.2, ...] },
    *       metadata: { title: 'Introduction', page: 1 }
    *     }
    *   ]
    * })
    * ```
    */
    async putVectors(options2) {
      var _superprop_getPutVectors = () => super.putVectors, _this9 = this;
      return _superprop_getPutVectors().call(_this9, _objectSpread22(_objectSpread22({}, options2), {}, {
        vectorBucketName: _this9.vectorBucketName,
        indexName: _this9.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Retrieves vectors by keys from this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Vector retrieval options (bucket and index names automatically set)
    * @returns Promise with response containing vectors array or error
    *
    * @example Get vectors by keys
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * const { data } = await index.getVectors({
    *   keys: ['doc-1', 'doc-2'],
    *   returnMetadata: true
    * })
    * ```
    */
    async getVectors(options2) {
      var _superprop_getGetVectors = () => super.getVectors, _this10 = this;
      return _superprop_getGetVectors().call(_this10, _objectSpread22(_objectSpread22({}, options2), {}, {
        vectorBucketName: _this10.vectorBucketName,
        indexName: _this10.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Lists vectors in this index with pagination
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Listing options (bucket and index names automatically set)
    * @returns Promise with response containing vectors array and pagination token or error
    *
    * @example List vectors with pagination
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * const { data } = await index.listVectors({
    *   maxResults: 500,
    *   returnMetadata: true
    * })
    * ```
    */
    async listVectors(options2 = {}) {
      var _superprop_getListVectors = () => super.listVectors, _this11 = this;
      return _superprop_getListVectors().call(_this11, _objectSpread22(_objectSpread22({}, options2), {}, {
        vectorBucketName: _this11.vectorBucketName,
        indexName: _this11.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Queries for similar vectors in this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Query options (bucket and index names automatically set)
    * @returns Promise with response containing vectors ordered by distance, an optional pagination token, or an error
    *
    * @example Query similar vectors
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * const { data } = await index.queryVectors({
    *   queryVector: { float32: [0.1, 0.2, ...] },
    *   topK: 5,
    *   filter: { category: 'technical' },
    *   returnDistance: true,
    *   returnMetadata: true
    * })
    * ```
    */
    async queryVectors(options2) {
      var _superprop_getQueryVectors = () => super.queryVectors, _this12 = this;
      return _superprop_getQueryVectors().call(_this12, _objectSpread22(_objectSpread22({}, options2), {}, {
        vectorBucketName: _this12.vectorBucketName,
        indexName: _this12.indexName
      }));
    }
    /**
    *
    * @alpha
    *
    * Deletes vectors by keys from this index
    * Convenience method that automatically includes bucket and index names
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    * @param options - Deletion options (bucket and index names automatically set)
    * @returns Promise with empty response on success or error
    *
    * @example Delete vectors by keys
    * ```typescript
    * const index = supabase.storage.vectors.from('embeddings-prod').index('documents-openai')
    * await index.deleteVectors({
    *   keys: ['doc-1', 'doc-2', 'doc-3']
    * })
    * ```
    */
    async deleteVectors(options2) {
      var _superprop_getDeleteVectors = () => super.deleteVectors, _this13 = this;
      return _superprop_getDeleteVectors().call(_this13, _objectSpread22(_objectSpread22({}, options2), {}, {
        vectorBucketName: _this13.vectorBucketName,
        indexName: _this13.indexName
      }));
    }
  };
  var StorageClient = class extends StorageBucketApi {
    /**
    * Creates a client for Storage buckets, files, analytics, and vectors.
    *
    * @category Storage
    * @subcategory File Buckets
    *
    * @example Using supabase-js (recommended)
    * ```ts
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * const avatars = supabase.storage.from('avatars')
    * ```
    *
    * @example Standalone import for bundle-sensitive environments
    * ```ts
    * import { StorageClient } from '@supabase/storage-js'
    *
    * const storage = new StorageClient('https://xyzcompany.supabase.co/storage/v1', {
    *   apikey: 'your-publishable-key',
    * })
    * const avatars = storage.from('avatars')
    * ```
    */
    constructor(url, headers = {}, fetch$1, opts) {
      super(url, headers, fetch$1, opts);
    }
    /**
    * Perform file operation in a bucket.
    *
    * @category Storage
    * @subcategory File Buckets
    *
    * @param id The bucket id to operate on.
    *
    * @example Accessing a bucket
    * ```typescript
    * const avatars = supabase.storage.from('avatars')
    * ```
    */
    from(id) {
      return new StorageFileApi(this.url, this.headers, id, this.fetch);
    }
    /**
    *
    * @alpha
    *
    * Access vector storage operations.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Vector Buckets
    *
    * @returns A StorageVectorsClient instance configured with the current storage settings.
    */
    get vectors() {
      return new StorageVectorsClient(this.url + "/vector", {
        headers: this.headers,
        fetch: this.fetch
      });
    }
    /**
    *
    * @alpha
    *
    * Access analytics storage operations using Iceberg tables.
    *
    * **Public alpha:** This API is part of a public alpha release and may not be available to your account type.
    *
    * @category Storage
    * @subcategory Analytics Buckets
    *
    * @returns A StorageAnalyticsClient instance configured with the current storage settings.
    */
    get analytics() {
      return new StorageAnalyticsClient(this.url + "/iceberg", this.headers, this.fetch);
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/version.js
  var version3 = "2.119.2";

  // node_modules/@supabase/auth-js/dist/module/lib/constants.js
  var AUTO_REFRESH_TICK_DURATION_MS = 30 * 1e3;
  var AUTO_REFRESH_TICK_THRESHOLD = 3;
  var EXPIRY_MARGIN_MS = AUTO_REFRESH_TICK_THRESHOLD * AUTO_REFRESH_TICK_DURATION_MS;
  var REFRESH_FAILURE_COOLDOWN_MS = 2 * AUTO_REFRESH_TICK_DURATION_MS;
  var GOTRUE_URL = "http://localhost:9999";
  var STORAGE_KEY = "supabase.auth.token";
  var DEFAULT_HEADERS2 = { "X-Client-Info": `gotrue-js/${version3}` };
  var API_VERSION_HEADER_NAME = "X-Supabase-Api-Version";
  var API_VERSIONS = {
    "2024-01-01": {
      timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
      name: "2024-01-01"
    }
  };
  var BASE64URL_REGEX = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i;
  var PKCE_FLOW_ID_PARAM = "sb_flow_id";
  var PKCE_MAX_CONCURRENT_FLOWS = 5;
  var JWKS_TTL = 10 * 60 * 1e3;

  // node_modules/@supabase/auth-js/dist/module/lib/errors.js
  var AuthError = class extends Error {
    constructor(message, status, code) {
      super(message);
      this.__isAuthError = true;
      this.name = "AuthError";
      this.status = status;
      this.code = code;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        status: this.status,
        code: this.code
      };
    }
  };
  function isAuthError(error) {
    return typeof error === "object" && error !== null && "__isAuthError" in error;
  }
  var AuthApiError = class extends AuthError {
    constructor(message, status, code) {
      super(message, status, code);
      this.name = "AuthApiError";
      this.status = status;
      this.code = code;
    }
  };
  function isAuthApiError(error) {
    return isAuthError(error) && error.name === "AuthApiError";
  }
  var AuthUnknownError = class extends AuthError {
    constructor(message, originalError) {
      super(message);
      this.name = "AuthUnknownError";
      this.originalError = originalError;
    }
  };
  var CustomAuthError = class extends AuthError {
    constructor(message, name, status, code) {
      super(message, status, code);
      this.name = name;
      this.status = status;
    }
  };
  var AuthSessionMissingError = class extends CustomAuthError {
    constructor() {
      super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
    }
  };
  function isAuthSessionMissingError(error) {
    return isAuthError(error) && error.name === "AuthSessionMissingError";
  }
  var AuthInvalidTokenResponseError = class extends CustomAuthError {
    constructor() {
      super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
    }
  };
  var AuthInvalidCredentialsError = class extends CustomAuthError {
    constructor(message) {
      super(message, "AuthInvalidCredentialsError", 400, void 0);
    }
  };
  var AuthImplicitGrantRedirectError = class extends CustomAuthError {
    constructor(message, details = null) {
      super(message, "AuthImplicitGrantRedirectError", 500, void 0);
      this.details = null;
      this.details = details;
    }
    toJSON() {
      return Object.assign(Object.assign({}, super.toJSON()), { details: this.details });
    }
  };
  function isAuthImplicitGrantRedirectError(error) {
    return isAuthError(error) && error.name === "AuthImplicitGrantRedirectError";
  }
  var AuthPKCEGrantCodeExchangeError = class extends CustomAuthError {
    constructor(message, details = null) {
      super(message, "AuthPKCEGrantCodeExchangeError", 500, void 0);
      this.details = null;
      this.details = details;
    }
    toJSON() {
      return Object.assign(Object.assign({}, super.toJSON()), { details: this.details });
    }
  };
  var AuthPKCECodeVerifierMissingError = class extends CustomAuthError {
    constructor() {
      super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.", "AuthPKCECodeVerifierMissingError", 400, "pkce_code_verifier_not_found");
    }
  };
  var AuthRetryableFetchError = class extends CustomAuthError {
    constructor(message, status) {
      super(message, "AuthRetryableFetchError", status, void 0);
    }
  };
  function isAuthRetryableFetchError(error) {
    return isAuthError(error) && error.name === "AuthRetryableFetchError";
  }
  var AuthRefreshDiscardedError = class extends CustomAuthError {
    constructor(message = "Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)") {
      super(message, "AuthRefreshDiscardedError", 409, void 0);
    }
  };
  function isAuthRefreshDiscardedError(error) {
    return isAuthError(error) && error.name === "AuthRefreshDiscardedError";
  }
  var AuthWeakPasswordError = class extends CustomAuthError {
    constructor(message, status, reasons) {
      super(message, "AuthWeakPasswordError", status, "weak_password");
      this.reasons = reasons;
    }
    toJSON() {
      return Object.assign(Object.assign({}, super.toJSON()), { reasons: this.reasons });
    }
  };
  var AuthInvalidJwtError = class extends CustomAuthError {
    constructor(message) {
      super(message, "AuthInvalidJwtError", 400, "invalid_jwt");
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/base64url.js
  var TO_BASE64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split("");
  var IGNORE_BASE64URL = " 	\n\r=".split("");
  var FROM_BASE64URL = (() => {
    const charMap = new Array(128);
    for (let i = 0; i < charMap.length; i += 1) {
      charMap[i] = -1;
    }
    for (let i = 0; i < IGNORE_BASE64URL.length; i += 1) {
      charMap[IGNORE_BASE64URL[i].charCodeAt(0)] = -2;
    }
    for (let i = 0; i < TO_BASE64URL.length; i += 1) {
      charMap[TO_BASE64URL[i].charCodeAt(0)] = i;
    }
    return charMap;
  })();
  function byteToBase64URL(byte, state, emit) {
    if (byte !== null) {
      state.queue = state.queue << 8 | byte;
      state.queuedBits += 8;
      while (state.queuedBits >= 6) {
        const pos = state.queue >> state.queuedBits - 6 & 63;
        emit(TO_BASE64URL[pos]);
        state.queuedBits -= 6;
      }
    } else if (state.queuedBits > 0) {
      state.queue = state.queue << 6 - state.queuedBits;
      state.queuedBits = 6;
      while (state.queuedBits >= 6) {
        const pos = state.queue >> state.queuedBits - 6 & 63;
        emit(TO_BASE64URL[pos]);
        state.queuedBits -= 6;
      }
    }
  }
  function byteFromBase64URL(charCode, state, emit) {
    const bits = FROM_BASE64URL[charCode];
    if (bits > -1) {
      state.queue = state.queue << 6 | bits;
      state.queuedBits += 6;
      while (state.queuedBits >= 8) {
        emit(state.queue >> state.queuedBits - 8 & 255);
        state.queuedBits -= 8;
      }
    } else if (bits === -2) {
      return;
    } else {
      throw new Error(`Invalid Base64-URL character "${String.fromCharCode(charCode)}"`);
    }
  }
  function stringFromBase64URL(str) {
    const conv = [];
    const utf8Emit = (codepoint) => {
      conv.push(String.fromCodePoint(codepoint));
    };
    const utf8State = {
      utf8seq: 0,
      codepoint: 0
    };
    const b64State = { queue: 0, queuedBits: 0 };
    const byteEmit = (byte) => {
      stringFromUTF8(byte, utf8State, utf8Emit);
    };
    for (let i = 0; i < str.length; i += 1) {
      byteFromBase64URL(str.charCodeAt(i), b64State, byteEmit);
    }
    return conv.join("");
  }
  function codepointToUTF8(codepoint, emit) {
    if (codepoint <= 127) {
      emit(codepoint);
      return;
    } else if (codepoint <= 2047) {
      emit(192 | codepoint >> 6);
      emit(128 | codepoint & 63);
      return;
    } else if (codepoint <= 65535) {
      emit(224 | codepoint >> 12);
      emit(128 | codepoint >> 6 & 63);
      emit(128 | codepoint & 63);
      return;
    } else if (codepoint <= 1114111) {
      emit(240 | codepoint >> 18);
      emit(128 | codepoint >> 12 & 63);
      emit(128 | codepoint >> 6 & 63);
      emit(128 | codepoint & 63);
      return;
    }
    throw new Error(`Unrecognized Unicode codepoint: ${codepoint.toString(16)}`);
  }
  function stringToUTF8(str, emit) {
    for (let i = 0; i < str.length; i += 1) {
      let codepoint = str.charCodeAt(i);
      if (codepoint > 55295 && codepoint <= 56319) {
        const highSurrogate = (codepoint - 55296) * 1024 & 65535;
        const lowSurrogate = str.charCodeAt(i + 1) - 56320 & 65535;
        codepoint = (lowSurrogate | highSurrogate) + 65536;
        i += 1;
      }
      codepointToUTF8(codepoint, emit);
    }
  }
  function stringFromUTF8(byte, state, emit) {
    if (state.utf8seq === 0) {
      if (byte <= 127) {
        emit(byte);
        return;
      }
      for (let leadingBit = 1; leadingBit < 6; leadingBit += 1) {
        if ((byte >> 7 - leadingBit & 1) === 0) {
          state.utf8seq = leadingBit;
          break;
        }
      }
      if (state.utf8seq === 2) {
        state.codepoint = byte & 31;
      } else if (state.utf8seq === 3) {
        state.codepoint = byte & 15;
      } else if (state.utf8seq === 4) {
        state.codepoint = byte & 7;
      } else {
        throw new Error("Invalid UTF-8 sequence");
      }
      state.utf8seq -= 1;
    } else if (state.utf8seq > 0) {
      if (byte <= 127) {
        throw new Error("Invalid UTF-8 sequence");
      }
      state.codepoint = state.codepoint << 6 | byte & 63;
      state.utf8seq -= 1;
      if (state.utf8seq === 0) {
        emit(state.codepoint);
      }
    }
  }
  function base64UrlToUint8Array(str) {
    const result = [];
    const state = { queue: 0, queuedBits: 0 };
    const onByte = (byte) => {
      result.push(byte);
    };
    for (let i = 0; i < str.length; i += 1) {
      byteFromBase64URL(str.charCodeAt(i), state, onByte);
    }
    return new Uint8Array(result);
  }
  function stringToUint8Array(str) {
    const result = [];
    stringToUTF8(str, (byte) => result.push(byte));
    return new Uint8Array(result);
  }
  function bytesToBase64URL(bytes) {
    const result = [];
    const state = { queue: 0, queuedBits: 0 };
    const onChar = (char) => {
      result.push(char);
    };
    bytes.forEach((byte) => byteToBase64URL(byte, state, onChar));
    byteToBase64URL(null, state, onChar);
    return result.join("");
  }

  // node_modules/@supabase/auth-js/dist/module/lib/helpers.js
  function expiresAt(expiresIn) {
    const timeNow = Math.round(Date.now() / 1e3);
    return timeNow + expiresIn;
  }
  function generateCallbackId() {
    return /* @__PURE__ */ Symbol("auth-callback");
  }
  var isBrowser = () => typeof window !== "undefined" && typeof document !== "undefined";
  var localStorageWriteTests = {
    tested: false,
    writable: false
  };
  var supportsLocalStorage = () => {
    if (!isBrowser()) {
      return false;
    }
    try {
      if (typeof globalThis.localStorage !== "object") {
        return false;
      }
    } catch (e) {
      return false;
    }
    if (localStorageWriteTests.tested) {
      return localStorageWriteTests.writable;
    }
    const randomKey = `lswt-${Math.random()}${Math.random()}`;
    try {
      globalThis.localStorage.setItem(randomKey, randomKey);
      globalThis.localStorage.removeItem(randomKey);
      localStorageWriteTests.tested = true;
      localStorageWriteTests.writable = true;
    } catch (e) {
      localStorageWriteTests.tested = true;
      localStorageWriteTests.writable = false;
    }
    return localStorageWriteTests.writable;
  };
  function parseParametersFromURL(href) {
    const result = {};
    const url = new URL(href);
    if (url.hash && url.hash[0] === "#") {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.substring(1));
        hashSearchParams.forEach((value, key) => {
          result[key] = value;
        });
      } catch (_e) {
      }
    }
    url.searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
  var resolveFetch3 = (customFetch) => {
    if (customFetch) {
      return (...args) => customFetch(...args);
    }
    return (...args) => fetch(...args);
  };
  var looksLikeFetchResponse = (maybeResponse) => {
    return typeof maybeResponse === "object" && maybeResponse !== null && "status" in maybeResponse && "ok" in maybeResponse && "json" in maybeResponse && typeof maybeResponse.json === "function";
  };
  var setItemAsync = async (storage, key, data) => {
    await storage.setItem(key, JSON.stringify(data));
  };
  var getItemAsync = async (storage, key) => {
    const value = await storage.getItem(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (_a) {
      return null;
    }
  };
  var removeItemAsync = async (storage, key) => {
    await storage.removeItem(key);
  };
  var Deferred = class _Deferred {
    constructor() {
      ;
      this.promise = new _Deferred.promiseConstructor((res, rej) => {
        ;
        this.resolve = res;
        this.reject = rej;
      });
    }
  };
  Deferred.promiseConstructor = Promise;
  function decodeJWT(token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new AuthInvalidJwtError("Invalid JWT structure");
    }
    for (let i = 0; i < parts.length; i++) {
      if (!BASE64URL_REGEX.test(parts[i])) {
        throw new AuthInvalidJwtError("JWT not in base64url format");
      }
    }
    const data = {
      // using base64url lib
      header: JSON.parse(stringFromBase64URL(parts[0])),
      payload: JSON.parse(stringFromBase64URL(parts[1])),
      signature: base64UrlToUint8Array(parts[2]),
      raw: {
        header: parts[0],
        payload: parts[1]
      }
    };
    return data;
  }
  async function sleep2(time) {
    return await new Promise((accept) => {
      setTimeout(() => accept(null), time);
    });
  }
  function retryable(fn, isRetryable) {
    const promise = new Promise((accept, reject) => {
      ;
      (async () => {
        for (let attempt = 0; attempt < Infinity; attempt++) {
          try {
            const result = await fn(attempt);
            if (!isRetryable(attempt, null, result)) {
              accept(result);
              return;
            }
          } catch (e) {
            if (!isRetryable(attempt, e)) {
              reject(e);
              return;
            }
          }
        }
      })();
    });
    return promise;
  }
  function dec2hex(dec) {
    return ("0" + dec.toString(16)).substr(-2);
  }
  function generatePKCEVerifier() {
    const verifierLength = 56;
    const array = new Uint32Array(verifierLength);
    if (typeof crypto === "undefined") {
      const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      const charSetLen = charSet.length;
      let verifier = "";
      for (let i = 0; i < verifierLength; i++) {
        verifier += charSet.charAt(Math.floor(Math.random() * charSetLen));
      }
      return verifier;
    }
    crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join("");
  }
  async function sha256(randomString) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(randomString);
    const hash = await crypto.subtle.digest("SHA-256", encodedData);
    const bytes = new Uint8Array(hash);
    return Array.from(bytes).map((c) => String.fromCharCode(c)).join("");
  }
  async function generatePKCEChallenge(verifier) {
    const hasCryptoSupport = typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined" && typeof TextEncoder !== "undefined";
    if (!hasCryptoSupport) {
      console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.");
      return verifier;
    }
    const hashed = await sha256(verifier);
    return btoa(hashed).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  var PKCE_FLOW_ID_PATTERN = /^[a-zA-Z0-9_-]{8,64}$/;
  function validatePKCEFlowId(flowId) {
    return typeof flowId === "string" && PKCE_FLOW_ID_PATTERN.test(flowId) ? flowId : null;
  }
  function generatePKCEFlowId() {
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      return Array.from(bytes, dec2hex).join("");
    }
    let flowId = "";
    for (let i = 0; i < 32; i++) {
      flowId += Math.floor(Math.random() * 16).toString(16);
    }
    return flowId;
  }
  var pkceVerifierSlotKey = (storageKey, flowId) => `${storageKey}-flow-${flowId}-code-verifier`;
  var pkceFlowIndexKey = (storageKey) => `${storageKey}-flows-code-verifier`;
  async function getPKCEFlowIndex(storage, storageKey) {
    const index = await getItemAsync(storage, pkceFlowIndexKey(storageKey));
    return Array.isArray(index) ? index.filter((id) => validatePKCEFlowId(id) !== null) : [];
  }
  async function storePKCEVerifier(storage, storageKey, flowId, verifier, onEvictFlow) {
    await setItemAsync(storage, pkceVerifierSlotKey(storageKey, flowId), verifier);
    const index = (await getPKCEFlowIndex(storage, storageKey)).filter((id) => id !== flowId);
    index.push(flowId);
    while (index.length > PKCE_MAX_CONCURRENT_FLOWS) {
      const evicted = index.shift();
      await removeItemAsync(storage, pkceVerifierSlotKey(storageKey, evicted));
      onEvictFlow === null || onEvictFlow === void 0 ? void 0 : onEvictFlow(evicted);
    }
    await setItemAsync(storage, pkceFlowIndexKey(storageKey), index);
    await setItemAsync(storage, `${storageKey}-code-verifier`, verifier);
  }
  async function retrievePKCEVerifier(storage, storageKey, flowId) {
    if (flowId) {
      const verifier2 = await getItemAsync(storage, pkceVerifierSlotKey(storageKey, flowId));
      return { verifier: typeof verifier2 === "string" ? verifier2 : null, flowId };
    }
    const verifier = await getItemAsync(storage, `${storageKey}-code-verifier`);
    return { verifier: typeof verifier === "string" ? verifier : null, flowId: null };
  }
  async function removePKCEVerifier(storage, storageKey, flowId) {
    const legacyKey = `${storageKey}-code-verifier`;
    if (!flowId) {
      await removeItemAsync(storage, legacyKey);
      return;
    }
    const slotKey = pkceVerifierSlotKey(storageKey, flowId);
    const slotValue = await getItemAsync(storage, slotKey);
    await removeItemAsync(storage, slotKey);
    const index = await getPKCEFlowIndex(storage, storageKey);
    const remaining = index.filter((id) => id !== flowId);
    if (remaining.length !== index.length) {
      if (remaining.length > 0) {
        await setItemAsync(storage, pkceFlowIndexKey(storageKey), remaining);
      } else {
        await removeItemAsync(storage, pkceFlowIndexKey(storageKey));
      }
    }
    if (slotValue != null && slotValue === await getItemAsync(storage, legacyKey)) {
      await removeItemAsync(storage, legacyKey);
    }
  }
  async function removeAllPKCEVerifiers(storage, storageKey) {
    const index = await getPKCEFlowIndex(storage, storageKey);
    for (const flowId of index) {
      await removeItemAsync(storage, pkceVerifierSlotKey(storageKey, flowId));
    }
    await removeItemAsync(storage, pkceFlowIndexKey(storageKey));
    await removeItemAsync(storage, `${storageKey}-code-verifier`);
  }
  function appendFlowIdToRedirectTo(redirectTo, flowId) {
    const hashIndex = redirectTo.indexOf("#");
    let base = hashIndex === -1 ? redirectTo : redirectTo.slice(0, hashIndex);
    const fragment = hashIndex === -1 ? "" : redirectTo.slice(hashIndex);
    const queryIndex = base.indexOf("?");
    if (queryIndex !== -1) {
      const path = base.slice(0, queryIndex);
      const remaining = base.slice(queryIndex + 1).split("&").filter((pair) => pair !== "" && pair !== PKCE_FLOW_ID_PARAM && !pair.startsWith(`${PKCE_FLOW_ID_PARAM}=`));
      base = remaining.length > 0 ? `${path}?${remaining.join("&")}` : path;
    }
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}${PKCE_FLOW_ID_PARAM}=${encodeURIComponent(flowId)}${fragment}`;
  }
  async function getCodeChallengeAndMethod(storage, storageKey, isPasswordRecovery = false, onEvictFlow) {
    const codeVerifier = generatePKCEVerifier();
    let storedCodeVerifier = codeVerifier;
    if (isPasswordRecovery) {
      storedCodeVerifier += "/recovery";
    }
    const flowId = generatePKCEFlowId();
    await storePKCEVerifier(storage, storageKey, flowId, storedCodeVerifier, onEvictFlow);
    const codeChallenge = await generatePKCEChallenge(codeVerifier);
    const codeChallengeMethod = codeVerifier === codeChallenge ? "plain" : "s256";
    return [codeChallenge, codeChallengeMethod, flowId];
  }
  var API_VERSION_REGEX = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
  function parseResponseAPIVersion(response) {
    const apiVersion = response.headers.get(API_VERSION_HEADER_NAME);
    if (!apiVersion) {
      return null;
    }
    if (!apiVersion.match(API_VERSION_REGEX)) {
      return null;
    }
    try {
      const date = /* @__PURE__ */ new Date(`${apiVersion}T00:00:00.0Z`);
      return date;
    } catch (_e) {
      return null;
    }
  }
  function validateExp(exp) {
    if (!exp) {
      throw new Error("Missing exp claim");
    }
    const timeNow = Math.floor(Date.now() / 1e3);
    if (exp <= timeNow) {
      throw new Error("JWT has expired");
    }
  }
  function getAlgorithm(alg) {
    switch (alg) {
      case "RS256":
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" }
        };
      case "ES256":
        return {
          name: "ECDSA",
          namedCurve: "P-256",
          hash: { name: "SHA-256" }
        };
      default:
        throw new Error("Invalid alg claim");
    }
  }
  var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  function validateUUID(str) {
    if (!UUID_REGEX.test(str)) {
      throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
    }
  }
  function assertRecoveryCodesExperimentalEnabled(experimental) {
    if (!experimental.recoveryCodes) {
      throw new Error("@supabase/auth-js: the MFA recovery codes API is experimental and disabled by default. Enable it by passing `auth: { experimental: { recoveryCodes: true } }` to createClient (or to the GoTrueClient constructor).");
    }
  }
  function userNotAvailableProxy() {
    const proxyTarget = {};
    return new Proxy(proxyTarget, {
      get: (target, prop) => {
        if (prop === "__isUserNotAvailableProxy") {
          return true;
        }
        if (typeof prop === "symbol") {
          const sProp = prop.toString();
          if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)") {
            return void 0;
          }
        }
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${prop}" property of the session object is not supported. Please use getUser() instead.`);
      },
      set: (_target, prop) => {
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
      },
      deleteProperty: (_target, prop) => {
        throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${prop}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
      }
    });
  }
  function insecureUserWarningProxy(user, suppressWarningRef) {
    return new Proxy(user, {
      get: (target, prop, receiver) => {
        if (prop === "__isInsecureUserWarningProxy") {
          return true;
        }
        if (typeof prop === "symbol") {
          const sProp = prop.toString();
          if (sProp === "Symbol(Symbol.toPrimitive)" || sProp === "Symbol(Symbol.toStringTag)" || sProp === "Symbol(util.inspect.custom)" || sProp === "Symbol(nodejs.util.inspect.custom)") {
            return Reflect.get(target, prop, receiver);
          }
        }
        if (!suppressWarningRef.value && typeof prop === "string") {
          console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.");
          suppressWarningRef.value = true;
        }
        return Reflect.get(target, prop, receiver);
      }
    });
  }
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // node_modules/@supabase/auth-js/dist/module/lib/fetch.js
  var _getErrorMessage2 = (err) => {
    if (typeof err === "object" && err !== null) {
      const e = err;
      if (typeof e.msg === "string")
        return e.msg;
      if (typeof e.message === "string")
        return e.message;
      if (typeof e.error_description === "string")
        return e.error_description;
      if (typeof e.error === "string")
        return e.error;
    }
    return JSON.stringify(err);
  };
  var NETWORK_ERROR_CODES = [
    500,
    501,
    502,
    503,
    504,
    520,
    521,
    522,
    523,
    524,
    525,
    526,
    527,
    528,
    529,
    530
  ];
  async function handleError2(error) {
    var _a;
    if (!looksLikeFetchResponse(error)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(error), 0);
    }
    let data;
    try {
      data = await error.json();
    } catch (e) {
      if (NETWORK_ERROR_CODES.includes(error.status)) {
        throw new AuthRetryableFetchError(error.statusText || `HTTP ${error.status}`, error.status);
      }
      throw new AuthUnknownError(_getErrorMessage2(e), e);
    }
    if (NETWORK_ERROR_CODES.includes(error.status)) {
      throw new AuthRetryableFetchError(_getErrorMessage2(data), error.status);
    }
    let errorCode = void 0;
    const responseAPIVersion = parseResponseAPIVersion(error);
    if (responseAPIVersion && responseAPIVersion.getTime() >= API_VERSIONS["2024-01-01"].timestamp && typeof data === "object" && data && typeof data.code === "string") {
      errorCode = data.code;
    } else if (typeof data === "object" && data && typeof data.error_code === "string") {
      errorCode = data.error_code;
    }
    if (!errorCode) {
      if (typeof data === "object" && data && typeof data.weak_password === "object" && data.weak_password && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
        throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, data.weak_password.reasons);
      }
    } else if (errorCode === "weak_password") {
      throw new AuthWeakPasswordError(_getErrorMessage2(data), error.status, ((_a = data.weak_password) === null || _a === void 0 ? void 0 : _a.reasons) || []);
    } else if (errorCode === "session_not_found") {
      throw new AuthSessionMissingError();
    }
    throw new AuthApiError(_getErrorMessage2(data), error.status || 500, errorCode);
  }
  var _getRequestParams2 = (method, options2, parameters, body) => {
    const params = { method, headers: (options2 === null || options2 === void 0 ? void 0 : options2.headers) || {} };
    if (method === "GET") {
      return params;
    }
    params.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, options2 === null || options2 === void 0 ? void 0 : options2.headers);
    params.body = JSON.stringify(body);
    return Object.assign(Object.assign({}, params), parameters);
  };
  async function _request(fetcher, method, url, options2) {
    var _a;
    const headers = Object.assign({}, options2 === null || options2 === void 0 ? void 0 : options2.headers);
    if (!headers[API_VERSION_HEADER_NAME]) {
      headers[API_VERSION_HEADER_NAME] = API_VERSIONS["2024-01-01"].name;
    }
    if (options2 === null || options2 === void 0 ? void 0 : options2.jwt) {
      headers["Authorization"] = `Bearer ${options2.jwt}`;
    }
    const qs = (_a = options2 === null || options2 === void 0 ? void 0 : options2.query) !== null && _a !== void 0 ? _a : {};
    if (options2 === null || options2 === void 0 ? void 0 : options2.redirectTo) {
      qs["redirect_to"] = options2.redirectTo;
    }
    const queryString = Object.keys(qs).length ? "?" + new URLSearchParams(qs).toString() : "";
    const data = await _handleRequest2(fetcher, method, url + queryString, {
      headers,
      noResolveJson: options2 === null || options2 === void 0 ? void 0 : options2.noResolveJson
    }, {}, options2 === null || options2 === void 0 ? void 0 : options2.body);
    return (options2 === null || options2 === void 0 ? void 0 : options2.xform) ? options2 === null || options2 === void 0 ? void 0 : options2.xform(data) : { data: Object.assign({}, data), error: null };
  }
  async function _handleRequest2(fetcher, method, url, options2, parameters, body) {
    const requestParams = _getRequestParams2(method, options2, parameters, body);
    let result;
    try {
      result = await fetcher(url, Object.assign({}, requestParams));
    } catch (e) {
      throw new AuthRetryableFetchError(_getErrorMessage2(e), 0);
    }
    if (!result.ok) {
      await handleError2(result);
    }
    if (options2 === null || options2 === void 0 ? void 0 : options2.noResolveJson) {
      return result;
    }
    try {
      return await result.json();
    } catch (e) {
      await handleError2(e);
    }
  }
  function _sessionResponse(data) {
    var _a;
    let session = null;
    if (hasSession(data)) {
      session = Object.assign({}, data);
      if (!data.expires_at) {
        session.expires_at = expiresAt(data.expires_in);
      }
    }
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : typeof (data === null || data === void 0 ? void 0 : data.id) === "string" ? data : null;
    return { data: { session, user }, error: null };
  }
  function _sessionResponsePassword(data) {
    const response = _sessionResponse(data);
    if (!response.error && data.weak_password && typeof data.weak_password === "object" && Array.isArray(data.weak_password.reasons) && data.weak_password.reasons.length && data.weak_password.message && typeof data.weak_password.message === "string" && data.weak_password.reasons.reduce((a, i) => a && typeof i === "string", true)) {
      response.data.weak_password = data.weak_password;
    }
    return response;
  }
  function _userResponse(data) {
    var _a;
    const user = (_a = data.user) !== null && _a !== void 0 ? _a : data;
    return { data: { user }, error: null };
  }
  function _ssoResponse(data) {
    return { data, error: null };
  }
  function _generateLinkResponse(data) {
    const { action_link, email_otp, hashed_token, redirect_to, verification_type } = data, rest = __rest(data, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]);
    const properties = {
      action_link,
      email_otp,
      hashed_token,
      redirect_to,
      verification_type
    };
    const user = Object.assign({}, rest);
    return {
      data: {
        properties,
        user
      },
      error: null
    };
  }
  function _noResolveJsonResponse(data) {
    return data;
  }
  function hasSession(data) {
    return !!data.access_token && !!data.refresh_token && !!data.expires_in;
  }

  // node_modules/@supabase/auth-js/dist/module/lib/types.js
  var SIGN_OUT_SCOPES = ["global", "local", "others"];

  // node_modules/@supabase/auth-js/dist/module/GoTrueAdminApi.js
  var GoTrueAdminApi = class {
    /**
     * Creates an admin API client that can be used to manage users and OAuth clients.
     *
     * @example Using supabase-js (recommended)
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'your-secret-key')
     * const { data, error } = await supabase.auth.admin.listUsers()
     * ```
     *
     * @example Standalone import for bundle-sensitive environments
     * ```ts
     * import { GoTrueAdminApi } from '@supabase/auth-js'
     *
     * const admin = new GoTrueAdminApi({
     *   url: 'https://xyzcompany.supabase.co/auth/v1',
     *   headers: { Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}` },
     * })
     * ```
     */
    constructor({ url = "", headers = {}, fetch: fetch2, experimental }) {
      this.url = url;
      this.headers = headers;
      this.fetch = resolveFetch3(fetch2);
      this.experimental = experimental !== null && experimental !== void 0 ? experimental : {};
      this.mfa = {
        listFactors: this._listFactors.bind(this),
        deleteFactor: this._deleteFactor.bind(this)
      };
      this.oauth = {
        listClients: this._listOAuthClients.bind(this),
        createClient: this._createOAuthClient.bind(this),
        getClient: this._getOAuthClient.bind(this),
        updateClient: this._updateOAuthClient.bind(this),
        deleteClient: this._deleteOAuthClient.bind(this),
        regenerateClientSecret: this._regenerateOAuthClientSecret.bind(this)
      };
      this.customProviders = {
        listProviders: this._listCustomProviders.bind(this),
        createProvider: this._createCustomProvider.bind(this),
        getProvider: this._getCustomProvider.bind(this),
        updateProvider: this._updateCustomProvider.bind(this),
        deleteProvider: this._deleteCustomProvider.bind(this)
      };
      this.passkey = {
        listPasskeys: this._adminListPasskeys.bind(this),
        deletePasskey: this._adminDeletePasskey.bind(this)
      };
    }
    /**
     * Removes a logged-in session.
     * @param jwt A valid, logged-in JWT.
     * @param scope The logout sope.
     *
     * @category Auth
     * @subcategory Auth Admin
     */
    async signOut(jwt, scope2 = SIGN_OUT_SCOPES[0]) {
      if (SIGN_OUT_SCOPES.indexOf(scope2) < 0) {
        throw new Error(`@supabase/auth-js: Parameter scope must be one of ${SIGN_OUT_SCOPES.join(", ")}`);
      }
      try {
        await _request(this.fetch, "POST", `${this.url}/logout?scope=${scope2}`, {
          headers: this.headers,
          jwt,
          noResolveJson: true
        });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Sends an invite link to an email address.
     * @param email The email address of the user.
     * @param options Additional options to be included when inviting.
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @remarks
     * - Sends an invite link to the user's email address.
     * - The `inviteUserByEmail()` method is typically used by administrators to invite users to join the application.
     * - Note that PKCE is not supported when using `inviteUserByEmail`. This is because the browser initiating the invite is often different from the browser accepting the invite which makes it difficult to provide the security guarantees required of the PKCE flow.
     *
     * @example Invite a user
     * ```js
     * const { data, error } = await supabase.auth.admin.inviteUserByEmail('email@example.com')
     * ```
     *
     * @exampleResponse Invite a user
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "invited_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmation_sent_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {},
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     }
     *   },
     *   "error": null
     * }
     * ```
     */
    async inviteUserByEmail(email, options2 = {}) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/invite`, {
          body: { email, data: options2.data },
          headers: this.headers,
          redirectTo: options2.redirectTo,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Generates email links and OTPs to be sent via a custom email provider.
     * @param params The parameters for generating the link, including the link `type`, the user's `email`, and type-specific options such as `password`, `data`, and `redirectTo`.
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @remarks
     * - The following types can be passed into `generateLink()`: `signup`, `magiclink`, `invite`, `recovery`, `email_change_current`, `email_change_new`, `phone_change`.
     * - `generateLink()` only generates the email link for `email_change_email` if the **Secure email change** is enabled in your project's [email auth provider settings](/dashboard/project/_/auth/providers).
     * - `generateLink()` handles the creation of the user for `signup`, `invite` and `magiclink`.
     *
     * @example Generate a signup link
     * ```js
     * const { data, error } = await supabase.auth.admin.generateLink({
     *   type: 'signup',
     *   email: 'email@example.com',
     *   password: 'secret'
     * })
     * ```
     *
     * @exampleResponse Generate a signup link
     * ```json
     * {
     *   "data": {
     *     "properties": {
     *       "action_link": "<LINK_TO_SEND_TO_USER>",
     *       "email_otp": "999999",
     *       "hashed_token": "<HASHED_TOKEN",
     *       "redirect_to": "<REDIRECT_URL>",
     *       "verification_type": "signup"
     *     },
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "email@example.com",
     *       "phone": "",
     *       "confirmation_sent_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {},
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "email@example.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "email@example.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Generate an invite link
     * ```js
     * const { data, error } = await supabase.auth.admin.generateLink({
     *   type: 'invite',
     *   email: 'email@example.com'
     * })
     * ```
     *
     * @example Generate a magic link
     * ```js
     * const { data, error } = await supabase.auth.admin.generateLink({
     *   type: 'magiclink',
     *   email: 'email@example.com'
     * })
     * ```
     *
     * @example Generate a recovery link
     * ```js
     * const { data, error } = await supabase.auth.admin.generateLink({
     *   type: 'recovery',
     *   email: 'email@example.com'
     * })
     * ```
     *
     * @example Generate links to change current email address
     * ```js
     * // generate an email change link to be sent to the current email address
     * const { data, error } = await supabase.auth.admin.generateLink({
     *   type: 'email_change_current',
     *   email: 'current.email@example.com',
     *   newEmail: 'new.email@example.com'
     * })
     *
     * // generate an email change link to be sent to the new email address
     * const { data, error } = await supabase.auth.admin.generateLink({
     *   type: 'email_change_new',
     *   email: 'current.email@example.com',
     *   newEmail: 'new.email@example.com'
     * })
     * ```
     */
    async generateLink(params) {
      try {
        const { options: options2 } = params, rest = __rest(params, ["options"]);
        const body = Object.assign(Object.assign({}, rest), options2);
        if ("newEmail" in rest) {
          body.new_email = rest === null || rest === void 0 ? void 0 : rest.newEmail;
          delete body["newEmail"];
        }
        return await _request(this.fetch, "POST", `${this.url}/admin/generate_link`, {
          body,
          headers: this.headers,
          xform: _generateLinkResponse,
          redirectTo: options2 === null || options2 === void 0 ? void 0 : options2.redirectTo
        });
      } catch (error) {
        if (isAuthError(error)) {
          return {
            data: {
              properties: null,
              user: null
            },
            error
          };
        }
        throw error;
      }
    }
    // User Admin API
    /**
     * Creates a new user.
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @remarks
     * - To confirm the user's email address or phone number, set `email_confirm` or `phone_confirm` to true. Both arguments default to false.
     * - `createUser()` will not send a confirmation email to the user. You can use [`inviteUserByEmail()`](/docs/reference/javascript/auth-admin-inviteuserbyemail) if you want to send them an email invite instead.
     * - If you are sure that the created user's email or phone number is legitimate and verified, you can set the `email_confirm` or `phone_confirm` param to `true`.
     *
     * @example With custom user metadata
     * ```js
     * const { data, error } = await supabase.auth.admin.createUser({
     *   email: 'user@email.com',
     *   password: 'password',
     *   user_metadata: { name: 'Yoda' }
     * })
     * ```
     *
     * @exampleResponse With custom user metadata
     * ```json
     * {
     *   data: {
     *     user: {
     *       id: '1',
     *       aud: 'authenticated',
     *       role: 'authenticated',
     *       email: 'example@email.com',
     *       email_confirmed_at: '2024-01-01T00:00:00Z',
     *       phone: '',
     *       confirmation_sent_at: '2024-01-01T00:00:00Z',
     *       confirmed_at: '2024-01-01T00:00:00Z',
     *       last_sign_in_at: '2024-01-01T00:00:00Z',
     *       app_metadata: {},
     *       user_metadata: {},
     *       identities: [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "1",
     *           "user_id": "1",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": true,
     *             "phone_verified": false,
     *             "sub": "1"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "email@example.com"
     *         },
     *       ],
     *       created_at: '2024-01-01T00:00:00Z',
     *       updated_at: '2024-01-01T00:00:00Z',
     *       is_anonymous: false,
     *     }
     *   }
     *   error: null
     * }
     * ```
     *
     * @example Auto-confirm the user's email
     * ```js
     * const { data, error } = await supabase.auth.admin.createUser({
     *   email: 'user@email.com',
     *   email_confirm: true
     * })
     * ```
     *
     * @example Auto-confirm the user's phone number
     * ```js
     * const { data, error } = await supabase.auth.admin.createUser({
     *   phone: '1234567890',
     *   phone_confirm: true
     * })
     * ```
     */
    async createUser(attributes) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/users`, {
          body: attributes,
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Get a list of users.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @remarks
     * - Defaults to return 50 users per page.
     *
     * @example Get a page of users
     * ```js
     * const { data: { users }, error } = await supabase.auth.admin.listUsers()
     * ```
     *
     * @example Paginated list of users
     * ```js
     * const { data: { users }, error } = await supabase.auth.admin.listUsers({
     *   page: 1,
     *   perPage: 1000
     * })
     * ```
     */
    async listUsers(params) {
      var _a, _b, _c, _d, _e, _f, _g;
      try {
        const pagination = { nextPage: null, lastPage: 0, total: 0 };
        const response = await _request(this.fetch, "GET", `${this.url}/admin/users`, {
          headers: this.headers,
          noResolveJson: true,
          query: {
            page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
            per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
          },
          xform: _noResolveJsonResponse
        });
        if (response.error)
          throw response.error;
        const users = await response.json();
        const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
        const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
        if (links.length > 0) {
          links.forEach((link) => {
            const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
            const rel = JSON.parse(link.split(";")[1].split("=")[1]);
            pagination[`${rel}Page`] = page;
          });
          pagination.total = parseInt(total);
        }
        return { data: Object.assign(Object.assign({}, users), pagination), error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { users: [] }, error };
        }
        throw error;
      }
    }
    /**
     * Get user by id.
     *
     * @param uid The user's unique identifier
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @remarks
     * - Fetches the user object from the database based on the user's id.
     * - The `getUserById()` method requires the user's id which maps to the `auth.users.id` column.
     *
     * @example Fetch the user object using the access_token jwt
     * ```js
     * const { data, error } = await supabase.auth.admin.getUserById(1)
     * ```
     *
     * @exampleResponse Fetch the user object using the access_token jwt
     * ```json
     * {
     *   data: {
     *     user: {
     *       id: '1',
     *       aud: 'authenticated',
     *       role: 'authenticated',
     *       email: 'example@email.com',
     *       email_confirmed_at: '2024-01-01T00:00:00Z',
     *       phone: '',
     *       confirmation_sent_at: '2024-01-01T00:00:00Z',
     *       confirmed_at: '2024-01-01T00:00:00Z',
     *       last_sign_in_at: '2024-01-01T00:00:00Z',
     *       app_metadata: {},
     *       user_metadata: {},
     *       identities: [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "1",
     *           "user_id": "1",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": true,
     *             "phone_verified": false,
     *             "sub": "1"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "email@example.com"
     *         },
     *       ],
     *       created_at: '2024-01-01T00:00:00Z',
     *       updated_at: '2024-01-01T00:00:00Z',
     *       is_anonymous: false,
     *     }
     *   }
     *   error: null
     * }
     * ```
     */
    async getUserById(uid2) {
      validateUUID(uid2);
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/users/${uid2}`, {
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Updates the user data. Changes are applied directly without confirmation flows.
     *
     * @param uid The user's unique identifier
     * @param attributes The data you want to update.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     *
     * @remarks
     * **Important:** This is a server-side operation and does **not** trigger client-side
     * `onAuthStateChange` listeners. The admin API has no connection to client state.
     *
     * To sync changes to the client after calling this method:
     * 1. On the client, call `supabase.auth.refreshSession()` to fetch the updated user data
     * 2. This will trigger the `TOKEN_REFRESHED` event and notify all listeners
     *
     * @example
     * ```typescript
     * // Server-side (Edge Function)
     * const { data, error } = await supabase.auth.admin.updateUserById(
     *   userId,
     *   { user_metadata: { preferences: { theme: 'dark' } } }
     * )
     *
     * // Client-side (to sync the changes)
     * const { data, error } = await supabase.auth.refreshSession()
     * // onAuthStateChange listeners will now be notified with updated user
     * ```
     *
     * @see {@link GoTrueClient.refreshSession} for syncing admin changes to the client
     * @see {@link GoTrueClient.updateUser} for client-side user updates (triggers listeners automatically)
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @example Updates a user's email
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '11111111-1111-1111-1111-111111111111',
     *   { email: 'new@email.com' }
     * )
     * ```
     *
     * @exampleResponse Updates a user's email
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "new@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmed_at": "2024-01-01T00:00:00Z",
     *       "recovery_sent_at": "2024-01-01T00:00:00Z",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {
     *         "email": "example@email.com",
     *         "email_verified": false,
     *         "phone_verified": false,
     *         "sub": "11111111-1111-1111-1111-111111111111"
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Updates a user's password
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
     *   { password: 'new_password' }
     * )
     * ```
     *
     * @example Updates a user's metadata
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
     *   { user_metadata: { hello: 'world' } }
     * )
     * ```
     *
     * @example Updates a user's app_metadata
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
     *   { app_metadata: { plan: 'trial' } }
     * )
     * ```
     *
     * @example Confirms a user's email address
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
     *   { email_confirm: true }
     * )
     * ```
     *
     * @example Confirms a user's phone number
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
     *   { phone_confirm: true }
     * )
     * ```
     *
     * @example Ban a user for 100 years
     * ```js
     * const { data: user, error } = await supabase.auth.admin.updateUserById(
     *   '6aa5d0d4-2a9f-4483-b6c8-0cf4c6c98ac4',
     *   { ban_duration: '876000h' }
     * )
     * ```
     */
    async updateUserById(uid2, attributes) {
      validateUUID(uid2);
      try {
        return await _request(this.fetch, "PUT", `${this.url}/admin/users/${uid2}`, {
          body: attributes,
          headers: this.headers,
          xform: _userResponse
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    /**
     * Delete a user. Requires a `service_role` key.
     * Returns the user that was deleted. In cases of concurrent updates, the user object returned
     * might not accurately reflect the user information at the time of deletion.
     *
     * @param id The user id you want to remove.
     * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
     * Defaults to false for backward compatibility.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     *
     * @category Auth
     * @subcategory Auth Admin
     *
     * @remarks
     * - The `deleteUser()` method requires the user's ID, which maps to the `auth.users.id` column.
     *
     * @example Removes a user
     * ```js
     * const { data, error } = await supabase.auth.admin.deleteUser(
     *   '715ed5db-f090-4b8c-a067-640ecee36aa0'
     * )
     * ```
     *
     * @exampleResponse Removes a user
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "715ed5db-f090-4b8c-a067-640ecee36aa0",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z"
     *     }
     *   },
     *   "error": null
     * }
     * ```
     */
    async deleteUser(id, shouldSoftDelete = false) {
      validateUUID(id);
      try {
        const { data, error } = await this.getUserById(id);
        if (error) {
          return { data: { user: null }, error };
        }
        await _request(this.fetch, "DELETE", `${this.url}/admin/users/${id}`, {
          headers: this.headers,
          body: {
            should_soft_delete: shouldSoftDelete
          },
          noResolveJson: true
        });
        return { data, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { user: null }, error };
        }
        throw error;
      }
    }
    async _listFactors(params) {
      validateUUID(params.userId);
      try {
        const { data, error } = await _request(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/factors`, {
          headers: this.headers,
          xform: (factors) => {
            return { data: { factors }, error: null };
          }
        });
        return { data, error };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    async _deleteFactor(params) {
      validateUUID(params.userId);
      validateUUID(params.id);
      try {
        const data = await _request(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/factors/${params.id}`, {
          headers: this.headers
        });
        return { data, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Lists all OAuth clients with optional pagination.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _listOAuthClients(params) {
      var _a, _b, _c, _d, _e, _f, _g;
      try {
        const pagination = { nextPage: null, lastPage: 0, total: 0 };
        const response = await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients`, {
          headers: this.headers,
          noResolveJson: true,
          query: {
            page: (_b = (_a = params === null || params === void 0 ? void 0 : params.page) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : "",
            per_page: (_d = (_c = params === null || params === void 0 ? void 0 : params.perPage) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : ""
          },
          xform: _noResolveJsonResponse
        });
        if (response.error)
          throw response.error;
        const clients = await response.json();
        const total = (_e = response.headers.get("x-total-count")) !== null && _e !== void 0 ? _e : 0;
        const links = (_g = (_f = response.headers.get("link")) === null || _f === void 0 ? void 0 : _f.split(",")) !== null && _g !== void 0 ? _g : [];
        if (links.length > 0) {
          links.forEach((link) => {
            const page = parseInt(link.split(";")[0].split("=")[1].substring(0, 1));
            const rel = JSON.parse(link.split(";")[1].split("=")[1]);
            pagination[`${rel}Page`] = page;
          });
          pagination.total = parseInt(total);
        }
        return { data: Object.assign(Object.assign({}, clients), pagination), error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { clients: [] }, error };
        }
        throw error;
      }
    }
    /**
     * Creates a new OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _createOAuthClient(params) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients`, {
          body: params,
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Gets details of a specific OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _getOAuthClient(clientId) {
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/oauth/clients/${clientId}`, {
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Updates an existing OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _updateOAuthClient(clientId, params) {
      try {
        return await _request(this.fetch, "PUT", `${this.url}/admin/oauth/clients/${clientId}`, {
          body: params,
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Deletes an OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _deleteOAuthClient(clientId) {
      try {
        await _request(this.fetch, "DELETE", `${this.url}/admin/oauth/clients/${clientId}`, {
          headers: this.headers,
          noResolveJson: true
        });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Regenerates the secret for an OAuth client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _regenerateOAuthClientSecret(clientId) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/oauth/clients/${clientId}/regenerate_secret`, {
          headers: this.headers,
          xform: (client) => {
            return { data: client, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Lists all custom providers with optional type filter.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _listCustomProviders(params) {
      try {
        const query = {};
        if (params === null || params === void 0 ? void 0 : params.type) {
          query.type = params.type;
        }
        return await _request(this.fetch, "GET", `${this.url}/admin/custom-providers`, {
          headers: this.headers,
          query,
          xform: (data) => {
            var _a;
            return { data: { providers: (_a = data === null || data === void 0 ? void 0 : data.providers) !== null && _a !== void 0 ? _a : [] }, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: { providers: [] }, error };
        }
        throw error;
      }
    }
    /**
     * Creates a new custom OIDC/OAuth provider.
     *
     * For OIDC providers, the server fetches and validates the OpenID Connect discovery document
     * from the issuer's well-known endpoint (or the provided `discovery_url`) at creation time.
     * This may return a validation error (`error_code: "validation_failed"`) if the discovery
     * document is unreachable, not valid JSON, missing required fields, or if the issuer
     * in the document does not match the expected issuer.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _createCustomProvider(params) {
      try {
        return await _request(this.fetch, "POST", `${this.url}/admin/custom-providers`, {
          body: params,
          headers: this.headers,
          xform: (provider) => {
            return { data: provider, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Gets details of a specific custom provider by identifier.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _getCustomProvider(identifier) {
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/custom-providers/${identifier}`, {
          headers: this.headers,
          xform: (provider) => {
            return { data: provider, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Updates an existing custom provider.
     *
     * When `issuer` or `discovery_url` is changed on an OIDC provider, the server re-fetches and
     * validates the discovery document before persisting. This may return a validation error
     * (`error_code: "validation_failed"`) if the discovery document is unreachable, invalid, or
     * the issuer does not match.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _updateCustomProvider(identifier, params) {
      try {
        return await _request(this.fetch, "PUT", `${this.url}/admin/custom-providers/${identifier}`, {
          body: params,
          headers: this.headers,
          xform: (provider) => {
            return { data: provider, error: null };
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Deletes a custom provider.
     *
     * This function should only be called on a server. Never expose your `service_role` key in the browser.
     */
    async _deleteCustomProvider(identifier) {
      try {
        await _request(this.fetch, "DELETE", `${this.url}/admin/custom-providers/${identifier}`, {
          headers: this.headers,
          noResolveJson: true
        });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Lists all passkeys for a user.
     *
     * This function should only be called on a server. Never expose your secret key in the browser.
     */
    async _adminListPasskeys(params) {
      validateUUID(params.userId);
      try {
        return await _request(this.fetch, "GET", `${this.url}/admin/users/${params.userId}/passkeys`, { headers: this.headers, xform: (data) => ({ data, error: null }) });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
    /**
     * Deletes a user's passkey.
     *
     * This function should only be called on a server. Never expose your secret key in the browser.
     */
    async _adminDeletePasskey(params) {
      validateUUID(params.userId);
      validateUUID(params.passkeyId);
      try {
        await _request(this.fetch, "DELETE", `${this.url}/admin/users/${params.userId}/passkeys/${params.passkeyId}`, { headers: this.headers, noResolveJson: true });
        return { data: null, error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        throw error;
      }
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/local-storage.js
  function memoryLocalStorageAdapter(store = {}) {
    return {
      getItem: (key) => {
        return store[key] || null;
      },
      setItem: (key, value) => {
        store[key] = value;
      },
      removeItem: (key) => {
        delete store[key];
      }
    };
  }

  // node_modules/@supabase/auth-js/dist/module/lib/locks.js
  var internals = {
    /**
     * @experimental
     */
    debug: !!(globalThis && supportsLocalStorage() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
  };
  var LockAcquireTimeoutError = class extends Error {
    constructor(message) {
      super(message);
      this.isAcquireTimeout = true;
    }
  };

  // node_modules/@supabase/auth-js/dist/module/lib/polyfills.js
  function polyfillGlobalThis() {
    if (typeof globalThis === "object")
      return;
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: true
      });
      __magic__.globalThis = __magic__;
      delete Object.prototype.__magic__;
    } catch (e) {
      if (typeof self !== "undefined") {
        self.globalThis = self;
      }
    }
  }

  // node_modules/@supabase/auth-js/dist/module/lib/web3/ethereum.js
  function getAddress(address) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`@supabase/auth-js: Address "${address}" is invalid.`);
    }
    return address.toLowerCase();
  }
  function fromHex(hex) {
    return parseInt(hex, 16);
  }
  function toHex(value) {
    const bytes = new TextEncoder().encode(value);
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return "0x" + hex;
  }
  function createSiweMessage(parameters) {
    var _a;
    const { chainId, domain, expirationTime, issuedAt = /* @__PURE__ */ new Date(), nonce, notBefore, requestId, resources, scheme, uri, version: version5 } = parameters;
    {
      if (!Number.isInteger(chainId))
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${chainId}`);
      if (!domain)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.`);
      if (nonce && nonce.length < 8)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${nonce}`);
      if (!uri)
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.`);
      if (version5 !== "1")
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${version5}`);
      if ((_a = parameters.statement) === null || _a === void 0 ? void 0 : _a.includes("\n"))
        throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${parameters.statement}`);
    }
    const address = getAddress(parameters.address);
    const origin = scheme ? `${scheme}://${domain}` : domain;
    const statement = parameters.statement ? `${parameters.statement}
` : "";
    const prefix = `${origin} wants you to sign in with your Ethereum account:
${address}

${statement}`;
    let suffix = `URI: ${uri}
Version: ${version5}
Chain ID: ${chainId}${nonce ? `
Nonce: ${nonce}` : ""}
Issued At: ${issuedAt.toISOString()}`;
    if (expirationTime)
      suffix += `
Expiration Time: ${expirationTime.toISOString()}`;
    if (notBefore)
      suffix += `
Not Before: ${notBefore.toISOString()}`;
    if (requestId)
      suffix += `
Request ID: ${requestId}`;
    if (resources) {
      let content = "\nResources:";
      for (const resource of resources) {
        if (!resource || typeof resource !== "string")
          throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${resource}`);
        content += `
- ${resource}`;
      }
      suffix += content;
    }
    return `${prefix}
${suffix}`;
  }

  // node_modules/@supabase/auth-js/dist/module/lib/webauthn.errors.js
  var WebAuthnError = class extends Error {
    constructor({ message, code, cause, name }) {
      var _a;
      super(message, { cause });
      this.__isWebAuthnError = true;
      this.name = (_a = name !== null && name !== void 0 ? name : cause instanceof Error ? cause.name : void 0) !== null && _a !== void 0 ? _a : "Unknown Error";
      this.code = code;
    }
    toJSON() {
      return {
        name: this.name,
        message: this.message,
        code: this.code
      };
    }
  };
  var WebAuthnUnknownError = class extends WebAuthnError {
    constructor(message, originalError) {
      super({
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: originalError,
        message
      });
      this.name = "WebAuthnUnknownError";
      this.originalError = originalError;
    }
  };
  function identifyRegistrationError({ error, options: options2 }) {
    var _a, _b, _c;
    const { publicKey } = options2;
    if (!publicKey) {
      throw Error("options was missing required publicKey property");
    }
    if (error.name === "AbortError") {
      if (options2.signal instanceof AbortSignal) {
        return new WebAuthnError({
          message: "Registration ceremony was sent an abort signal",
          code: "ERROR_CEREMONY_ABORTED",
          cause: error
        });
      }
    } else if (error.name === "ConstraintError") {
      if (((_a = publicKey.authenticatorSelection) === null || _a === void 0 ? void 0 : _a.requireResidentKey) === true) {
        return new WebAuthnError({
          message: "Discoverable credentials were required but no available authenticator supported it",
          code: "ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",
          cause: error
        });
      } else if (
        // @ts-ignore: `mediation` doesn't yet exist on CredentialCreationOptions but it's possible as of Sept 2024
        options2.mediation === "conditional" && ((_b = publicKey.authenticatorSelection) === null || _b === void 0 ? void 0 : _b.userVerification) === "required"
      ) {
        return new WebAuthnError({
          message: "User verification was required during automatic registration but it could not be performed",
          code: "ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",
          cause: error
        });
      } else if (((_c = publicKey.authenticatorSelection) === null || _c === void 0 ? void 0 : _c.userVerification) === "required") {
        return new WebAuthnError({
          message: "User verification was required but no available authenticator supported it",
          code: "ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",
          cause: error
        });
      }
    } else if (error.name === "InvalidStateError") {
      return new WebAuthnError({
        message: "The authenticator was previously registered",
        code: "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",
        cause: error
      });
    } else if (error.name === "NotAllowedError") {
      return new WebAuthnError({
        message: error.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    } else if (error.name === "NotSupportedError") {
      const validPubKeyCredParams = publicKey.pubKeyCredParams.filter((param) => param.type === "public-key");
      if (validPubKeyCredParams.length === 0) {
        return new WebAuthnError({
          message: 'No entry in pubKeyCredParams was of type "public-key"',
          code: "ERROR_MALFORMED_PUBKEYCREDPARAMS",
          cause: error
        });
      }
      return new WebAuthnError({
        message: "No available authenticator supported any of the specified pubKeyCredParams algorithms",
        code: "ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",
        cause: error
      });
    } else if (error.name === "SecurityError") {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: error
        });
      } else if (publicKey.rp.id !== effectiveDomain) {
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rp.id}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: error
        });
      }
    } else if (error.name === "TypeError") {
      if (publicKey.user.id.byteLength < 1 || publicKey.user.id.byteLength > 64) {
        return new WebAuthnError({
          message: "User ID was not between 1 and 64 characters",
          code: "ERROR_INVALID_USER_ID_LENGTH",
          cause: error
        });
      }
    } else if (error.name === "UnknownError") {
      return new WebAuthnError({
        message: "The authenticator was unable to process the specified options, or could not create a new credential",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "a Non-Webauthn related error has occurred",
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  }
  function identifyAuthenticationError({ error, options: options2 }) {
    const { publicKey } = options2;
    if (!publicKey) {
      throw Error("options was missing required publicKey property");
    }
    if (error.name === "AbortError") {
      if (options2.signal instanceof AbortSignal) {
        return new WebAuthnError({
          message: "Authentication ceremony was sent an abort signal",
          code: "ERROR_CEREMONY_ABORTED",
          cause: error
        });
      }
    } else if (error.name === "NotAllowedError") {
      return new WebAuthnError({
        message: error.message,
        code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
        cause: error
      });
    } else if (error.name === "SecurityError") {
      const effectiveDomain = window.location.hostname;
      if (!isValidDomain(effectiveDomain)) {
        return new WebAuthnError({
          message: `${window.location.hostname} is an invalid domain`,
          code: "ERROR_INVALID_DOMAIN",
          cause: error
        });
      } else if (publicKey.rpId !== effectiveDomain) {
        return new WebAuthnError({
          message: `The RP ID "${publicKey.rpId}" is invalid for this domain`,
          code: "ERROR_INVALID_RP_ID",
          cause: error
        });
      }
    } else if (error.name === "UnknownError") {
      return new WebAuthnError({
        message: "The authenticator was unable to process the specified options, or could not create a new assertion signature",
        code: "ERROR_AUTHENTICATOR_GENERAL_ERROR",
        cause: error
      });
    }
    return new WebAuthnError({
      message: "a Non-Webauthn related error has occurred",
      code: "ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",
      cause: error
    });
  }

  // node_modules/@supabase/auth-js/dist/module/lib/webauthn.js
  var WebAuthnAbortService = class {
    /**
     * Create an abort signal for a new WebAuthn operation.
     * Automatically cancels any existing operation.
     *
     * @returns {AbortSignal} Signal to pass to navigator.credentials.create() or .get()
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal MDN - AbortSignal}
     */
    createNewAbortSignal() {
      if (this.controller) {
        const abortError = new Error("Cancelling existing WebAuthn API call for new one");
        abortError.name = "AbortError";
        this.controller.abort(abortError);
      }
      const newController = new AbortController();
      this.controller = newController;
      return newController.signal;
    }
    /**
     * Manually cancel the current WebAuthn operation.
     * Useful for cleaning up when user cancels or navigates away.
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort MDN - AbortController.abort}
     */
    cancelCeremony() {
      if (this.controller) {
        const abortError = new Error("Manually cancelling existing WebAuthn API call");
        abortError.name = "AbortError";
        this.controller.abort(abortError);
        this.controller = void 0;
      }
    }
  };
  var webAuthnAbortService = new WebAuthnAbortService();
  function deserializeCredentialCreationOptions(options2) {
    if (!options2) {
      throw new Error("Credential creation options are required");
    }
    if (typeof PublicKeyCredential !== "undefined" && "parseCreationOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseCreationOptionsFromJSON === "function") {
      return PublicKeyCredential.parseCreationOptionsFromJSON(
        /** we assert the options here as typescript still doesn't know about future webauthn types */
        options2
      );
    }
    const { challenge: challengeStr, user: userOpts, excludeCredentials } = options2, restOptions = __rest(
      options2,
      ["challenge", "user", "excludeCredentials"]
    );
    const challenge = base64UrlToUint8Array(challengeStr).buffer;
    const user = Object.assign(Object.assign({}, userOpts), { id: base64UrlToUint8Array(userOpts.id).buffer });
    const result = Object.assign(Object.assign({}, restOptions), {
      challenge,
      user
    });
    if (excludeCredentials && excludeCredentials.length > 0) {
      result.excludeCredentials = new Array(excludeCredentials.length);
      for (let i = 0; i < excludeCredentials.length; i++) {
        const cred = excludeCredentials[i];
        result.excludeCredentials[i] = Object.assign(Object.assign({}, cred), {
          id: base64UrlToUint8Array(cred.id).buffer,
          type: cred.type || "public-key",
          // Cast transports to handle future transport types like "cable"
          transports: cred.transports
        });
      }
    }
    return result;
  }
  function deserializeCredentialRequestOptions(options2) {
    if (!options2) {
      throw new Error("Credential request options are required");
    }
    if (typeof PublicKeyCredential !== "undefined" && "parseRequestOptionsFromJSON" in PublicKeyCredential && typeof PublicKeyCredential.parseRequestOptionsFromJSON === "function") {
      return PublicKeyCredential.parseRequestOptionsFromJSON(options2);
    }
    const { challenge: challengeStr, allowCredentials } = options2, restOptions = __rest(
      options2,
      ["challenge", "allowCredentials"]
    );
    const challenge = base64UrlToUint8Array(challengeStr).buffer;
    const result = Object.assign(Object.assign({}, restOptions), { challenge });
    if (allowCredentials && allowCredentials.length > 0) {
      result.allowCredentials = new Array(allowCredentials.length);
      for (let i = 0; i < allowCredentials.length; i++) {
        const cred = allowCredentials[i];
        result.allowCredentials[i] = Object.assign(Object.assign({}, cred), {
          id: base64UrlToUint8Array(cred.id).buffer,
          type: cred.type || "public-key",
          // Cast transports to handle future transport types like "cable"
          transports: cred.transports
        });
      }
    }
    return result;
  }
  function serializeCredentialCreationResponse(credential) {
    var _a;
    if ("toJSON" in credential && typeof credential.toJSON === "function") {
      return credential.toJSON();
    }
    const credentialWithAttachment = credential;
    return {
      id: credential.id,
      rawId: credential.id,
      response: {
        attestationObject: bytesToBase64URL(new Uint8Array(credential.response.attestationObject)),
        clientDataJSON: bytesToBase64URL(new Uint8Array(credential.response.clientDataJSON))
      },
      type: "public-key",
      clientExtensionResults: credential.getClientExtensionResults(),
      // Convert null to undefined and cast to AuthenticatorAttachment type
      authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
    };
  }
  function serializeCredentialRequestResponse(credential) {
    var _a;
    if ("toJSON" in credential && typeof credential.toJSON === "function") {
      return credential.toJSON();
    }
    const credentialWithAttachment = credential;
    const clientExtensionResults = credential.getClientExtensionResults();
    const assertionResponse = credential.response;
    return {
      id: credential.id,
      rawId: credential.id,
      // W3C spec expects rawId to match id for JSON format
      response: {
        authenticatorData: bytesToBase64URL(new Uint8Array(assertionResponse.authenticatorData)),
        clientDataJSON: bytesToBase64URL(new Uint8Array(assertionResponse.clientDataJSON)),
        signature: bytesToBase64URL(new Uint8Array(assertionResponse.signature)),
        userHandle: assertionResponse.userHandle ? bytesToBase64URL(new Uint8Array(assertionResponse.userHandle)) : void 0
      },
      type: "public-key",
      clientExtensionResults,
      // Convert null to undefined and cast to AuthenticatorAttachment type
      authenticatorAttachment: (_a = credentialWithAttachment.authenticatorAttachment) !== null && _a !== void 0 ? _a : void 0
    };
  }
  function isValidDomain(hostname) {
    return (
      // Consider localhost valid as well since it's okay wrt Secure Contexts
      hostname === "localhost" || /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(hostname)
    );
  }
  function browserSupportsWebAuthn() {
    var _a, _b;
    return !!(isBrowser() && "PublicKeyCredential" in window && window.PublicKeyCredential && "credentials" in navigator && typeof ((_a = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _a === void 0 ? void 0 : _a.create) === "function" && typeof ((_b = navigator === null || navigator === void 0 ? void 0 : navigator.credentials) === null || _b === void 0 ? void 0 : _b.get) === "function");
  }
  async function createCredential(options2) {
    try {
      const response = await navigator.credentials.create(
        /** we assert the type here until typescript types are updated */
        options2
      );
      if (!response) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Empty credential response", response)
        };
      }
      if (!(response instanceof PublicKeyCredential)) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
        };
      }
      return { data: response, error: null };
    } catch (err) {
      return {
        data: null,
        error: identifyRegistrationError({
          error: err,
          options: options2
        })
      };
    }
  }
  async function getCredential(options2) {
    try {
      const response = await navigator.credentials.get(
        /** we assert the type here until typescript types are updated */
        options2
      );
      if (!response) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Empty credential response", response)
        };
      }
      if (!(response instanceof PublicKeyCredential)) {
        return {
          data: null,
          error: new WebAuthnUnknownError("Browser returned unexpected credential type", response)
        };
      }
      return { data: response, error: null };
    } catch (err) {
      return {
        data: null,
        error: identifyAuthenticationError({
          error: err,
          options: options2
        })
      };
    }
  }
  var DEFAULT_CREATION_OPTIONS = {
    hints: ["security-key"],
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform",
      requireResidentKey: false,
      /** set to preferred because older yubikeys don't have PIN/Biometric */
      userVerification: "preferred",
      residentKey: "discouraged"
    },
    attestation: "direct"
  };
  var DEFAULT_REQUEST_OPTIONS = {
    /** set to preferred because older yubikeys don't have PIN/Biometric */
    userVerification: "preferred",
    hints: ["security-key"],
    attestation: "direct"
  };
  function deepMerge(...sources) {
    const isObject = (val) => val !== null && typeof val === "object" && !Array.isArray(val);
    const isArrayBufferLike = (val) => val instanceof ArrayBuffer || ArrayBuffer.isView(val);
    const result = {};
    for (const source of sources) {
      if (!source)
        continue;
      for (const key in source) {
        const value = source[key];
        if (value === void 0)
          continue;
        if (Array.isArray(value)) {
          result[key] = value;
        } else if (isArrayBufferLike(value)) {
          result[key] = value;
        } else if (isObject(value)) {
          const existing = result[key];
          if (isObject(existing)) {
            result[key] = deepMerge(existing, value);
          } else {
            result[key] = deepMerge(value);
          }
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }
  function mergeCredentialCreationOptions(baseOptions, overrides) {
    return deepMerge(DEFAULT_CREATION_OPTIONS, baseOptions, overrides || {});
  }
  function mergeCredentialRequestOptions(baseOptions, overrides) {
    return deepMerge(DEFAULT_REQUEST_OPTIONS, baseOptions, overrides || {});
  }
  var WebAuthnApi = class {
    constructor(client) {
      this.client = client;
      this.enroll = this._enroll.bind(this);
      this.challenge = this._challenge.bind(this);
      this.verify = this._verify.bind(this);
      this.authenticate = this._authenticate.bind(this);
      this.register = this._register.bind(this);
    }
    /**
     * Enroll a new WebAuthn factor.
     * Creates an unverified WebAuthn factor that must be verified with a credential.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Omit<MFAEnrollWebauthnParams, 'factorType'>} params - Enrollment parameters (friendlyName required)
     * @returns {Promise<AuthMFAEnrollWebauthnResponse>} Enrolled factor details or error
     * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registering a New Credential}
     */
    async _enroll(params) {
      return this.client.mfa.enroll(Object.assign(Object.assign({}, params), { factorType: "webauthn" }));
    }
    /**
     * Challenge for WebAuthn credential creation or authentication.
     * Combines server challenge with browser credential operations.
     * Handles both registration (create) and authentication (request) flows.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {MFAChallengeWebauthnParams & { friendlyName?: string; signal?: AbortSignal }} params - Challenge parameters including factorId
     * @param {Object} overrides - Allows you to override the parameters passed to navigator.credentials
     * @param {PublicKeyCredentialCreationOptionsFuture} overrides.create - Override options for credential creation
     * @param {PublicKeyCredentialRequestOptionsFuture} overrides.request - Override options for credential request
     * @returns {Promise<RequestResult>} Challenge response with credential or error
     * @see {@link https://w3c.github.io/webauthn/#sctn-credential-creation W3C WebAuthn Spec - Credential Creation}
     * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying Assertion}
     */
    async _challenge({ factorId, webauthn, friendlyName, signal }, overrides) {
      var _a;
      try {
        const { data: challengeResponse, error: challengeError } = await this.client.mfa.challenge({
          factorId,
          webauthn
        });
        if (!challengeResponse) {
          return { data: null, error: challengeError };
        }
        const abortSignal = signal !== null && signal !== void 0 ? signal : webAuthnAbortService.createNewAbortSignal();
        if (challengeResponse.webauthn.type === "create") {
          const { user } = challengeResponse.webauthn.credential_options.publicKey;
          if (!user.name) {
            const nameToUse = friendlyName;
            if (!nameToUse) {
              const currentUser = await this.client.getUser();
              const userData = currentUser.data.user;
              const fallbackName = ((_a = userData === null || userData === void 0 ? void 0 : userData.user_metadata) === null || _a === void 0 ? void 0 : _a.name) || (userData === null || userData === void 0 ? void 0 : userData.email) || (userData === null || userData === void 0 ? void 0 : userData.id) || "User";
              user.name = `${user.id}:${fallbackName}`;
            } else {
              user.name = `${user.id}:${nameToUse}`;
            }
          }
          if (!user.displayName) {
            user.displayName = user.name;
          }
        }
        switch (challengeResponse.webauthn.type) {
          case "create": {
            const options2 = mergeCredentialCreationOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.create);
            const { data, error } = await createCredential({
              publicKey: options2,
              signal: abortSignal
            });
            if (data) {
              return {
                data: {
                  factorId,
                  challengeId: challengeResponse.id,
                  webauthn: {
                    type: challengeResponse.webauthn.type,
                    credential_response: data
                  }
                },
                error: null
              };
            }
            return { data: null, error };
          }
          case "request": {
            const options2 = mergeCredentialRequestOptions(challengeResponse.webauthn.credential_options.publicKey, overrides === null || overrides === void 0 ? void 0 : overrides.request);
            const { data, error } = await getCredential(Object.assign(Object.assign({}, challengeResponse.webauthn.credential_options), { publicKey: options2, signal: abortSignal }));
            if (data) {
              return {
                data: {
                  factorId,
                  challengeId: challengeResponse.id,
                  webauthn: {
                    type: challengeResponse.webauthn.type,
                    credential_response: data
                  }
                },
                error: null
              };
            }
            return { data: null, error };
          }
        }
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        return {
          data: null,
          error: new AuthUnknownError("Unexpected error in challenge", error)
        };
      }
    }
    /**
     * Verify a WebAuthn credential with the server.
     * Completes the WebAuthn ceremony by sending the credential to the server for verification.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Object} params - Verification parameters
     * @param {string} params.challengeId - ID of the challenge being verified
     * @param {string} params.factorId - ID of the WebAuthn factor
     * @param {MFAVerifyWebauthnParams<T>['webauthn']} params.webauthn - WebAuthn credential response
     * @returns {Promise<AuthMFAVerifyResponse>} Verification result with session or error
     * @see {@link https://w3c.github.io/webauthn/#sctn-verifying-assertion W3C WebAuthn Spec - Verifying an Authentication Assertion}
     * */
    async _verify({ challengeId, factorId, webauthn }) {
      return this.client.mfa.verify({
        factorId,
        challengeId,
        webauthn
      });
    }
    /**
     * Complete WebAuthn authentication flow.
     * Performs challenge and verification in a single operation for existing credentials.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Object} params - Authentication parameters
     * @param {string} params.factorId - ID of the WebAuthn factor to authenticate with
     * @param {Object} params.webauthn - WebAuthn configuration
     * @param {string} params.webauthn.rpId - Relying Party ID (defaults to current hostname)
     * @param {string[]} params.webauthn.rpOrigins - Allowed origins (defaults to current origin)
     * @param {AbortSignal} params.webauthn.signal - Optional abort signal
     * @param {PublicKeyCredentialRequestOptionsFuture} overrides - Override options for navigator.credentials.get
     * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Authentication result
     * @see {@link https://w3c.github.io/webauthn/#sctn-authentication W3C WebAuthn Spec - Authentication Ceremony}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialRequestOptions MDN - PublicKeyCredentialRequestOptions}
     */
    async _authenticate({ factorId, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
      if (!rpId) {
        return {
          data: null,
          error: new AuthError("rpId is required for WebAuthn authentication")
        };
      }
      try {
        if (!browserSupportsWebAuthn()) {
          return {
            data: null,
            error: new AuthUnknownError("Browser does not support WebAuthn", null)
          };
        }
        const { data: challengeResponse, error: challengeError } = await this.challenge({
          factorId,
          webauthn: { rpId, rpOrigins },
          signal
        }, { request: overrides });
        if (!challengeResponse) {
          return { data: null, error: challengeError };
        }
        const { webauthn } = challengeResponse;
        return this._verify({
          factorId,
          challengeId: challengeResponse.challengeId,
          webauthn: {
            type: webauthn.type,
            rpId,
            rpOrigins,
            credential_response: webauthn.credential_response
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        return {
          data: null,
          error: new AuthUnknownError("Unexpected error in authenticate", error)
        };
      }
    }
    /**
     * Complete WebAuthn registration flow.
     * Performs enrollment, challenge, and verification in a single operation for new credentials.
     *
     * @experimental This method is experimental and may change in future releases
     * @param {Object} params - Registration parameters
     * @param {string} params.friendlyName - User-friendly name for the credential
     * @param {string} params.rpId - Relying Party ID (defaults to current hostname)
     * @param {string[]} params.rpOrigins - Allowed origins (defaults to current origin)
     * @param {AbortSignal} params.signal - Optional abort signal
     * @param {PublicKeyCredentialCreationOptionsFuture} overrides - Override options for navigator.credentials.create
     * @returns {Promise<RequestResult<AuthMFAVerifyResponseData, WebAuthnError | AuthError>>} Registration result
     * @see {@link https://w3c.github.io/webauthn/#sctn-registering-a-new-credential W3C WebAuthn Spec - Registration Ceremony}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/PublicKeyCredentialCreationOptions MDN - PublicKeyCredentialCreationOptions}
     */
    async _register({ friendlyName, webauthn: { rpId = typeof window !== "undefined" ? window.location.hostname : void 0, rpOrigins = typeof window !== "undefined" ? [window.location.origin] : void 0, signal } = {} }, overrides) {
      if (!rpId) {
        return {
          data: null,
          error: new AuthError("rpId is required for WebAuthn registration")
        };
      }
      try {
        if (!browserSupportsWebAuthn()) {
          return {
            data: null,
            error: new AuthUnknownError("Browser does not support WebAuthn", null)
          };
        }
        const { data: factor, error: enrollError } = await this._enroll({
          friendlyName
        });
        if (!factor) {
          await this.client.mfa.listFactors().then((factors) => {
            var _a;
            return (_a = factors.data) === null || _a === void 0 ? void 0 : _a.all.find((v) => v.factor_type === "webauthn" && v.friendly_name === friendlyName && v.status === "unverified");
          }).then((factor2) => factor2 ? this.client.mfa.unenroll({ factorId: factor2 === null || factor2 === void 0 ? void 0 : factor2.id }) : void 0);
          return { data: null, error: enrollError };
        }
        const { data: challengeResponse, error: challengeError } = await this._challenge({
          factorId: factor.id,
          friendlyName: factor.friendly_name,
          webauthn: { rpId, rpOrigins },
          signal
        }, {
          create: overrides
        });
        if (!challengeResponse) {
          return { data: null, error: challengeError };
        }
        return this._verify({
          factorId: factor.id,
          challengeId: challengeResponse.challengeId,
          webauthn: {
            rpId,
            rpOrigins,
            type: challengeResponse.webauthn.type,
            credential_response: challengeResponse.webauthn.credential_response
          }
        });
      } catch (error) {
        if (isAuthError(error)) {
          return { data: null, error };
        }
        return {
          data: null,
          error: new AuthUnknownError("Unexpected error in register", error)
        };
      }
    }
  };

  // node_modules/@supabase/auth-js/dist/module/GoTrueClient.js
  polyfillGlobalThis();
  var DEFAULT_OPTIONS = {
    url: GOTRUE_URL,
    storageKey: STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    headers: DEFAULT_HEADERS2,
    flowType: "implicit",
    debug: false,
    hasCustomAuthorizationHeader: false,
    throwOnError: false,
    lockAcquireTimeout: 5e3,
    // 5 seconds. Only used when a custom `lock` is supplied. TODO(v3): remove.
    skipAutoInitialize: false,
    experimental: {}
  };
  var GLOBAL_JWKS = {};
  var deprecatedLockWarned = false;
  var GoTrueClient = class _GoTrueClient {
    /**
     * The JWKS used for verifying asymmetric JWTs
     */
    get jwks() {
      var _a, _b;
      return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.jwks) !== null && _b !== void 0 ? _b : { keys: [] };
    }
    set jwks(value) {
      GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { jwks: value });
    }
    get jwks_cached_at() {
      var _a, _b;
      return (_b = (_a = GLOBAL_JWKS[this.storageKey]) === null || _a === void 0 ? void 0 : _a.cachedAt) !== null && _b !== void 0 ? _b : Number.MIN_SAFE_INTEGER;
    }
    set jwks_cached_at(value) {
      GLOBAL_JWKS[this.storageKey] = Object.assign(Object.assign({}, GLOBAL_JWKS[this.storageKey]), { cachedAt: value });
    }
    /**
     * Create a new client for use in the browser.
     *
     * @example Using supabase-js (recommended)
     * ```ts
     * import { createClient } from '@supabase/supabase-js'
     *
     * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
     * const { data, error } = await supabase.auth.getUser()
     * ```
     *
     * @example Standalone import for bundle-sensitive environments
     * ```ts
     * import { GoTrueClient } from '@supabase/auth-js'
     *
     * const auth = new GoTrueClient({
     *   url: 'https://xyzcompany.supabase.co/auth/v1',
     *   headers: { apikey: 'your-publishable-key' },
     *   storageKey: 'supabase-auth',
     * })
     * ```
     */
    constructor(options2) {
      var _a, _b, _c;
      this.userStorage = null;
      this.memoryStorage = null;
      this.stateChangeEmitters = /* @__PURE__ */ new Map();
      this.autoRefreshTicker = null;
      this.autoRefreshTickTimeout = null;
      this.visibilityChangedCallback = null;
      this.refreshingDeferred = null;
      this.lastRefreshFailure = null;
      this._sessionRemovalEpoch = 0;
      this.initializePromise = null;
      this._pendingInitNotifications = null;
      this.detectSessionInUrl = true;
      this.hasCustomAuthorizationHeader = false;
      this.suppressGetSessionWarning = false;
      this.lock = null;
      this.lockAcquired = false;
      this.pendingInLock = [];
      this.broadcastChannel = null;
      this.logger = console.log;
      const settings = Object.assign(Object.assign({}, DEFAULT_OPTIONS), options2);
      this.storageKey = settings.storageKey;
      this.instanceID = (_a = _GoTrueClient.nextInstanceID[this.storageKey]) !== null && _a !== void 0 ? _a : 0;
      _GoTrueClient.nextInstanceID[this.storageKey] = this.instanceID + 1;
      this.logDebugMessages = !!settings.debug;
      if (typeof settings.debug === "function") {
        this.logger = settings.debug;
      }
      if (this.instanceID > 0 && isBrowser()) {
        const message = `${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;
        console.warn(message);
        if (this.logDebugMessages) {
          console.trace(message);
        }
      }
      this.persistSession = settings.persistSession;
      this.autoRefreshToken = settings.autoRefreshToken;
      this.experimental = (_b = settings.experimental) !== null && _b !== void 0 ? _b : {};
      this.admin = new GoTrueAdminApi({
        url: settings.url,
        headers: settings.headers,
        fetch: settings.fetch,
        experimental: this.experimental
      });
      this.url = settings.url;
      this.headers = settings.headers;
      this.fetch = resolveFetch3(settings.fetch);
      this.detectSessionInUrl = settings.detectSessionInUrl;
      this.flowType = settings.flowType;
      this.hasCustomAuthorizationHeader = settings.hasCustomAuthorizationHeader;
      this.throwOnError = settings.throwOnError;
      this.lockAcquireTimeout = settings.lockAcquireTimeout;
      if (settings.lock != null) {
        this.lock = settings.lock;
        if (!deprecatedLockWarned) {
          deprecatedLockWarned = true;
          console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`);
        }
      }
      if (!this.jwks) {
        this.jwks = { keys: [] };
        this.jwks_cached_at = Number.MIN_SAFE_INTEGER;
      }
      this.mfa = {
        verify: this._verify.bind(this),
        enroll: this._enroll.bind(this),
        unenroll: this._unenroll.bind(this),
        challenge: this._challenge.bind(this),
        listFactors: this._listFactors.bind(this),
        challengeAndVerify: this._challengeAndVerify.bind(this),
        getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this),
        webauthn: new WebAuthnApi(this),
        recoveryCodes: {
          getStatus: this._getRecoveryCodesStatus.bind(this),
          generate: this._generateRecoveryCodes.bind(this),
          verify: this._verifyRecoveryCode.bind(this),
          regenerate: this._regenerateRecoveryCodes.bind(this),
          unenroll: this._unenrollRecoveryCodes.bind(this)
        }
      };
      this.oauth = {
        getAuthorizationDetails: this._getAuthorizationDetails.bind(this),
        approveAuthorization: this._approveAuthorization.bind(this),
        denyAuthorization: this._denyAuthorization.bind(this),
        listGrants: this._listOAuthGrants.bind(this),
        revokeGrant: this._revokeOAuthGrant.bind(this)
      };
      this.passkey = {
        startRegistration: this._startPasskeyRegistration.bind(this),
        verifyRegistration: this._verifyPasskeyRegistration.bind(this),
        startAuthentication: this._startPasskeyAuthentication.bind(this),
        verifyAuthentication: this._verifyPasskeyAuthentication.bind(this),
        list: this._listPasskeys.bind(this),
        update: this._updatePasskey.bind(this),
        delete: this._deletePasskey.bind(this)
      };
      if (this.persistSession) {
        if (settings.storage) {
          this.storage = settings.storage;
        } else {
          if (supportsLocalStorage()) {
            this.storage = globalThis.localStorage;
          } else {
            this.memoryStorage = {};
            this.storage = memoryLocalStorageAdapter(this.memoryStorage);
          }
        }
        if (settings.userStorage) {
          this.userStorage = settings.userStorage;
        }
      } else {
        this.memoryStorage = {};
        this.storage = memoryLocalStorageAdapter(this.memoryStorage);
      }
      if (isBrowser() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
        try {
          this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
        } catch (e) {
          console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", e);
        }
        (_c = this.broadcastChannel) === null || _c === void 0 ? void 0 : _c.addEventListener("message", async (event) => {
          this._debug("received broadcast notification from other tab or client", event);
          if (event.data.event === "TOKEN_REFRESHED" || event.data.event === "SIGNED_IN") {
            this.lastRefreshFailure = null;
          }
          try {
            await this._notifyAllSubscribers(event.data.event, event.data.session, false);
          } catch (error) {
            this._debug("#broadcastChannel", "error", error);
          }
        });
      }
      if (!settings.skipAutoInitialize) {
        this.initialize().catch((error) => {
          this._debug("#initialize()", "error", error);
        });
      }
    }
    /**
     * Returns whether error throwing mode is enabled for this client.
     */
    isThrowOnErrorEnabled() {
      return this.throwOnError;
    }
    /**
     * Centralizes return handling with optional error throwing. When `throwOnError` is enabled
     * and the provided result contains a non-nullish error, the error is thrown instead of
     * being returned. This ensures consistent behavior across all public API methods.
     */
    _returnResult(result) {
      if (this.throwOnError && result && result.error) {
        throw result.error;
      }
      return result;
    }
    _logPrefix() {
      return `GoTrueClient@${this.storageKey}:${this.instanceID} (${version3}) ${(/* @__PURE__ */ new Date()).toISOString()}`;
    }
    _debug(...args) {
      if (this.logDebugMessages) {
        this.logger(this._logPrefix(), ...args);
      }
      return this;
    }
    /**
     * Initialize the auth client by loading the session from storage or
     * detecting it from the URL after an OAuth, magic-link, or password-recovery
     * redirect.
     *
     * **Most callers do not need to invoke this directly.** The client calls it
     * automatically during construction, and to react to sign-in events (including
     * post-redirect events) you should subscribe to `onAuthStateChange` rather
     * than awaiting `initialize()`.
     *
     * You only need to call it manually when you have opted out of the automatic
     * call by passing `skipAutoInitialize: true` — for example, in an SSR context
     * where you need to control initialization timing. In that case, awaiting
     * `initialize()` returns the resolved session result (or any error encountered
     * while detecting it from the URL).
     *
     * @category Auth
     */
    async initialize() {
      var _a;
      if (this.initializePromise) {
        return await this.initializePromise;
      }
      this._pendingInitNotifications = [];
      this.initializePromise = (async () => {
        if (this.lock != null) {
          return await this._acquireLock(this.lockAcquireTimeout, async () => {
            return await this._initialize();
          });
        }
        return await this._initialize();
      })();
      const result = await this.initializePromise;
      const queue = (_a = this._pendingInitNotifications) !== null && _a !== void 0 ? _a : [];
      this._pendingInitNotifications = null;
      for (const n of queue) {
        await this._notifyAllSubscribers(n.event, n.session, n.broadcast);
      }
      return result;
    }
    /**
     * IMPORTANT:
     * 1. Never throw in this method, as it is called from the constructor
     * 2. Never return a session from this method as it would be cached over
     *    the whole lifetime of the client
     */
    async _initialize() {
      var _a;
      try {
        let params = {};
        let callbackUrlType = "none";
        if (isBrowser()) {
          params = parseParametersFromURL(window.location.href);
          if (this._isImplicitGrantCallback(params)) {
            callbackUrlType = "implicit";
          } else if (await this._isPKCECallback(params)) {
            callbackUrlType = "pkce";
          }
        }
        if (isBrowser() && this.detectSessionInUrl && callbackUrlType !== "none") {
          const { data, error } = await this._getSessionFromURL(params, callbackUrlType);
          if (error) {
            this._debug("#_initialize()", "error detecting session from URL", error);
            if (isAuthImplicitGrantRedirectError(error)) {
              const errorCode = (_a = error.details) === null || _a === void 0 ? void 0 : _a.code;
              if (errorCode === "identity_already_exists" || errorCode === "identity_not_found" || errorCode === "single_identity_not_deletable") {
                return { error };
              }
            }
            return { error };
          }
          const { session, redirectType } = data;
          this._debug("#_initialize()", "detected session in URL", session, "redirect type", redirectType);
          await this._saveSession(session);
          setTimeout(async () => {
            if (redirectType === "recovery") {
              await this._notifyAllSubscribers("PASSWORD_RECOVERY", session);
            } else {
              await this._notifyAllSubscribers("SIGNED_IN", session);
            }
          }, 0);
          return { error: null };
        }
        await this._recoverAndRefresh();
        return { error: null };
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ error });
        }
        return this._returnResult({
          error: new AuthUnknownError("Unexpected error during initialization", error)
        });
      } finally {
        await this._handleVisibilityChange();
        this._debug("#_initialize()", "end");
      }
    }
    /**
     * Creates a new anonymous user.
     *
     * @returns A session where the is_anonymous claim in the access token JWT set to true
     *
     * @category Auth
     *
     * @remarks
     * - Returns an anonymous user
     * - It is recommended to set up captcha for anonymous sign-ins to prevent abuse. You can pass in the captcha token in the `options` param.
     *
     * @example Create an anonymous user
     * ```js
     * const { data, error } = await supabase.auth.signInAnonymously({
     *   options: {
     *     captchaToken
     *   }
     * });
     * ```
     *
     * @exampleResponse Create an anonymous user
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "",
     *       "phone": "",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {},
     *       "user_metadata": {},
     *       "identities": [],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": true
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "",
     *         "phone": "",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {},
     *         "user_metadata": {},
     *         "identities": [],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *         "is_anonymous": true
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Create an anonymous user with custom user metadata
     * ```js
     * const { data, error } = await supabase.auth.signInAnonymously({
     *   options: {
     *     data
     *   }
     * })
     * ```
     */
    async signInAnonymously(credentials) {
      var _a, _b, _c;
      try {
        const res = await _request(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            data: (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : {},
            gotrue_meta_security: { captcha_token: (_c = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _c === void 0 ? void 0 : _c.captchaToken }
          },
          xform: _sessionResponse
        });
        const { data, error } = res;
        if (error || !data) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        const session = data.session;
        const user = data.user;
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return this._returnResult({ data: { user, session }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Creates a new user.
     *
     * Be aware that if a user account exists in the system you may get back an
     * error message that attempts to hide this information from the user.
     * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
     *
     * @returns A logged-in session if the server has "autoconfirm" ON
     * @returns A user if the server has "autoconfirm" OFF
     *
     * @category Auth
     *
     * @remarks
     * - By default, the user needs to verify their email address before logging in. To turn this off, disable **Confirm email** in [your project](/dashboard/project/_/auth/providers).
     * - **Confirm email** determines if users need to confirm their email address after signing up.
     *   - If **Confirm email** is enabled, a `user` is returned but `session` is null.
     *   - If **Confirm email** is disabled, both a `user` and a `session` are returned.
     * - When the user confirms their email address, they are redirected to the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) by default. You can modify your `SITE_URL` or add additional redirect URLs in [your project](/dashboard/project/_/auth/url-configuration).
     * - If signUp() is called for an existing confirmed user:
     *   - When both **Confirm email** and **Confirm phone** (even when phone provider is disabled) are enabled in [your project](/dashboard/project/_/auth/providers), an obfuscated/fake user object is returned.
     *   - When either **Confirm email** or **Confirm phone** (even when phone provider is disabled) is disabled, the error message, `User already registered` is returned.
     * - To fetch the currently logged-in user, refer to [`getUser()`](/docs/reference/javascript/auth-getuser).
     *
     * @example Sign up with an email and password
     * ```js
     * const { data, error } = await supabase.auth.signUp({
     *   email: 'example@email.com',
     *   password: 'example-password',
     * })
     * ```
     *
     * @exampleResponse Sign up with an email and password
     * ```json
     * // Some fields may be null if "confirm email" is enabled.
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {},
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z"
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "example@email.com",
     *         "email_confirmed_at": "2024-01-01T00:00:00Z",
     *         "phone": "",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {
     *           "provider": "email",
     *           "providers": [
     *             "email"
     *           ]
     *         },
     *         "user_metadata": {},
     *         "identities": [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z"
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Sign up with a phone number and password (SMS)
     * ```js
     * const { data, error } = await supabase.auth.signUp({
     *   phone: '123456789',
     *   password: 'example-password',
     *   options: {
     *     channel: 'sms'
     *   }
     * })
     * ```
     *
     * @exampleDescription Sign up with a phone number and password (whatsapp)
     * The user will be sent a WhatsApp message which contains a OTP. By default, a given user can only request a OTP once every 60 seconds. Note that a user will need to have a valid WhatsApp account that is linked to Twilio in order to use this feature.
     *
     * @example Sign up with a phone number and password (whatsapp)
     * ```js
     * const { data, error } = await supabase.auth.signUp({
     *   phone: '123456789',
     *   password: 'example-password',
     *   options: {
     *     channel: 'whatsapp'
     *   }
     * })
     * ```
     *
     * @example Sign up with additional user metadata
     * ```js
     * const { data, error } = await supabase.auth.signUp(
     *   {
     *     email: 'example@email.com',
     *     password: 'example-password',
     *     options: {
     *       data: {
     *         first_name: 'John',
     *         age: 27,
     *       }
     *     }
     *   }
     * )
     * ```
     *
     * @exampleDescription Sign up with a redirect URL
     * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
     *
     * @example Sign up with a redirect URL
     * ```js
     * const { data, error } = await supabase.auth.signUp(
     *   {
     *     email: 'example@email.com',
     *     password: 'example-password',
     *     options: {
     *       emailRedirectTo: 'https://example.com/welcome'
     *     }
     *   }
     * )
     * ```
     */
    async signUp(credentials) {
      var _a, _b, _c;
      let flowId = null;
      try {
        let res;
        if ("email" in credentials) {
          const { email, password, options: options2 } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
          }
          res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            redirectTo: this._maybeAppendFlowIdToRedirect(options2 === null || options2 === void 0 ? void 0 : options2.emailRedirectTo, flowId),
            body: {
              email,
              password,
              data: (_a = options2 === null || options2 === void 0 ? void 0 : options2.data) !== null && _a !== void 0 ? _a : {},
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            xform: _sessionResponse
          });
        } else if ("phone" in credentials) {
          const { phone, password, options: options2 } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/signup`, {
            headers: this.headers,
            body: {
              phone,
              password,
              data: (_b = options2 === null || options2 === void 0 ? void 0 : options2.data) !== null && _b !== void 0 ? _b : {},
              channel: (_c = options2 === null || options2 === void 0 ? void 0 : options2.channel) !== null && _c !== void 0 ? _c : "sms",
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken }
            },
            xform: _sessionResponse
          });
        } else {
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
        }
        const { data, error } = res;
        if (error || !data) {
          await removePKCEVerifier(this.storage, this.storageKey, flowId);
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        const session = data.session;
        const user = data.user;
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return this._returnResult({ data: { user, session }, error: null });
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in an existing user with an email and password or phone and password.
     *
     * Be aware that you may get back an error message that will not distinguish
     * between the cases where the account does not exist or that the
     * email/phone and password combination is wrong or that the account can only
     * be accessed via social sign-in.
     *
     * @category Auth
     *
     * @remarks
     * - Requires either an email and password or a phone number and password.
     *
     * @example Sign in with email and password
     * ```js
     * const { data, error } = await supabase.auth.signInWithPassword({
     *   email: 'example@email.com',
     *   password: 'example-password',
     * })
     * ```
     *
     * @exampleResponse Sign in with email and password
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {},
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z"
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "example@email.com",
     *         "email_confirmed_at": "2024-01-01T00:00:00Z",
     *         "phone": "",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {
     *           "provider": "email",
     *           "providers": [
     *             "email"
     *           ]
     *         },
     *         "user_metadata": {},
     *         "identities": [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z"
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Sign in with phone and password
     * ```js
     * const { data, error } = await supabase.auth.signInWithPassword({
     *   phone: '+13334445555',
     *   password: 'some-password',
     * })
     * ```
     *
     * @exampleDescription Handling errors
     * Log the full `error` object so fields like `code`, `status`, and `name` aren't hidden. The `error.code` (e.g. `'invalid_credentials'`, `'email_not_confirmed'`) is often more useful for branching than `error.message`, and the full object surfaces both.
     *
     * @example Handling errors
     * ```js
     * const { data, error } = await supabase.auth.signInWithPassword({
     *   email: 'example@email.com',
     *   password: 'example-password',
     * })
     * if (error) {
     *   console.error(error)
     *   return
     * }
     * ```
     */
    async signInWithPassword(credentials) {
      try {
        let res;
        if ("email" in credentials) {
          const { email, password, options: options2 } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
            headers: this.headers,
            body: {
              email,
              password,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken }
            },
            xform: _sessionResponsePassword
          });
        } else if ("phone" in credentials) {
          const { phone, password, options: options2 } = credentials;
          res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
            headers: this.headers,
            body: {
              phone,
              password,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken }
            },
            xform: _sessionResponsePassword
          });
        } else {
          throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a password");
        }
        const { data, error } = res;
        if (error) {
          return this._returnResult({ data: { user: null, session: null }, error });
        } else if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({
          data: Object.assign({ user: data.user, session: data.session }, data.weak_password ? { weakPassword: data.weak_password } : null),
          error
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in an existing user via a third-party provider.
     * This method supports the PKCE flow.
     *
     * @category Auth
     *
     * @remarks
     * - This method is used for signing in using [social sign-in (OAuth) providers](/docs/guides/auth/social-sign-in).
     * - It works by redirecting your application to the provider's authorization screen, before bringing back the user to your app.
     *
     * @example Sign in using a third-party provider
     * ```js
     * const { data, error } = await supabase.auth.signInWithOAuth({
     *   provider: 'github'
     * })
     * ```
     *
     * @exampleResponse Sign in using a third-party provider
     * ```json
     * {
     *   data: {
     *     provider: 'github',
     *     url: <PROVIDER_URL_TO_REDIRECT_TO>,
     *     flowId: <PKCE_FLOW_ID_OR_NULL>
     *   },
     *   error: null
     * }
     * ```
     *
     * @exampleDescription Sign in using a third-party provider with redirect
     * - When the OAuth provider successfully authenticates the user, they are redirected to the URL specified in the `redirectTo` parameter. This parameter defaults to the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls). It does not redirect the user immediately after invoking this method.
     * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
     *
     * @example Sign in using a third-party provider with redirect
     * ```js
     * const { data, error } = await supabase.auth.signInWithOAuth({
     *   provider: 'github',
     *   options: {
     *     redirectTo: 'https://example.com/welcome'
     *   }
     * })
     * ```
     *
     * @exampleDescription Sign in with scopes and access provider tokens
     * If you need additional access from an OAuth provider, in order to access provider specific APIs in the name of the user, you can do this by passing in the scopes the user should authorize for your application. Note that the `scopes` option takes in **a space-separated list** of scopes.
     *
     * Because OAuth sign-in often includes redirects, you should register an `onAuthStateChange` callback immediately after you create the Supabase client. This callback will listen for the presence of `provider_token` and `provider_refresh_token` properties on the `session` object and store them in local storage. The client library will emit these values **only once** immediately after the user signs in. You can then access them by looking them up in local storage, or send them to your backend servers for further processing.
     *
     * Finally, make sure you remove them from local storage on the `SIGNED_OUT` event. If the OAuth provider supports token revocation, make sure you call those APIs either from the frontend or schedule them to be called on the backend.
     *
     * @example Sign in with scopes and access provider tokens
     * ```js
     * // Register this immediately after calling createClient!
     * // Because signInWithOAuth causes a redirect, you need to fetch the
     * // provider tokens from the callback.
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (session && session.provider_token) {
     *     window.localStorage.setItem('oauth_provider_token', session.provider_token)
     *   }
     *
     *   if (session && session.provider_refresh_token) {
     *     window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
     *   }
     *
     *   if (event === 'SIGNED_OUT') {
     *     window.localStorage.removeItem('oauth_provider_token')
     *     window.localStorage.removeItem('oauth_provider_refresh_token')
     *   }
     * })
     *
     * // Call this on your Sign in with GitHub button to initiate OAuth
     * // with GitHub with the requested elevated scopes.
     * await supabase.auth.signInWithOAuth({
     *   provider: 'github',
     *   options: {
     *     scopes: 'repo gist notifications'
     *   }
     * })
     * ```
     */
    async signInWithOAuth(credentials) {
      var _a, _b, _c, _d;
      return await this._handleProviderSignIn(credentials.provider, {
        redirectTo: (_a = credentials.options) === null || _a === void 0 ? void 0 : _a.redirectTo,
        scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
        queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
        skipBrowserRedirect: (_d = credentials.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect
      });
    }
    /**
     * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
     *
     * @category Auth
     *
     * @remarks
     * - Used when `flowType` is set to `pkce` in client options.
     * - When several PKCE flows are in flight at once, pass `options.flowId` so
     *   the code is exchanged with the verifier created by that specific flow.
     *   The flow id is returned by `signInWithOAuth`, and with
     *   `experimental.appendPkceFlowIdToRedirects` enabled it also arrives on
     *   your callback URL as the reserved `sb_flow_id` query parameter (read
     *   automatically in a browser).
     * - When a flow id is present but its stored verifier is gone (evicted,
     *   already used, or from another device), the call fails with a verifier
     *   missing error instead of trying another flow's verifier — a mismatched
     *   verifier would consume the single-use code. Without any flow id the
     *   most recently stored verifier is used, as before.
     *
     * @example Exchange Auth Code
     * ```js
     * supabase.auth.exchangeCodeForSession('34e770dd-9ff9-416c-87fa-43b31d7ef225')
     * ```
     *
     * @example Exchange Auth Code for a specific flow (e.g. in a server-side callback handler)
     * ```js
     * const flowId = requestUrl.searchParams.get('sb_flow_id')
     * supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined)
     * ```
     *
     * @exampleResponse Exchange Auth Code
     * ```json
     * {
     *   "data": {
     *     session: {
     *       access_token: '<ACCESS_TOKEN>',
     *       token_type: 'bearer',
     *       expires_in: 3600,
     *       expires_at: 1700000000,
     *       refresh_token: '<REFRESH_TOKEN>',
     *       user: {
     *         id: '11111111-1111-1111-1111-111111111111',
     *         aud: 'authenticated',
     *         role: 'authenticated',
     *         email: 'example@email.com'
     *         email_confirmed_at: '2024-01-01T00:00:00Z',
     *         phone: '',
     *         confirmation_sent_at: '2024-01-01T00:00:00Z',
     *         confirmed_at: '2024-01-01T00:00:00Z',
     *         last_sign_in_at: '2024-01-01T00:00:00Z',
     *         app_metadata: {
     *           "provider": "email",
     *           "providers": [
     *             "email",
     *             "<OTHER_PROVIDER>"
     *           ]
     *         },
     *         user_metadata: {
     *           email: 'email@email.com',
     *           email_verified: true,
     *           full_name: 'User Name',
     *           iss: '<ISS>',
     *           name: 'User Name',
     *           phone_verified: false,
     *           provider_id: '<PROVIDER_ID>',
     *           sub: '<SUB>'
     *         },
     *         identities: [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "email@example.com"
     *           },
     *           {
     *             "identity_id": "33333333-3333-3333-3333-333333333333",
     *             "id": "<ID>",
     *             "user_id": "<USER_ID>",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": true,
     *               "full_name": "User Name",
     *               "iss": "<ISS>",
     *               "name": "User Name",
     *               "phone_verified": false,
     *               "provider_id": "<PROVIDER_ID>",
     *               "sub": "<SUB>"
     *             },
     *             "provider": "<PROVIDER>",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         created_at: '2024-01-01T00:00:00Z',
     *         updated_at: '2024-01-01T00:00:00Z',
     *         is_anonymous: false
     *       },
     *       provider_token: '<PROVIDER_TOKEN>',
     *       provider_refresh_token: '<PROVIDER_REFRESH_TOKEN>'
     *     },
     *     user: {
     *       id: '11111111-1111-1111-1111-111111111111',
     *       aud: 'authenticated',
     *       role: 'authenticated',
     *       email: 'example@email.com',
     *       email_confirmed_at: '2024-01-01T00:00:00Z',
     *       phone: '',
     *       confirmation_sent_at: '2024-01-01T00:00:00Z',
     *       confirmed_at: '2024-01-01T00:00:00Z',
     *       last_sign_in_at: '2024-01-01T00:00:00Z',
     *       app_metadata: {
     *         provider: 'email',
     *         providers: [
     *           "email",
     *           "<OTHER_PROVIDER>"
     *         ]
     *       },
     *       user_metadata: {
     *         email: 'email@email.com',
     *         email_verified: true,
     *         full_name: 'User Name',
     *         iss: '<ISS>',
     *         name: 'User Name',
     *         phone_verified: false,
     *         provider_id: '<PROVIDER_ID>',
     *         sub: '<SUB>'
     *       },
     *       identities: [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "email@example.com"
     *         },
     *         {
     *           "identity_id": "33333333-3333-3333-3333-333333333333",
     *           "id": "<ID>",
     *           "user_id": "<USER_ID>",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": true,
     *             "full_name": "User Name",
     *             "iss": "<ISS>",
     *             "name": "User Name",
     *             "phone_verified": false,
     *             "provider_id": "<PROVIDER_ID>",
     *             "sub": "<SUB>"
     *           },
     *           "provider": "<PROVIDER>",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       created_at: '2024-01-01T00:00:00Z',
     *       updated_at: '2024-01-01T00:00:00Z',
     *       is_anonymous: false
     *     },
     *     redirectType: null
     *   },
     *   "error": null
     * }
     * ```
     */
    async exchangeCodeForSession(authCode, options2) {
      await this.initializePromise;
      if (this.lock != null) {
        return this._acquireLock(this.lockAcquireTimeout, async () => {
          return this._exchangeCodeForSession(authCode, options2);
        });
      }
      return this._exchangeCodeForSession(authCode, options2);
    }
    /**
     * Signs in a user by verifying a message signed by the user's private key.
     * Supports Ethereum (via Sign-In-With-Ethereum) & Solana (Sign-In-With-Solana) standards,
     * both of which derive from the EIP-4361 standard
     * With slight variation on Solana's side.
     * @reference https://eips.ethereum.org/EIPS/eip-4361
     *
     * @category Auth
     *
     * @remarks
     * - Uses a Web3 (Ethereum, Solana) wallet to sign a user in.
     * - Read up on the [potential for abuse](/docs/guides/auth/auth-web3#potential-for-abuse) before using it.
     *
     * @example Sign in with Solana or Ethereum (Window API)
     * ```js
     *   // uses window.ethereum for the wallet
     *   const { data, error } = await supabase.auth.signInWithWeb3({
     *     chain: 'ethereum',
     *     statement: 'I accept the Terms of Service at https://example.com/tos'
     *   })
     *
     *   // uses window.solana for the wallet
     *   const { data, error } = await supabase.auth.signInWithWeb3({
     *     chain: 'solana',
     *     statement: 'I accept the Terms of Service at https://example.com/tos'
     *   })
     * ```
     *
     * @example Sign in with Ethereum (Message and Signature)
     * ```js
     *   const { data, error } = await supabase.auth.signInWithWeb3({
     *     chain: 'ethereum',
     *     message: '<sign in with ethereum message>',
     *     signature: '<hex of the ethereum signature over the message>',
     *   })
     * ```
     *
     * @example Sign in with Solana (Brave)
     * ```js
     *   const { data, error } = await supabase.auth.signInWithWeb3({
     *     chain: 'solana',
     *     statement: 'I accept the Terms of Service at https://example.com/tos',
     *     wallet: window.braveSolana
     *   })
     * ```
     *
     * @example Sign in with Solana (Wallet Adapter)
     * ```jsx
     *   function SignInButton() {
     *   const wallet = useWallet()
     *
     *   return (
     *     <>
     *       {wallet.connected ? (
     *         <button
     *           onClick={() => {
     *             supabase.auth.signInWithWeb3({
     *               chain: 'solana',
     *               statement: 'I accept the Terms of Service at https://example.com/tos',
     *               wallet,
     *             })
     *           }}
     *         >
     *           Sign in with Solana
     *         </button>
     *       ) : (
     *         <WalletMultiButton />
     *       )}
     *     </>
     *   )
     * }
     *
     * function App() {
     *   const endpoint = clusterApiUrl('devnet')
     *   const wallets = useMemo(() => [], [])
     *
     *   return (
     *     <ConnectionProvider endpoint={endpoint}>
     *       <WalletProvider wallets={wallets}>
     *         <WalletModalProvider>
     *           <SignInButton />
     *         </WalletModalProvider>
     *       </WalletProvider>
     *     </ConnectionProvider>
     *   )
     * }
     * ```
     */
    async signInWithWeb3(credentials) {
      const { chain } = credentials;
      switch (chain) {
        case "ethereum":
          return await this.signInWithEthereum(credentials);
        case "solana":
          return await this.signInWithSolana(credentials);
        default:
          throw new Error(`@supabase/auth-js: Unsupported chain "${chain}"`);
      }
    }
    async signInWithEthereum(credentials) {
      var _a, _b, _c, _d, _f, _g, _h, _j, _k, _l, _m;
      let message;
      let signature;
      if ("message" in credentials) {
        message = credentials.message;
        signature = credentials.signature;
      } else {
        const { chain, wallet, statement, options: options2 } = credentials;
        let resolvedWallet;
        if (!isBrowser()) {
          if (typeof wallet !== "object" || !(options2 === null || options2 === void 0 ? void 0 : options2.url)) {
            throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
          }
          resolvedWallet = wallet;
        } else if (typeof wallet === "object") {
          resolvedWallet = wallet;
        } else {
          const windowAny = window;
          if ("ethereum" in windowAny && typeof windowAny.ethereum === "object" && "request" in windowAny.ethereum && typeof windowAny.ethereum.request === "function") {
            resolvedWallet = windowAny.ethereum;
          } else {
            throw new Error(`@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.`);
          }
        }
        const url = new URL((_a = options2 === null || options2 === void 0 ? void 0 : options2.url) !== null && _a !== void 0 ? _a : window.location.href);
        const accounts = await resolvedWallet.request({
          method: "eth_requestAccounts"
        }).then((accs) => accs).catch(() => {
          throw new Error(`@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid`);
        });
        if (!accounts || accounts.length === 0) {
          throw new Error(`@supabase/auth-js: No accounts available. Please ensure the wallet is connected.`);
        }
        const address = getAddress(accounts[0]);
        let chainId = (_b = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _b === void 0 ? void 0 : _b.chainId;
        if (!chainId) {
          const chainIdHex = await resolvedWallet.request({
            method: "eth_chainId"
          });
          chainId = fromHex(chainIdHex);
        }
        const siweMessage = {
          domain: url.host,
          address,
          statement,
          uri: url.href,
          version: "1",
          chainId,
          nonce: (_c = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _c === void 0 ? void 0 : _c.nonce,
          issuedAt: (_f = (_d = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _d === void 0 ? void 0 : _d.issuedAt) !== null && _f !== void 0 ? _f : /* @__PURE__ */ new Date(),
          expirationTime: (_g = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _g === void 0 ? void 0 : _g.expirationTime,
          notBefore: (_h = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _h === void 0 ? void 0 : _h.notBefore,
          requestId: (_j = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _j === void 0 ? void 0 : _j.requestId,
          resources: (_k = options2 === null || options2 === void 0 ? void 0 : options2.signInWithEthereum) === null || _k === void 0 ? void 0 : _k.resources
        };
        message = createSiweMessage(siweMessage);
        signature = await resolvedWallet.request({
          method: "personal_sign",
          params: [toHex(message), address]
        });
      }
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
          headers: this.headers,
          body: Object.assign({
            chain: "ethereum",
            message,
            signature
          }, ((_l = credentials.options) === null || _l === void 0 ? void 0 : _l.captchaToken) ? { gotrue_meta_security: { captcha_token: (_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken } } : null),
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data: Object.assign({}, data), error });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    async signInWithSolana(credentials) {
      var _a, _b, _c, _d, _f, _g, _h, _j, _k, _l, _m, _o;
      let message;
      let signature;
      if ("message" in credentials) {
        message = credentials.message;
        signature = credentials.signature;
      } else {
        const { chain, wallet, statement, options: options2 } = credentials;
        let resolvedWallet;
        if (!isBrowser()) {
          if (typeof wallet !== "object" || !(options2 === null || options2 === void 0 ? void 0 : options2.url)) {
            throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
          }
          resolvedWallet = wallet;
        } else if (typeof wallet === "object") {
          resolvedWallet = wallet;
        } else {
          const windowAny = window;
          if ("solana" in windowAny && typeof windowAny.solana === "object" && ("signIn" in windowAny.solana && typeof windowAny.solana.signIn === "function" || "signMessage" in windowAny.solana && typeof windowAny.solana.signMessage === "function")) {
            resolvedWallet = windowAny.solana;
          } else {
            throw new Error(`@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.`);
          }
        }
        const url = new URL((_a = options2 === null || options2 === void 0 ? void 0 : options2.url) !== null && _a !== void 0 ? _a : window.location.href);
        if ("signIn" in resolvedWallet && resolvedWallet.signIn) {
          const output = await resolvedWallet.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana), {
            // non-overridable properties
            version: "1",
            domain: url.host,
            uri: url.href
          }), statement ? { statement } : null));
          let outputToProcess;
          if (Array.isArray(output) && output[0] && typeof output[0] === "object") {
            outputToProcess = output[0];
          } else if (output && typeof output === "object" && "signedMessage" in output && "signature" in output) {
            outputToProcess = output;
          } else {
            throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
          }
          if ("signedMessage" in outputToProcess && "signature" in outputToProcess && (typeof outputToProcess.signedMessage === "string" || outputToProcess.signedMessage instanceof Uint8Array) && outputToProcess.signature instanceof Uint8Array) {
            message = typeof outputToProcess.signedMessage === "string" ? outputToProcess.signedMessage : new TextDecoder().decode(outputToProcess.signedMessage);
            signature = outputToProcess.signature;
          } else {
            throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
          }
        } else {
          if (!("signMessage" in resolvedWallet) || typeof resolvedWallet.signMessage !== "function" || !("publicKey" in resolvedWallet) || typeof resolvedWallet !== "object" || !resolvedWallet.publicKey || !("toBase58" in resolvedWallet.publicKey) || typeof resolvedWallet.publicKey.toBase58 !== "function") {
            throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
          }
          message = [
            `${url.host} wants you to sign in with your Solana account:`,
            resolvedWallet.publicKey.toBase58(),
            ...statement ? ["", statement, ""] : [""],
            "Version: 1",
            `URI: ${url.href}`,
            `Issued At: ${(_c = (_b = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _b === void 0 ? void 0 : _b.issuedAt) !== null && _c !== void 0 ? _c : (/* @__PURE__ */ new Date()).toISOString()}`,
            ...((_d = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _d === void 0 ? void 0 : _d.notBefore) ? [`Not Before: ${options2.signInWithSolana.notBefore}`] : [],
            ...((_f = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _f === void 0 ? void 0 : _f.expirationTime) ? [`Expiration Time: ${options2.signInWithSolana.expirationTime}`] : [],
            ...((_g = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _g === void 0 ? void 0 : _g.chainId) ? [`Chain ID: ${options2.signInWithSolana.chainId}`] : [],
            ...((_h = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _h === void 0 ? void 0 : _h.nonce) ? [`Nonce: ${options2.signInWithSolana.nonce}`] : [],
            ...((_j = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _j === void 0 ? void 0 : _j.requestId) ? [`Request ID: ${options2.signInWithSolana.requestId}`] : [],
            ...((_l = (_k = options2 === null || options2 === void 0 ? void 0 : options2.signInWithSolana) === null || _k === void 0 ? void 0 : _k.resources) === null || _l === void 0 ? void 0 : _l.length) ? [
              "Resources",
              ...options2.signInWithSolana.resources.map((resource) => `- ${resource}`)
            ] : []
          ].join("\n");
          const maybeSignature = await resolvedWallet.signMessage(new TextEncoder().encode(message), "utf8");
          if (!maybeSignature || !(maybeSignature instanceof Uint8Array)) {
            throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
          }
          signature = maybeSignature;
        }
      }
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
          headers: this.headers,
          body: Object.assign({ chain: "solana", message, signature: bytesToBase64URL(signature) }, ((_m = credentials.options) === null || _m === void 0 ? void 0 : _m.captchaToken) ? { gotrue_meta_security: { captcha_token: (_o = credentials.options) === null || _o === void 0 ? void 0 : _o.captchaToken } } : null),
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data: Object.assign({}, data), error });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    async _exchangeCodeForSession(authCode, options2) {
      const hasExplicitFlowId = (options2 === null || options2 === void 0 ? void 0 : options2.flowId) != null;
      const requestedFlowId = hasExplicitFlowId ? validatePKCEFlowId(options2 === null || options2 === void 0 ? void 0 : options2.flowId) : isBrowser() ? validatePKCEFlowId(parseParametersFromURL(window.location.href)[PKCE_FLOW_ID_PARAM]) : null;
      if (hasExplicitFlowId && !requestedFlowId) {
        this._debug("#_exchangeCodeForSession()", "provided flowId is not a valid flow id", options2 === null || options2 === void 0 ? void 0 : options2.flowId);
      }
      const { verifier: storageItem, flowId } = hasExplicitFlowId && !requestedFlowId ? { verifier: null, flowId: null } : await retrievePKCEVerifier(this.storage, this.storageKey, requestedFlowId);
      const [codeVerifier, redirectType] = (storageItem !== null && storageItem !== void 0 ? storageItem : "").split("/");
      try {
        if (!codeVerifier && this.flowType === "pkce") {
          throw new AuthPKCECodeVerifierMissingError();
        }
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
          headers: this.headers,
          body: {
            auth_code: authCode,
            code_verifier: codeVerifier
          },
          xform: _sessionResponse
        });
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (error) {
          throw error;
        }
        if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({
            data: { user: null, session: null, redirectType: null },
            error: invalidTokenError
          });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers(redirectType === "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", data.session);
        }
        return this._returnResult({ data: Object.assign(Object.assign({}, data), { redirectType: redirectType !== null && redirectType !== void 0 ? redirectType : null }), error });
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({
            data: { user: null, session: null, redirectType: null },
            error
          });
        }
        throw error;
      }
    }
    /**
     * Allows signing in with an OIDC ID token. The authentication provider used
     * should be enabled and configured.
     *
     * @category Auth
     *
     * @remarks
     * - Use an ID token to sign in.
     * - Especially useful when implementing sign in using native platform dialogs in mobile or desktop apps using Sign in with Apple or Sign in with Google on iOS and Android.
     * - You can also use Google's [One Tap](https://developers.google.com/identity/gsi/web/guides/display-google-one-tap) and [Automatic sign-in](https://developers.google.com/identity/gsi/web/guides/automatic-sign-in-sign-out) via this API.
     *
     * @example Sign In using ID Token
     * ```js
     * const { data, error } = await supabase.auth.signInWithIdToken({
     *   provider: 'google',
     *   token: 'your-id-token'
     * })
     * ```
     *
     * @exampleResponse Sign In using ID Token
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         ...
     *       },
     *       "user_metadata": {
     *         ...
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "provider": "google",
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {
     *           ...
     *         },
     *         "user_metadata": {
     *           ...
     *         },
     *         "identities": [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "provider": "google",
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     */
    async signInWithIdToken(credentials) {
      try {
        const { options: options2, provider, token, access_token, nonce } = credentials;
        const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
          headers: this.headers,
          body: {
            provider,
            id_token: token,
            access_token,
            nonce,
            gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken }
          },
          xform: _sessionResponse
        });
        const { data, error } = res;
        if (error) {
          return this._returnResult({ data: { user: null, session: null }, error });
        } else if (!data || !data.session || !data.user) {
          const invalidTokenError = new AuthInvalidTokenResponseError();
          return this._returnResult({ data: { user: null, session: null }, error: invalidTokenError });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data, error });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in a user using magiclink or a one-time password (OTP).
     *
     * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
     * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
     * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
     *
     * Be aware that you may get back an error message that will not distinguish
     * between the cases where the account does not exist or, that the account
     * can only be accessed via social sign-in.
     *
     * Do note that you will need to configure a Whatsapp sender on Twilio
     * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
     * channel is not supported on other providers
     * at this time.
     * This method supports PKCE when an email is passed.
     *
     * @category Auth
     *
     * @remarks
     * - Requires either an email or phone number.
     * - This method is used for passwordless sign-ins where a OTP is sent to the user's email or phone number.
     * - If the user doesn't exist, `signInWithOtp()` will signup the user instead. To restrict this behavior, you can set `shouldCreateUser` in `SignInWithPasswordlessCredentials.options` to `false`.
     * - If you're using an email, you can configure whether you want the user to receive a magiclink or a OTP.
     * - If you're using phone, you can configure whether you want the user to receive a OTP.
     * - The magic link's destination URL is determined by the [`SITE_URL`](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls).
     * - See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
     * - Magic links and OTPs share the same implementation. To send users a one-time code instead of a magic link, [modify the magic link email template](/dashboard/project/_/auth/templates) to include `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.
     * - See our [Twilio Phone Auth Guide](/docs/guides/auth/phone-login?showSMSProvider=Twilio) for details about configuring WhatsApp sign in.
     *
     * @exampleDescription Sign in with email
     * The user will be sent an email which contains either a magiclink or a OTP or both. By default, a given user can only request a OTP once every 60 seconds.
     *
     * @example Sign in with email
     * ```js
     * const { data, error } = await supabase.auth.signInWithOtp({
     *   email: 'example@email.com',
     *   options: {
     *     emailRedirectTo: 'https://example.com/welcome'
     *   }
     * })
     * ```
     *
     * @exampleResponse Sign in with email
     * ```json
     * {
     *   "data": {
     *     "user": null,
     *     "session": null
     *   },
     *   "error": null
     * }
     * ```
     *
     * @exampleDescription Sign in with SMS OTP
     * The user will be sent a SMS which contains a OTP. By default, a given user can only request a OTP once every 60 seconds.
     *
     * @example Sign in with SMS OTP
     * ```js
     * const { data, error } = await supabase.auth.signInWithOtp({
     *   phone: '+13334445555',
     * })
     * ```
     *
     * @exampleDescription Sign in with WhatsApp OTP
     * The user will be sent a WhatsApp message which contains a OTP. By default, a given user can only request a OTP once every 60 seconds. Note that a user will need to have a valid WhatsApp account that is linked to Twilio in order to use this feature.
     *
     * @example Sign in with WhatsApp OTP
     * ```js
     * const { data, error } = await supabase.auth.signInWithOtp({
     *   phone: '+13334445555',
     *   options: {
     *     channel:'whatsapp',
     *   }
     * })
     * ```
     */
    async signInWithOtp(credentials) {
      var _a, _b, _c, _d, _f;
      let flowId = null;
      try {
        if ("email" in credentials) {
          const { email, options: options2 } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
          }
          const { error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
            headers: this.headers,
            body: {
              email,
              data: (_a = options2 === null || options2 === void 0 ? void 0 : options2.data) !== null && _a !== void 0 ? _a : {},
              create_user: (_b = options2 === null || options2 === void 0 ? void 0 : options2.shouldCreateUser) !== null && _b !== void 0 ? _b : true,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            redirectTo: this._maybeAppendFlowIdToRedirect(options2 === null || options2 === void 0 ? void 0 : options2.emailRedirectTo, flowId)
          });
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        if ("phone" in credentials) {
          const { phone, options: options2 } = credentials;
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/otp`, {
            headers: this.headers,
            body: {
              phone,
              data: (_c = options2 === null || options2 === void 0 ? void 0 : options2.data) !== null && _c !== void 0 ? _c : {},
              create_user: (_d = options2 === null || options2 === void 0 ? void 0 : options2.shouldCreateUser) !== null && _d !== void 0 ? _d : true,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken },
              channel: (_f = options2 === null || options2 === void 0 ? void 0 : options2.channel) !== null && _f !== void 0 ? _f : "sms"
            }
          });
          return this._returnResult({
            data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
            error
          });
        }
        throw new AuthInvalidCredentialsError("You must provide either an email or phone number.");
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
     *
     * @category Auth
     *
     * @remarks
     * - The `verifyOtp` method takes in different verification types.
     * - If a phone number is used, the type can either be:
     *   1. `sms` – Used when verifying a one-time password (OTP) sent via SMS during sign-up or sign-in.
     *   2. `phone_change` – Used when verifying an OTP sent to a new phone number during a phone number update process.
     * - If an email address is used, the type can be one of the following (note: `signup` and `magiclink` types are deprecated):
     *   1. `email` – Used when verifying an OTP sent to the user's email during sign-up or sign-in.
     *   2. `recovery` – Used when verifying an OTP sent for account recovery, typically after a password reset request.
     *   3. `invite` – Used when verifying an OTP sent as part of an invitation to join a project or organization.
     *   4. `email_change` – Used when verifying an OTP sent to a new email address during an email update process.
     * - The verification type used should be determined based on the corresponding auth method called before `verifyOtp` to sign up / sign-in a user.
     * - The `TokenHash` is contained in the [email templates](/docs/guides/auth/auth-email-templates) and can be used to sign in.  You may wish to use the hash for the PKCE flow for Server Side Auth. Read [the Password-based Auth guide](/docs/guides/auth/passwords) for more details.
     *
     * @example Verify Signup One-Time Password (OTP)
     * ```js
     * const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email'})
     * ```
     *
     * @exampleResponse Verify Signup One-Time Password (OTP)
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmed_at": "2024-01-01T00:00:00Z",
     *       "recovery_sent_at": "2024-01-01T00:00:00Z",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {
     *         "email": "example@email.com",
     *         "email_verified": false,
     *         "phone_verified": false,
     *         "sub": "11111111-1111-1111-1111-111111111111"
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "example@email.com",
     *         "email_confirmed_at": "2024-01-01T00:00:00Z",
     *         "phone": "",
     *         "confirmed_at": "2024-01-01T00:00:00Z",
     *         "recovery_sent_at": "2024-01-01T00:00:00Z",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {
     *           "provider": "email",
     *           "providers": [
     *             "email"
     *           ]
     *         },
     *         "user_metadata": {
     *           "email": "example@email.com",
     *           "email_verified": false,
     *           "phone_verified": false,
     *           "sub": "11111111-1111-1111-1111-111111111111"
     *         },
     *         "identities": [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *         "is_anonymous": false
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Verify SMS One-Time Password (OTP)
     * ```js
     * const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms'})
     * ```
     *
     * @example Verify Email Auth (Token Hash)
     * ```js
     * const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email'})
     * ```
     */
    async verifyOtp(params) {
      var _a, _b;
      try {
        let redirectTo = void 0;
        let captchaToken = void 0;
        if ("options" in params) {
          redirectTo = (_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo;
          captchaToken = (_b = params.options) === null || _b === void 0 ? void 0 : _b.captchaToken;
        }
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/verify`, {
          headers: this.headers,
          body: Object.assign(Object.assign({}, params), { gotrue_meta_security: { captcha_token: captchaToken } }),
          redirectTo,
          xform: _sessionResponse
        });
        if (error) {
          throw error;
        }
        if (!data) {
          const tokenVerificationError = new Error("An error occurred on token verification.");
          throw tokenVerificationError;
        }
        const session = data.session;
        const user = data.user;
        if (session === null || session === void 0 ? void 0 : session.access_token) {
          await this._saveSession(session);
          await this._notifyAllSubscribers(params.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", session);
        }
        return this._returnResult({ data: { user, session }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Attempts a single-sign on using an enterprise Identity Provider. A
     * successful SSO attempt will redirect the current page to the identity
     * provider authorization page. The redirect URL is implementation and SSO
     * protocol specific.
     *
     * You can use it by providing a SSO domain. Typically you can extract this
     * domain by asking users for their email address. If this domain is
     * registered on the Auth instance the redirect will use that organization's
     * currently active SSO Identity Provider for the login.
     *
     * If you have built an organization-specific login page, you can use the
     * organization's SSO Identity Provider UUID directly instead.
     *
     * @category Auth
     *
     * @remarks
     * - Before you can call this method you need to [establish a connection](/docs/guides/auth/sso/auth-sso-saml#managing-saml-20-connections) to an identity provider. Use the [CLI commands](/docs/reference/cli/supabase-sso) to do this.
     * - If you've associated an email domain to the identity provider, you can use the `domain` property to start a sign-in flow.
     * - In case you need to use a different way to start the authentication flow with an identity provider, you can use the `providerId` property. For example:
     *     - Mapping specific user email addresses with an identity provider.
     *     - Using different hints to identity the identity provider to be used by the user, like a company-specific page, IP address or other tracking information.
     *
     * @example Sign in with email domain
     * ```js
     *   // You can extract the user's email domain and use it to trigger the
     *   // authentication flow with the correct identity provider.
     *
     *   const { data, error } = await supabase.auth.signInWithSSO({
     *     domain: 'company.com'
     *   })
     *
     *   if (data?.url) {
     *     // redirect the user to the identity provider's authentication flow
     *     window.location.href = data.url
     *   }
     * ```
     *
     * @example Sign in with provider UUID
     * ```js
     *   // Useful when you need to map a user's sign in request according
     *   // to different rules that can't use email domains.
     *
     *   const { data, error } = await supabase.auth.signInWithSSO({
     *     providerId: '21648a9d-8d5a-4555-a9d1-d6375dc14e92'
     *   })
     *
     *   if (data?.url) {
     *     // redirect the user to the identity provider's authentication flow
     *     window.location.href = data.url
     *   }
     * ```
     */
    async signInWithSSO(params) {
      var _a, _b, _c, _d;
      let flowId = null;
      try {
        let codeChallenge = null;
        let codeChallengeMethod = null;
        if (this.flowType === "pkce") {
          ;
          [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
        }
        const result = await _request(this.fetch, "POST", `${this.url}/sso`, {
          body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in params ? { provider_id: params.providerId } : null), "domain" in params ? { domain: params.domain } : null), { redirect_to: this._maybeAppendFlowIdToRedirect((_a = params.options) === null || _a === void 0 ? void 0 : _a.redirectTo, flowId) }), ((_b = params === null || params === void 0 ? void 0 : params.options) === null || _b === void 0 ? void 0 : _b.captchaToken) ? { gotrue_meta_security: { captcha_token: params.options.captchaToken } } : null), { skip_http_redirect: true, code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
          headers: this.headers,
          xform: _ssoResponse
        });
        if (((_c = result.data) === null || _c === void 0 ? void 0 : _c.url) && isBrowser() && !((_d = params.options) === null || _d === void 0 ? void 0 : _d.skipBrowserRedirect)) {
          window.location.assign(result.data.url);
        }
        return this._returnResult(result);
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Sends a reauthentication OTP to the user's email or phone number.
     * Requires the user to be signed-in.
     *
     * @category Auth
     *
     * @remarks
     * - This method is used together with `updateUser()` when a user's password needs to be updated.
     * - If you require your user to reauthenticate before updating their password, you need to enable the **Secure password change** option in your [project's email provider settings](/dashboard/project/_/auth/providers).
     * - A user is only require to reauthenticate before updating their password if **Secure password change** is enabled and the user **hasn't recently signed in**. A user is deemed recently signed in if the session was created in the last 24 hours.
     * - This method will send a nonce to the user's email. If the user doesn't have a confirmed email address, the method will send the nonce to the user's confirmed phone number instead.
     * - After receiving the OTP, include it as the `nonce` in your `updateUser()` call to finalize the password change.
     *
     * @exampleDescription Send reauthentication nonce
     * Sends a reauthentication nonce to the user's email or phone number.
     *
     * @example Send reauthentication nonce
     * ```js
     * const { error } = await supabase.auth.reauthenticate()
     * ```
     */
    async reauthenticate() {
      await this.initializePromise;
      if (this.lock != null) {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._reauthenticate();
        });
      }
      return await this._reauthenticate();
    }
    async _reauthenticate() {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError)
            throw sessionError;
          if (!session)
            throw new AuthSessionMissingError();
          const { error } = await _request(this.fetch, "GET", `${this.url}/reauthenticate`, {
            headers: this.headers,
            jwt: session.access_token
          });
          return this._returnResult({ data: { user: null, session: null }, error });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
     *
     * @category Auth
     *
     * @remarks
     * - Resends a signup confirmation, email change or phone change email to the user.
     * - Passwordless sign-ins can be resent by calling the `signInWithOtp()` method again.
     * - Password recovery emails can be resent by calling the `resetPasswordForEmail()` method again.
     * - This method will only resend an email or phone OTP to the user if there was an initial signup, email change or phone change request being made(note: For existing users signing in with OTP, you should use `signInWithOtp()` again to resend the OTP).
     * - You can specify a redirect url when you resend an email link using the `emailRedirectTo` option.
     *
     * @exampleDescription Resend an email signup confirmation
     * Resends the email signup confirmation to the user
     *
     * @example Resend an email signup confirmation
     * ```js
     * const { error } = await supabase.auth.resend({
     *   type: 'signup',
     *   email: 'email@example.com',
     *   options: {
     *     emailRedirectTo: 'https://example.com/welcome'
     *   }
     * })
     * ```
     *
     * @exampleDescription Resend a phone signup confirmation
     * Resends the phone signup confirmation email to the user
     *
     * @example Resend a phone signup confirmation
     * ```js
     * const { error } = await supabase.auth.resend({
     *   type: 'sms',
     *   phone: '1234567890'
     * })
     * ```
     *
     * @exampleDescription Resend email change email
     * Resends the email change email to the user
     *
     * @example Resend email change email
     * ```js
     * const { error } = await supabase.auth.resend({
     *   type: 'email_change',
     *   email: 'email@example.com'
     * })
     * ```
     *
     * @exampleDescription Resend phone change OTP
     * Resends the phone change OTP to the user
     *
     * @example Resend phone change OTP
     * ```js
     * const { error } = await supabase.auth.resend({
     *   type: 'phone_change',
     *   phone: '1234567890'
     * })
     * ```
     */
    async resend(credentials) {
      let flowId = null;
      try {
        const endpoint = `${this.url}/resend`;
        if ("email" in credentials) {
          const { email, type, options: options2 } = credentials;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce") {
            ;
            [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
          }
          const { error } = await _request(this.fetch, "POST", endpoint, {
            headers: this.headers,
            body: {
              email,
              type,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken },
              code_challenge: codeChallenge,
              code_challenge_method: codeChallengeMethod
            },
            redirectTo: this._maybeAppendFlowIdToRedirect(options2 === null || options2 === void 0 ? void 0 : options2.emailRedirectTo, flowId)
          });
          if (error) {
            await removePKCEVerifier(this.storage, this.storageKey, flowId);
          }
          return this._returnResult({ data: { user: null, session: null }, error });
        } else if ("phone" in credentials) {
          const { phone, type, options: options2 } = credentials;
          const { data, error } = await _request(this.fetch, "POST", endpoint, {
            headers: this.headers,
            body: {
              phone,
              type,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken }
            }
          });
          return this._returnResult({
            data: { user: null, session: null, messageId: data === null || data === void 0 ? void 0 : data.message_id },
            error
          });
        }
        throw new AuthInvalidCredentialsError("You must provide either an email or phone number and a type");
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Returns the session, refreshing it if necessary.
     *
     * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
     *
     * **IMPORTANT:** This method loads values directly from the storage attached
     * to the client. If that storage is based on request cookies for example,
     * the values in it may not be authentic and therefore it's strongly advised
     * against using this method and its results in such circumstances. A warning
     * will be emitted if this is detected. Use {@link GoTrueClient.getUser} instead.
     *
     * @category Auth
     *
     * @remarks
     * - Since the introduction of [asymmetric JWT signing keys](/docs/guides/auth/signing-keys), this method is considered low-level and we encourage you to use `getClaims()` or `getUser()` instead.
     * - Retrieves the current [user session](/docs/guides/auth/sessions) from the storage medium (local storage, cookies).
     * - The session contains an access token (signed JWT), a refresh token and the user object.
     * - If the session's access token is expired or is about to expire, this method will use the refresh token to refresh the session.
     * - When using in a browser, or you've called `startAutoRefresh()` in your environment (React Native, etc.) this function always returns a valid access token without refreshing the session itself, as this is done in the background. This function returns very fast.
     * - **IMPORTANT SECURITY NOTICE:** If using an insecure storage medium, such as cookies or request headers, the user object returned by this function **must not be trusted**. Always verify the JWT using `getClaims()` or your own JWT verification library to securely establish the user's identity and access. You can also use `getUser()` to fetch the user object directly from the Auth server for this purpose.
     * - Cross-tab refresh races are handled by the GoTrue server (the rotated token from the first tab is returned to subsequent tabs via the parent-of-active mechanism), so no client-side serialization is needed.
     *
     * @example Get the session data
     * ```js
     * const { data, error } = await supabase.auth.getSession()
     * ```
     *
     * @exampleResponse Get the session data
     * ```json
     * {
     *   "data": {
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "example@email.com",
     *         "email_confirmed_at": "2024-01-01T00:00:00Z",
     *         "phone": "",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {
     *           "provider": "email",
     *           "providers": [
     *             "email"
     *           ]
     *         },
     *         "user_metadata": {
     *           "email": "example@email.com",
     *           "email_verified": false,
     *           "phone_verified": false,
     *           "sub": "11111111-1111-1111-1111-111111111111"
     *         },
     *         "identities": [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *         "is_anonymous": false
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     */
    async getSession() {
      await this.initializePromise;
      if (this.lock != null) {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return this._useSession(async (result) => {
            return result;
          });
        });
      }
      return await this._useSession(async (result) => {
        return result;
      });
    }
    /**
     * Acquires a global lock based on the storage key.
     *
     * TODO(v3): remove along with the legacy lock path. Only called when
     * `this.lock` is non-null (custom lock supplied via constructor). The
     * default lockless path bypasses this entirely.
     */
    async _acquireLock(acquireTimeout, fn) {
      this._debug("#_acquireLock", "begin", acquireTimeout);
      try {
        if (this.lockAcquired) {
          const last = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve();
          const result = (async () => {
            await last;
            return await fn();
          })();
          this.pendingInLock.push((async () => {
            try {
              await result;
            } catch (_e) {
            }
          })());
          return result;
        }
        return await this.lock(`lock:${this.storageKey}`, acquireTimeout, async () => {
          this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
          try {
            this.lockAcquired = true;
            const result = fn();
            this.pendingInLock.push((async () => {
              try {
                await result;
              } catch (e) {
              }
            })());
            await result;
            while (this.pendingInLock.length) {
              const waitOn = [...this.pendingInLock];
              await Promise.all(waitOn);
              this.pendingInLock.splice(0, waitOn.length);
            }
            return await result;
          } finally {
            this._debug("#_acquireLock", "lock released for storage key", this.storageKey);
            this.lockAcquired = false;
          }
        });
      } finally {
        this._debug("#_acquireLock", "end");
      }
    }
    /**
     * Use instead of {@link GoTrueClient.getSession} inside the library. Loads the session
     * via `__loadSession` (which may trigger a refresh if the access token is
     * within the expiry margin) and runs `fn` with the result.
     */
    async _useSession(fn) {
      this._debug("#_useSession", "begin");
      try {
        const result = await this.__loadSession();
        return await fn(result);
      } finally {
        this._debug("#_useSession", "end");
      }
    }
    /**
     * NEVER USE DIRECTLY!
     *
     * Always use `_useSession`.
     */
    async __loadSession() {
      this._debug("#__loadSession()", "begin");
      if (this.lock != null && !this.lockAcquired) {
        this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
      }
      try {
        let currentSession = null;
        const maybeSession = await getItemAsync(this.storage, this.storageKey);
        this._debug("#getSession()", "session from storage", maybeSession);
        if (maybeSession !== null) {
          if (this._isValidSession(maybeSession)) {
            currentSession = maybeSession;
          } else {
            this._debug("#getSession()", "session from storage is not valid");
            await this._removeSession();
          }
        }
        if (!currentSession) {
          return { data: { session: null }, error: null };
        }
        const hasExpired = currentSession.expires_at ? currentSession.expires_at * 1e3 - Date.now() < EXPIRY_MARGIN_MS : false;
        this._debug("#__loadSession()", `session has${hasExpired ? "" : " not"} expired`, "expires_at", currentSession.expires_at);
        if (!hasExpired) {
          return { data: { session: await this._hydrateSessionUser(currentSession) }, error: null };
        }
        const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
        if (error) {
          const stored = await getItemAsync(this.storage, this.storageKey);
          if (stored && this._isValidSession(stored) && stored.expires_at && stored.expires_at * 1e3 > Date.now()) {
            return this._returnResult({
              data: { session: await this._hydrateSessionUser(stored) },
              error: null
            });
          }
          return this._returnResult({ data: { session: null }, error });
        }
        return this._returnResult({ data: { session }, error: null });
      } finally {
        this._debug("#__loadSession()", "end");
      }
    }
    /**
     * Completes a session read back from storage so it matches what callers of
     * `getSession()` expect: fills in `session.user` from `userStorage` when the
     * client keeps the user in split storage, and wraps the user in the
     * insecure-access warning proxy on the server.
     */
    async _hydrateSessionUser(session) {
      if (this.userStorage) {
        const maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
        session.user = (maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) ? maybeUser.user : userNotAvailableProxy();
      }
      if (this.storage.isServer && session.user && !session.user.__isUserNotAvailableProxy) {
        const suppressWarningRef = { value: this.suppressGetSessionWarning };
        session.user = insecureUserWarningProxy(session.user, suppressWarningRef);
        if (suppressWarningRef.value) {
          this.suppressGetSessionWarning = true;
        }
      }
      return session;
    }
    /**
     * Gets the current user details if there is an existing session. This method
     * performs a network request to the Supabase Auth server, so the returned
     * value is authentic and can be used to base authorization rules on.
     *
     * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
     *
     * @category Auth
     *
     * @remarks
     * - This method fetches the user object from the database instead of local session.
     * - This method is useful for checking if the user is authorized because it validates the user's access token JWT on the server.
     * - Should always be used when checking for user authorization on the server. On the client, you can instead use `getSession().session.user` for faster results. `getSession` is insecure on the server.
     *
     * @example Get the logged in user with the current existing session
     * ```js
     * const { data: { user } } = await supabase.auth.getUser()
     * ```
     *
     * @exampleResponse Get the logged in user with the current existing session
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmed_at": "2024-01-01T00:00:00Z",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {
     *         "email": "example@email.com",
     *         "email_verified": false,
     *         "phone_verified": false,
     *         "sub": "11111111-1111-1111-1111-111111111111"
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Get the logged in user with a custom access token jwt
     * ```js
     * const { data: { user } } = await supabase.auth.getUser(jwt)
     * ```
     */
    async getUser(jwt) {
      if (jwt) {
        return await this._getUser(jwt);
      }
      await this.initializePromise;
      let result;
      if (this.lock != null) {
        result = await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._getUser();
        });
      } else {
        result = await this._getUser();
      }
      if (result.data.user) {
        this.suppressGetSessionWarning = true;
      }
      return result;
    }
    async _getUser(jwt) {
      try {
        if (jwt) {
          return await _request(this.fetch, "GET", `${this.url}/user`, {
            headers: this.headers,
            jwt,
            xform: _userResponse
          });
        }
        return await this._useSession(async (result) => {
          var _a, _b, _c;
          const { data, error } = result;
          if (error) {
            throw error;
          }
          if (!((_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) && !this.hasCustomAuthorizationHeader) {
            return { data: { user: null }, error: new AuthSessionMissingError() };
          }
          return await _request(this.fetch, "GET", `${this.url}/user`, {
            headers: this.headers,
            jwt: (_c = (_b = data.session) === null || _b === void 0 ? void 0 : _b.access_token) !== null && _c !== void 0 ? _c : void 0,
            xform: _userResponse
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          if (isAuthSessionMissingError(error)) {
            await this._removeSession();
          }
          return this._returnResult({ data: { user: null }, error });
        }
        throw error;
      }
    }
    /**
     * Updates user data for a logged in user.
     *
     * @category Auth
     *
     * @remarks
     * - In order to use the `updateUser()` method, the user needs to be signed in first.
     * - By default, email updates sends a confirmation link to both the user's current and new email.
     * To only send a confirmation link to the user's new email, disable **Secure email change** in your project's [email auth provider settings](/dashboard/project/_/auth/providers).
     *
     * @exampleDescription Update the email for an authenticated user
     * Sends a "Confirm Email Change" email to the new address. If **Secure Email Change** is enabled (default), confirmation is also required from the **old email** before the change is applied. To skip dual confirmation and apply the change after only the new email is verified, disable **Secure Email Change** in the [Email Auth Provider settings](/dashboard/project/_/auth/providers?provider=Email).
     *
     * @example Update the email for an authenticated user
     * ```js
     * const { data, error } = await supabase.auth.updateUser({
     *   email: 'new@email.com'
     * })
     * ```
     *
     * @exampleResponse Update the email for an authenticated user
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmed_at": "2024-01-01T00:00:00Z",
     *       "new_email": "new@email.com",
     *       "email_change_sent_at": "2024-01-01T00:00:00Z",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {
     *         "email": "example@email.com",
     *         "email_verified": false,
     *         "phone_verified": false,
     *         "sub": "11111111-1111-1111-1111-111111111111"
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @exampleDescription Update the phone number for an authenticated user
     * Sends a one-time password (OTP) to the new phone number.
     *
     * @example Update the phone number for an authenticated user
     * ```js
     * const { data, error } = await supabase.auth.updateUser({
     *   phone: '123456789'
     * })
     * ```
     *
     * @example Update the password for an authenticated user
     * ```js
     * const { data, error } = await supabase.auth.updateUser({
     *   password: 'new password'
     * })
     * ```
     *
     * @exampleDescription Update the user's metadata
     * Updates the user's custom metadata.
     *
     * **Note**: The `data` field maps to the `auth.users.raw_user_meta_data` column in your Supabase database. When calling `getUser()`, the data will be available as `user.user_metadata`.
     *
     * @example Update the user's metadata
     * ```js
     * const { data, error } = await supabase.auth.updateUser({
     *   data: { hello: 'world' }
     * })
     * ```
     *
     * @exampleDescription Update the user's password with a nonce
     * If **Secure password change** is enabled in your [project's email provider settings](/dashboard/project/_/auth/providers), updating the user's password would require a nonce if the user **hasn't recently signed in**. The nonce is sent to the user's email or phone number. A user is deemed recently signed in if the session was created in the last 24 hours.
     *
     * @example Update the user's password with a nonce
     * ```js
     * const { data, error } = await supabase.auth.updateUser({
     *   password: 'new password',
     *   nonce: '123456'
     * })
     * ```
     */
    async updateUser(attributes, options2 = {}) {
      await this.initializePromise;
      if (this.lock != null) {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._updateUser(attributes, options2);
        });
      }
      return await this._updateUser(attributes, options2);
    }
    async _updateUser(attributes, options2 = {}) {
      let flowId = null;
      try {
        return await this._useSession(async (result) => {
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            throw sessionError;
          }
          if (!sessionData.session) {
            throw new AuthSessionMissingError();
          }
          const session = sessionData.session;
          let codeChallenge = null;
          let codeChallengeMethod = null;
          if (this.flowType === "pkce" && attributes.email != null) {
            ;
            [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
          }
          const { data, error: userError } = await _request(this.fetch, "PUT", `${this.url}/user`, {
            headers: this.headers,
            redirectTo: this._maybeAppendFlowIdToRedirect(options2 === null || options2 === void 0 ? void 0 : options2.emailRedirectTo, flowId),
            body: Object.assign(Object.assign({}, attributes), { code_challenge: codeChallenge, code_challenge_method: codeChallengeMethod }),
            jwt: session.access_token,
            xform: _userResponse
          });
          if (userError) {
            throw userError;
          }
          session.user = data.user;
          await this._saveSession(session);
          await this._notifyAllSubscribers("USER_UPDATED", session);
          return this._returnResult({ data: { user: session.user }, error: null });
        });
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null }, error });
        }
        throw error;
      }
    }
    /**
     * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
     * If the refresh token or access token in the current session is invalid, an error will be thrown.
     * @param currentSession The current session that minimally contains an access token and refresh token.
     *
     * @category Auth
     *
     * @remarks
     * - This method sets the session using an `access_token` and `refresh_token`.
     * - If successful, a `SIGNED_IN` event is emitted.
     *
     * @exampleDescription Set the session
     * Sets the session data from an access_token and refresh_token, then returns an auth response or error.
     *
     * @example Set the session
     * ```js
     *   const { data, error } = await supabase.auth.setSession({
     *     access_token,
     *     refresh_token
     *   })
     * ```
     *
     * @exampleResponse Set the session
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmed_at": "2024-01-01T00:00:00Z",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {
     *         "email": "example@email.com",
     *         "email_verified": false,
     *         "phone_verified": false,
     *         "sub": "11111111-1111-1111-1111-111111111111"
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "example@email.com",
     *         "email_confirmed_at": "2024-01-01T00:00:00Z",
     *         "phone": "",
     *         "confirmed_at": "2024-01-01T00:00:00Z",
     *         "last_sign_in_at": "11111111-1111-1111-1111-111111111111",
     *         "app_metadata": {
     *           "provider": "email",
     *           "providers": [
     *             "email"
     *           ]
     *         },
     *         "user_metadata": {
     *           "email": "example@email.com",
     *           "email_verified": false,
     *           "phone_verified": false,
     *           "sub": "11111111-1111-1111-1111-111111111111"
     *         },
     *         "identities": [
     *           {
     *             "identity_id": "2024-01-01T00:00:00Z",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *         "is_anonymous": false
     *       },
     *       "token_type": "bearer",
     *       "expires_in": 3500,
     *       "expires_at": 1700000000
     *     }
     *   },
     *   "error": null
     * }
     * ```
     */
    async setSession(currentSession) {
      await this.initializePromise;
      if (this.lock != null) {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._setSession(currentSession);
        });
      }
      return await this._setSession(currentSession);
    }
    async _setSession(currentSession) {
      try {
        if (!currentSession.access_token || !currentSession.refresh_token) {
          throw new AuthSessionMissingError();
        }
        const timeNow = Date.now() / 1e3;
        let expiresAt2 = timeNow;
        let hasExpired = true;
        let session = null;
        const { payload } = decodeJWT(currentSession.access_token);
        if (payload.exp) {
          expiresAt2 = payload.exp;
          hasExpired = expiresAt2 <= timeNow;
        }
        if (hasExpired) {
          const { data: refreshedSession, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          if (!refreshedSession) {
            return { data: { user: null, session: null }, error: null };
          }
          session = refreshedSession;
        } else {
          const { data, error } = await this._getUser(currentSession.access_token);
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          session = {
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
            user: data.user,
            token_type: "bearer",
            expires_in: expiresAt2 - timeNow,
            expires_at: expiresAt2
          };
          await this._saveSession(session);
          await this._notifyAllSubscribers("SIGNED_IN", session);
        }
        return this._returnResult({ data: { user: session.user, session }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { session: null, user: null }, error });
        }
        throw error;
      }
    }
    /**
     * Returns a new session, regardless of expiry status.
     * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
     * If the current session's refresh token is invalid, an error will be thrown.
     * @param currentSession The current session. If passed in, it must contain a refresh token.
     *
     * @category Auth
     *
     * @remarks
     * - This method will refresh and return a new session whether the current one is expired or not.
     *
     * @example Refresh session using the current session
     * ```js
     * const { data, error } = await supabase.auth.refreshSession()
     * const { session, user } = data
     * ```
     *
     * @exampleResponse Refresh session using the current session
     * ```json
     * {
     *   "data": {
     *     "user": {
     *       "id": "11111111-1111-1111-1111-111111111111",
     *       "aud": "authenticated",
     *       "role": "authenticated",
     *       "email": "example@email.com",
     *       "email_confirmed_at": "2024-01-01T00:00:00Z",
     *       "phone": "",
     *       "confirmed_at": "2024-01-01T00:00:00Z",
     *       "last_sign_in_at": "2024-01-01T00:00:00Z",
     *       "app_metadata": {
     *         "provider": "email",
     *         "providers": [
     *           "email"
     *         ]
     *       },
     *       "user_metadata": {
     *         "email": "example@email.com",
     *         "email_verified": false,
     *         "phone_verified": false,
     *         "sub": "11111111-1111-1111-1111-111111111111"
     *       },
     *       "identities": [
     *         {
     *           "identity_id": "22222222-2222-2222-2222-222222222222",
     *           "id": "11111111-1111-1111-1111-111111111111",
     *           "user_id": "11111111-1111-1111-1111-111111111111",
     *           "identity_data": {
     *             "email": "example@email.com",
     *             "email_verified": false,
     *             "phone_verified": false,
     *             "sub": "11111111-1111-1111-1111-111111111111"
     *           },
     *           "provider": "email",
     *           "last_sign_in_at": "2024-01-01T00:00:00Z",
     *           "created_at": "2024-01-01T00:00:00Z",
     *           "updated_at": "2024-01-01T00:00:00Z",
     *           "email": "example@email.com"
     *         }
     *       ],
     *       "created_at": "2024-01-01T00:00:00Z",
     *       "updated_at": "2024-01-01T00:00:00Z",
     *       "is_anonymous": false
     *     },
     *     "session": {
     *       "access_token": "<ACCESS_TOKEN>",
     *       "token_type": "bearer",
     *       "expires_in": 3600,
     *       "expires_at": 1700000000,
     *       "refresh_token": "<REFRESH_TOKEN>",
     *       "user": {
     *         "id": "11111111-1111-1111-1111-111111111111",
     *         "aud": "authenticated",
     *         "role": "authenticated",
     *         "email": "example@email.com",
     *         "email_confirmed_at": "2024-01-01T00:00:00Z",
     *         "phone": "",
     *         "confirmed_at": "2024-01-01T00:00:00Z",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "app_metadata": {
     *           "provider": "email",
     *           "providers": [
     *             "email"
     *           ]
     *         },
     *         "user_metadata": {
     *           "email": "example@email.com",
     *           "email_verified": false,
     *           "phone_verified": false,
     *           "sub": "11111111-1111-1111-1111-111111111111"
     *         },
     *         "identities": [
     *           {
     *             "identity_id": "22222222-2222-2222-2222-222222222222",
     *             "id": "11111111-1111-1111-1111-111111111111",
     *             "user_id": "11111111-1111-1111-1111-111111111111",
     *             "identity_data": {
     *               "email": "example@email.com",
     *               "email_verified": false,
     *               "phone_verified": false,
     *               "sub": "11111111-1111-1111-1111-111111111111"
     *             },
     *             "provider": "email",
     *             "last_sign_in_at": "2024-01-01T00:00:00Z",
     *             "created_at": "2024-01-01T00:00:00Z",
     *             "updated_at": "2024-01-01T00:00:00Z",
     *             "email": "example@email.com"
     *           }
     *         ],
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *         "is_anonymous": false
     *       }
     *     }
     *   },
     *   "error": null
     * }
     * ```
     *
     * @example Refresh session using a refresh token
     * ```js
     * const { data, error } = await supabase.auth.refreshSession({ refresh_token })
     * const { session, user } = data
     * ```
     */
    async refreshSession(currentSession) {
      await this.initializePromise;
      if (this.lock != null) {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._refreshSession(currentSession);
        });
      }
      return await this._refreshSession(currentSession);
    }
    async _refreshSession(currentSession) {
      try {
        return await this._useSession(async (result) => {
          var _a;
          if (!currentSession) {
            const { data, error: error2 } = result;
            if (error2) {
              throw error2;
            }
            currentSession = (_a = data.session) !== null && _a !== void 0 ? _a : void 0;
          }
          if (!(currentSession === null || currentSession === void 0 ? void 0 : currentSession.refresh_token)) {
            throw new AuthSessionMissingError();
          }
          const { data: session, error } = await this._callRefreshToken(currentSession.refresh_token);
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          if (!session) {
            return this._returnResult({ data: { user: null, session: null }, error: null });
          }
          return this._returnResult({ data: { user: session.user, session }, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { user: null, session: null }, error });
        }
        throw error;
      }
    }
    /**
     * Gets the session data from a URL string
     */
    async _getSessionFromURL(params, callbackUrlType) {
      var _a;
      try {
        if (!isBrowser())
          throw new AuthImplicitGrantRedirectError("No browser detected.");
        if (params.error || params.error_description || params.error_code) {
          throw new AuthImplicitGrantRedirectError(params.error_description || "Error in URL with unspecified error_description", {
            error: params.error || "unspecified_error",
            code: params.error_code || "unspecified_code"
          });
        }
        switch (callbackUrlType) {
          case "implicit":
            if (this.flowType === "pkce") {
              throw new AuthPKCEGrantCodeExchangeError("Not a valid PKCE flow url.");
            }
            break;
          case "pkce":
            if (this.flowType === "implicit") {
              throw new AuthImplicitGrantRedirectError("Not a valid implicit grant flow url.");
            }
            break;
          default:
        }
        if (callbackUrlType === "pkce") {
          this._debug("#_initialize()", "begin", "is PKCE flow", true);
          if (!params.code)
            throw new AuthPKCEGrantCodeExchangeError("No code detected.");
          const { data: data2, error: error2 } = await this._exchangeCodeForSession(params.code, {
            flowId: params[PKCE_FLOW_ID_PARAM]
          });
          if (error2)
            throw error2;
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          url.searchParams.delete(PKCE_FLOW_ID_PARAM);
          window.history.replaceState(window.history.state, "", url.toString());
          return {
            data: { session: data2.session, redirectType: (_a = data2.redirectType) !== null && _a !== void 0 ? _a : null },
            error: null
          };
        }
        const { provider_token, provider_refresh_token, access_token, refresh_token, expires_in, expires_at, token_type } = params;
        if (!access_token || !expires_in || !refresh_token || !token_type) {
          throw new AuthImplicitGrantRedirectError("No session defined in URL");
        }
        const timeNow = Math.round(Date.now() / 1e3);
        const expiresIn = parseInt(expires_in);
        let expiresAt2 = timeNow + expiresIn;
        if (expires_at) {
          expiresAt2 = parseInt(expires_at);
        }
        const actuallyExpiresIn = expiresAt2 - timeNow;
        if (actuallyExpiresIn * 1e3 <= AUTO_REFRESH_TICK_DURATION_MS) {
          console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${actuallyExpiresIn}s, should have been closer to ${expiresIn}s`);
        }
        const issuedAt = expiresAt2 - expiresIn;
        if (timeNow - issuedAt >= 120) {
          console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", issuedAt, expiresAt2, timeNow);
        } else if (timeNow - issuedAt < 0) {
          console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", issuedAt, expiresAt2, timeNow);
        }
        const { data, error } = await this._getUser(access_token);
        if (error)
          throw error;
        const session = {
          provider_token,
          provider_refresh_token,
          access_token,
          expires_in: expiresIn,
          expires_at: expiresAt2,
          refresh_token,
          token_type,
          user: data.user
        };
        window.location.hash = "";
        this._debug("#_getSessionFromURL()", "clearing window.location.hash");
        return this._returnResult({ data: { session, redirectType: params.type }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: { session: null, redirectType: null }, error });
        }
        throw error;
      }
    }
    /**
     * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
     *
     * If `detectSessionInUrl` is a function, it will be called with the URL and params to determine
     * if the URL should be processed as a Supabase auth callback. This allows users to exclude
     * URLs from other OAuth providers (e.g., Facebook Login) that also return access_token in the fragment.
     */
    _isImplicitGrantCallback(params) {
      if (typeof this.detectSessionInUrl === "function") {
        return this.detectSessionInUrl(new URL(window.location.href), params);
      }
      return Boolean(params.access_token || params.error || params.error_description || params.error_code);
    }
    /**
     * Checks if the current URL and backing storage contain parameters given by a PKCE flow
     */
    async _isPKCECallback(params) {
      if (!params.code) {
        return false;
      }
      const flowId = validatePKCEFlowId(params[PKCE_FLOW_ID_PARAM]);
      if (flowId && await getItemAsync(this.storage, pkceVerifierSlotKey(this.storageKey, flowId))) {
        return true;
      }
      const currentStorageContent = await getItemAsync(this.storage, `${this.storageKey}-code-verifier`);
      return !!currentStorageContent;
    }
    /**
     * Inside a browser context, `signOut()` will remove the logged in user from the browser session
     * and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"`
     * event.
     *
     * For server-side management, you can revoke all refresh tokens for a user by passing a user's
     * JWT through to `auth.api.signOut(JWT: string)`.
     *
     * There is no way to revoke a user's access token jwt until it expires. It is recommended to set
     * a shorter expiry on the jwt for this reason.
     *
     * `signOut` behavior depends on the selected scope:
     *
     * - `local`: The local session is removed first and a `SIGNED_OUT` event is fired, then the client
     *   makes a best-effort request to revoke the refresh token on the server. If the request fails,
     *   the client is still signed out locally and the error is returned, but the server may retain
     *   the refresh token until it expires.
     *
     * - `global`: All of the user's sessions are first invalidated on the server. Once the server
     *   acknowledges the request, the local session is cleared. If server logout fails, the local
     *   session is retained, no `SIGNED_OUT` event is triggered, and the server or network error is
     *   returned. A 401, 403, or 404 response counts as a successful sign-out.
     *
     * - `others`: All other sessions are invalidated when the server accepts the request; the
     *   current local session remains unchanged. In case of server or network failures, the error is
     *   returned. A `SIGNED_OUT` event is never triggered, regardless of the outcome.
     *
     * **Warning:** the default `scope` is `'global'`. This signs the user out of
     * **every device they are currently signed in on**, not just the current
     * tab/session. If you only want to sign the user out of the current session
     * (the behavior most other auth libraries default to), pass
     * `{ scope: 'local' }` explicitly.
     *
     * @category Auth
     *
     * @remarks
     * - In order to use the `signOut()` method, the user needs to be signed in first.
     * - By default, `signOut()` uses the **global** scope, which signs out the user
     *   on every device they are signed in on (not just the current one). Pass
     *   `{ scope: 'local' }` to only sign out the current session. This is
     *   usually what apps want on a "Sign out" button, especially when users
     *   sign in from multiple devices and do not expect signing out of one to
     *   terminate the others.
     * - With the default `global` scope, `signOut()` while offline returns an error and keeps the user
     *   signed in. To sign out regardless, fall back to `signOut({ scope: 'local' })` when the call
     *   returns an error.
     * - Since Supabase Auth uses JWTs for authentication, the access token JWT will be valid until
     *   it's expired. When the user signs out, Supabase revokes the refresh token and deletes the
     *   JWT from the client-side. This does not revoke the JWT and it will still be valid until it
     *   expires.
     *
     * @example Sign out of every device (global – default)
     * ```js
     * const { error } = await supabase.auth.signOut()
     * ```
     *
     * @example Sign out only the current session (recommended for most apps)
     * ```js
     * const { error } = await supabase.auth.signOut({ scope: 'local' })
     * ```
     *
     * @example Sign out of all other sessions, keep the current one
     * ```js
     * const { error } = await supabase.auth.signOut({ scope: 'others' })
     * ```
     */
    async signOut(options2 = { scope: "global" }) {
      await this.initializePromise;
      if (this.lock != null) {
        return await this._acquireLock(this.lockAcquireTimeout, async () => {
          return await this._signOut(options2);
        });
      }
      return await this._signOut(options2);
    }
    async _signOut({ scope: scope2 = "global" } = {}) {
      return await this._useSession(async (result) => {
        var _a;
        const removeCurrentSession = async () => {
          await this._removeSession();
        };
        const { data, error: sessionError } = result;
        if (sessionError && !isAuthSessionMissingError(sessionError)) {
          if (scope2 === "local" && isAuthRetryableFetchError(sessionError)) {
            await removeCurrentSession();
          }
          return this._returnResult({ error: sessionError });
        }
        const accessToken = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token;
        let removeError = null;
        const finish = (value) => {
          if (removeError) {
            throw removeError.thrown;
          }
          return value;
        };
        if (scope2 === "local") {
          try {
            await removeCurrentSession();
          } catch (thrown) {
            removeError = { thrown };
          }
        }
        if (accessToken) {
          const { error } = await this.admin.signOut(accessToken, scope2);
          if (error && !(isAuthApiError(error) && (error.status === 404 || error.status === 401 || error.status === 403) || isAuthSessionMissingError(error))) {
            return finish(this._returnResult({ error }));
          }
        }
        if (scope2 === "global") {
          await removeCurrentSession();
        }
        return finish(this._returnResult({ error: null }));
      });
    }
    /**  *
     * @category Auth
     *
     * @remarks
     * - Subscribes to important events occurring on the user's session.
     * - Use on the frontend/client. It is less useful on the server.
     * - Events are emitted across tabs to keep your application's UI up-to-date. Some events can fire very frequently, based on the number of tabs open. Use a quick and efficient callback function, and defer or debounce as many operations as you can to be performed outside of the callback.
     * - Callbacks can be `async` and can safely call other Supabase auth methods (`getUser`, `setSession`, etc.) from inside the callback.
     * - Keep callbacks quick. Events are awaited in order, so a slow callback delays subsequent events to subscribers in this tab.
     * - Emitted events:
     *   - `INITIAL_SESSION`
     *     - Emitted right after the Supabase client is constructed and the initial session from storage is loaded.
     *   - `SIGNED_IN`
     *     - Emitted each time a user session is confirmed or re-established, including on user sign in and when refocusing a tab.
     *     - Avoid making assumptions as to when this event is fired, this may occur even when the user is already signed in. Instead, check the user object attached to the event to see if a new user has signed in and update your application's UI.
     *     - This event can fire very frequently depending on the number of tabs open in your application.
     *   - `SIGNED_OUT`
     *     - Emitted when the user signs out. This can be after:
     *       - A call to `supabase.auth.signOut()`.
     *       - After the user's session has expired for any reason:
     *         - User has signed out on another device.
     *         - The session has reached its timebox limit or inactivity timeout.
     *         - User has signed in on another device with single session per user enabled.
     *         - Check the [User Sessions](/docs/guides/auth/sessions) docs for more information.
     *     - Use this to clean up any local storage your application has associated with the user.
     *   - `TOKEN_REFRESHED`
     *     - Emitted each time a new access and refresh token are fetched for the signed in user.
     *     - It's best practice and highly recommended to extract the access token (JWT) and store it in memory for further use in your application.
     *       - Avoid frequent calls to `supabase.auth.getSession()` for the same purpose.
     *     - There is a background process that keeps track of when the session should be refreshed so you will always receive valid tokens by listening to this event.
     *     - The frequency of this event is related to the JWT expiry limit configured on your project.
     *   - `USER_UPDATED`
     *     - Emitted each time the `supabase.auth.updateUser()` method finishes successfully. Listen to it to update your application's UI based on new profile information.
     *   - `PASSWORD_RECOVERY`
     *     - Emitted instead of the `SIGNED_IN` event when the user lands on a page that includes a password recovery link in the URL.
     *     - Use it to show a UI to the user where they can [reset their password](/docs/guides/auth/passwords#resetting-a-users-password-forgot-password).
     *
     * @example Listen to auth changes
     * ```js
     * const { data } = supabase.auth.onAuthStateChange((event, session) => {
     *   console.log(event, session)
     *
     *   if (event === 'INITIAL_SESSION') {
     *     // handle initial session
     *   } else if (event === 'SIGNED_IN') {
     *     // handle sign in event
     *   } else if (event === 'SIGNED_OUT') {
     *     // handle sign out event
     *   } else if (event === 'PASSWORD_RECOVERY') {
     *     // handle password recovery event
     *   } else if (event === 'TOKEN_REFRESHED') {
     *     // handle token refreshed event
     *   } else if (event === 'USER_UPDATED') {
     *     // handle user updated event
     *   }
     * })
     *
     * // call unsubscribe to remove the callback
     * data.subscription.unsubscribe()
     * ```
     *
     * @exampleDescription Listen to sign out
     * Make sure you clear out any local data, such as local and session storage, after the client library has detected the user's sign out.
     *
     * @example Listen to sign out
     * ```js
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (event === 'SIGNED_OUT') {
     *     console.log('SIGNED_OUT', session)
     *
     *     // clear local and session storage
     *     [
     *       window.localStorage,
     *       window.sessionStorage,
     *     ].forEach((storage) => {
     *       Object.entries(storage)
     *         .forEach(([key]) => {
     *           storage.removeItem(key)
     *         })
     *     })
     *   }
     * })
     * ```
     *
     * @exampleDescription Store OAuth provider tokens on sign in
     * When using [OAuth (social sign-in)](/docs/guides/auth/social-sign-in) you sometimes wish to get access to the provider's access token and refresh token, in order to call provider APIs in the name of the user.
     *
     * For example, if you are using [Sign in with Google](/docs/guides/auth/social-sign-in/auth-google) you may want to use the provider token to call Google APIs on behalf of the user. Supabase Auth does not keep track of the provider access and refresh token, but does return them for you once, immediately after sign in. You can use the `onAuthStateChange` method to listen for the presence of the provider tokens and store them in local storage. You can further send them to your server's APIs for use on the backend.
     *
     * Finally, make sure you remove them from local storage on the `SIGNED_OUT` event. If the OAuth provider supports token revocation, make sure you call those APIs either from the frontend or schedule them to be called on the backend.
     *
     * @example Store OAuth provider tokens on sign in
     * ```js
     * // Register this immediately after calling createClient!
     * // Because signInWithOAuth causes a redirect, you need to fetch the
     * // provider tokens from the callback.
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (session && session.provider_token) {
     *     window.localStorage.setItem('oauth_provider_token', session.provider_token)
     *   }
     *
     *   if (session && session.provider_refresh_token) {
     *     window.localStorage.setItem('oauth_provider_refresh_token', session.provider_refresh_token)
     *   }
     *
     *   if (event === 'SIGNED_OUT') {
     *     window.localStorage.removeItem('oauth_provider_token')
     *     window.localStorage.removeItem('oauth_provider_refresh_token')
     *   }
     * })
     * ```
     *
     * @exampleDescription Use React Context for the User's session
     * Instead of relying on `supabase.auth.getSession()` within your React components, you can use a [React Context](https://react.dev/reference/react/createContext) to store the latest session information from the `onAuthStateChange` callback and access it that way.
     *
     * @example Use React Context for the User's session
     * ```js
     * const SessionContext = React.createContext(null)
     *
     * function main() {
     *   const [session, setSession] = React.useState(null)
     *
     *   React.useEffect(() => {
     *     const {data: { subscription }} = supabase.auth.onAuthStateChange(
     *       (event, session) => {
     *         if (event === 'SIGNED_OUT') {
     *           setSession(null)
     *         } else if (session) {
     *           setSession(session)
     *         }
     *       })
     *
     *     return () => {
     *       subscription.unsubscribe()
     *     }
     *   }, [])
     *
     *   return (
     *     <SessionContext.Provider value={session}>
     *       <App />
     *     </SessionContext.Provider>
     *   )
     * }
     * ```
     *
     * @example Listen to password recovery events
     * ```js
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (event === 'PASSWORD_RECOVERY') {
     *     console.log('PASSWORD_RECOVERY', session)
     *     // show screen to update user's password
     *     showPasswordResetScreen(true)
     *   }
     * })
     * ```
     *
     * @example Listen to sign in
     * ```js
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (event === 'SIGNED_IN') console.log('SIGNED_IN', session)
     * })
     * ```
     *
     * @example Listen to token refresh
     * ```js
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (event === 'TOKEN_REFRESHED') console.log('TOKEN_REFRESHED', session)
     * })
     * ```
     *
     * @example Listen to user updates
     * ```js
     * supabase.auth.onAuthStateChange((event, session) => {
     *   if (event === 'USER_UPDATED') console.log('USER_UPDATED', session)
     * })
     * ```
     */
    onAuthStateChange(callback) {
      const id = generateCallbackId();
      const subscription = {
        id,
        callback,
        unsubscribe: () => {
          this._debug("#unsubscribe()", "state change callback with id removed", id);
          this.stateChangeEmitters.delete(id);
        }
      };
      this._debug("#onAuthStateChange()", "registered callback with id", id);
      this.stateChangeEmitters.set(id, subscription);
      (async () => {
        await this.initializePromise;
        if (this.lock != null) {
          await this._acquireLock(this.lockAcquireTimeout, async () => {
            this._emitInitialSession(id);
          });
        } else {
          await this._emitInitialSession(id);
        }
      })();
      return { data: { subscription } };
    }
    async _emitInitialSession(id) {
      return await this._useSession(async (result) => {
        var _a, _b;
        try {
          const { data: { session }, error } = result;
          if (error)
            throw error;
          await ((_a = this.stateChangeEmitters.get(id)) === null || _a === void 0 ? void 0 : _a.callback("INITIAL_SESSION", session));
          this._debug("INITIAL_SESSION", "callback id", id, "session", session);
        } catch (err) {
          await ((_b = this.stateChangeEmitters.get(id)) === null || _b === void 0 ? void 0 : _b.callback("INITIAL_SESSION", null));
          this._debug("INITIAL_SESSION", "callback id", id, "error", err);
          if (isAuthRefreshDiscardedError(err)) {
            return;
          }
          if (isAuthSessionMissingError(err) || isAuthRetryableFetchError(err) || isAuthApiError(err) && (err.code === "refresh_token_not_found" || err.code === "refresh_token_already_used" || err.code === "session_expired")) {
            console.warn(err);
          } else {
            console.error(err);
          }
        }
      });
    }
    /**
     * Sends a password reset request to an email address. This method supports the PKCE flow.
     *
     * @param email The email address of the user.
     * @param options.redirectTo The URL to send the user to after they click the password reset link.
     * @param options.captchaToken Verification token received when the user completes the captcha on the site.
     *
     * @category Auth
     *
     * @remarks
     * - The password reset flow consist of 2 broad steps: (i) Allow the user to login via the password reset link; (ii) Update the user's password.
     * - The `resetPasswordForEmail()` only sends a password reset link to the user's email.
     * To update the user's password, see [`updateUser()`](/docs/reference/javascript/auth-updateuser).
     * - A `PASSWORD_RECOVERY` event will be emitted when the password recovery link is clicked.
     * You can use [`onAuthStateChange()`](/docs/reference/javascript/auth-onauthstatechange) to listen and invoke a callback function on these events.
     * - When the user clicks the reset link in the email they are redirected back to your application.
     * You can configure the URL that the user is redirected to with the `redirectTo` parameter.
     * See [redirect URLs and wildcards](/docs/guides/auth/redirect-urls#use-wildcards-in-redirect-urls) to add additional redirect URLs to your project.
     * - After the user has been redirected successfully, prompt them for a new password and call `updateUser()`:
     * ```js
     * const { data, error } = await supabase.auth.updateUser({
     *   password: new_password
     * })
     * ```
     *
     * @example Reset password
     * ```js
     * const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
     *   redirectTo: 'https://example.com/update-password',
     * })
     * ```
     *
     * @exampleResponse Reset password
     * ```json
     * {
     *   data: {}
     *   error: null
     * }
     * ```
     *
     * @example Reset password (React)
     * ```js
     * /**
     *  * Step 1: Send the user an email to get a password reset token.
     *  * This email contains a link which sends the user back to your application.
     *  *\/
     * const { data, error } = await supabase.auth
     *   .resetPasswordForEmail('user@email.com')
     *
     * /**
     *  * Step 2: Once the user is redirected back to your application,
     *  * ask the user to reset their password.
     *  *\/
     *  useEffect(() => {
     *    supabase.auth.onAuthStateChange(async (event, session) => {
     *      if (event == "PASSWORD_RECOVERY") {
     *        const newPassword = prompt("What would you like your new password to be?");
     *        const { data, error } = await supabase.auth
     *          .updateUser({ password: newPassword })
     *
     *        if (data) alert("Password updated successfully!")
     *        if (error) alert("There was an error updating your password.")
     *      }
     *    })
     *  }, [])
     * ```
     */
    async resetPasswordForEmail(email, options2 = {}) {
      let codeChallenge = null;
      let codeChallengeMethod = null;
      let flowId = null;
      if (this.flowType === "pkce") {
        ;
        [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod(
          true
          // isPasswordRecovery
        );
      }
      try {
        return await _request(this.fetch, "POST", `${this.url}/recover`, {
          body: {
            email,
            code_challenge: codeChallenge,
            code_challenge_method: codeChallengeMethod,
            gotrue_meta_security: { captcha_token: options2.captchaToken }
          },
          headers: this.headers,
          redirectTo: this._maybeAppendFlowIdToRedirect(options2.redirectTo, flowId)
        });
      } catch (error) {
        await removePKCEVerifier(this.storage, this.storageKey, flowId);
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Gets all the identities linked to a user.
     *
     * @category Auth
     *
     * @remarks
     * - The user needs to be signed in to call `getUserIdentities()`.
     *
     * @example Returns a list of identities linked to the user
     * ```js
     * const { data, error } = await supabase.auth.getUserIdentities()
     * ```
     *
     * @exampleResponse Returns a list of identities linked to the user
     * ```json
     * {
     *   "data": {
     *     "identities": [
     *       {
     *         "identity_id": "22222222-2222-2222-2222-222222222222",
     *         "id": "2024-01-01T00:00:00Z",
     *         "user_id": "2024-01-01T00:00:00Z",
     *         "identity_data": {
     *           "email": "example@email.com",
     *           "email_verified": false,
     *           "phone_verified": false,
     *           "sub": "11111111-1111-1111-1111-111111111111"
     *         },
     *         "provider": "email",
     *         "last_sign_in_at": "2024-01-01T00:00:00Z",
     *         "created_at": "2024-01-01T00:00:00Z",
     *         "updated_at": "2024-01-01T00:00:00Z",
     *         "email": "example@email.com"
     *       }
     *     ]
     *   },
     *   "error": null
     * }
     * ```
     */
    async getUserIdentities() {
      var _a;
      try {
        const { data, error } = await this.getUser();
        if (error)
          throw error;
        return this._returnResult({ data: { identities: (_a = data.user.identities) !== null && _a !== void 0 ? _a : [] }, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**  *
     * @category Auth
     *
     * @remarks
     * - The **Enable Manual Linking** option must be enabled from your [project's authentication settings](/dashboard/project/_/auth/providers).
     * - The user needs to be signed in to call `linkIdentity()`.
     * - If the candidate identity is already linked to the existing user or another user, `linkIdentity()` will fail.
     * - If `linkIdentity` is run in the browser, the user is automatically redirected to the returned URL. On the server, you should handle the redirect.
     *
     * @example Link an identity to a user
     * ```js
     * const { data, error } = await supabase.auth.linkIdentity({
     *   provider: 'github'
     * })
     * ```
     *
     * @exampleResponse Link an identity to a user
     * ```json
     * {
     *   data: {
     *     provider: 'github',
     *     url: <PROVIDER_URL_TO_REDIRECT_TO>,
     *     flowId: <PKCE_FLOW_ID_OR_NULL>
     *   },
     *   error: null
     * }
     * ```
     */
    async linkIdentity(credentials) {
      if ("token" in credentials) {
        return this.linkIdentityIdToken(credentials);
      }
      return this.linkIdentityOAuth(credentials);
    }
    async linkIdentityOAuth(credentials) {
      var _a;
      let flowId = null;
      try {
        const { data, error } = await this._useSession(async (result) => {
          var _a2, _b, _c, _d, _f;
          const { data: data2, error: error2 } = result;
          if (error2)
            throw error2;
          const { url, flowId: urlFlowId } = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, credentials.provider, {
            redirectTo: (_a2 = credentials.options) === null || _a2 === void 0 ? void 0 : _a2.redirectTo,
            scopes: (_b = credentials.options) === null || _b === void 0 ? void 0 : _b.scopes,
            queryParams: (_c = credentials.options) === null || _c === void 0 ? void 0 : _c.queryParams,
            skipBrowserRedirect: true
          });
          flowId = urlFlowId;
          return await _request(this.fetch, "GET", url, {
            headers: this.headers,
            jwt: (_f = (_d = data2.session) === null || _d === void 0 ? void 0 : _d.access_token) !== null && _f !== void 0 ? _f : void 0
          });
        });
        if (error)
          throw error;
        if (isBrowser() && !((_a = credentials.options) === null || _a === void 0 ? void 0 : _a.skipBrowserRedirect)) {
          window.location.assign(data === null || data === void 0 ? void 0 : data.url);
        }
        return this._returnResult({
          data: { provider: credentials.provider, url: data === null || data === void 0 ? void 0 : data.url, flowId },
          error: null
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({
            data: { provider: credentials.provider, url: null, flowId },
            error
          });
        }
        throw error;
      }
    }
    async linkIdentityIdToken(credentials) {
      return await this._useSession(async (result) => {
        var _a;
        try {
          const { error: sessionError, data: { session } } = result;
          if (sessionError)
            throw sessionError;
          const { options: options2, provider, token, access_token, nonce } = credentials;
          const res = await _request(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
            headers: this.headers,
            jwt: (_a = session === null || session === void 0 ? void 0 : session.access_token) !== null && _a !== void 0 ? _a : void 0,
            body: {
              provider,
              id_token: token,
              access_token,
              nonce,
              link_identity: true,
              gotrue_meta_security: { captcha_token: options2 === null || options2 === void 0 ? void 0 : options2.captchaToken }
            },
            xform: _sessionResponse
          });
          const { data, error } = res;
          if (error) {
            return this._returnResult({ data: { user: null, session: null }, error });
          } else if (!data || !data.session || !data.user) {
            return this._returnResult({
              data: { user: null, session: null },
              error: new AuthInvalidTokenResponseError()
            });
          }
          if (data.session) {
            await this._saveSession(data.session);
            await this._notifyAllSubscribers("USER_UPDATED", data.session);
          }
          return this._returnResult({ data, error });
        } catch (error) {
          await removePKCEVerifier(this.storage, this.storageKey, null);
          if (isAuthError(error)) {
            return this._returnResult({ data: { user: null, session: null }, error });
          }
          throw error;
        }
      });
    }
    /**
     * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
     *
     * @category Auth
     *
     * @remarks
     * - The **Enable Manual Linking** option must be enabled from your [project's authentication settings](/dashboard/project/_/auth/providers).
     * - The user needs to be signed in to call `unlinkIdentity()`.
     * - The user must have at least 2 identities in order to unlink an identity.
     * - The identity to be unlinked must belong to the user.
     *
     * @example Unlink an identity
     * ```js
     * // retrieve all identities linked to a user
     * const identities = await supabase.auth.getUserIdentities()
     *
     * // find the google identity
     * const googleIdentity = identities.find(
     *   identity => identity.provider === 'google'
     * )
     *
     * // unlink the google identity
     * const { error } = await supabase.auth.unlinkIdentity(googleIdentity)
     * ```
     */
    async unlinkIdentity(identity) {
      try {
        return await this._useSession(async (result) => {
          var _a, _b;
          const { data, error } = result;
          if (error) {
            throw error;
          }
          return await _request(this.fetch, "DELETE", `${this.url}/user/identities/${identity.identity_id}`, {
            headers: this.headers,
            jwt: (_b = (_a = data.session) === null || _a === void 0 ? void 0 : _a.access_token) !== null && _b !== void 0 ? _b : void 0
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Generates a new JWT.
     * @param refreshToken A valid refresh token that was returned on login.
     */
    async _refreshAccessToken(refreshToken) {
      const debugName = `#_refreshAccessToken()`;
      this._debug(debugName, "begin");
      try {
        const startedAt = Date.now();
        return await retryable(async (attempt) => {
          if (attempt > 0) {
            await sleep2(200 * Math.pow(2, attempt - 1));
          }
          this._debug(debugName, "refreshing attempt", attempt);
          return await _request(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
            body: { refresh_token: refreshToken },
            headers: this.headers,
            xform: _sessionResponse
          });
        }, (attempt, error) => {
          const nextBackOffInterval = 200 * Math.pow(2, attempt);
          return error && isAuthRetryableFetchError(error) && // retryable only if the request can be sent before the backoff overflows the tick duration
          Date.now() + nextBackOffInterval - startedAt < AUTO_REFRESH_TICK_DURATION_MS;
        });
      } catch (error) {
        this._debug(debugName, "error", error);
        if (isAuthError(error)) {
          return this._returnResult({ data: { session: null, user: null }, error });
        }
        throw error;
      } finally {
        this._debug(debugName, "end");
      }
    }
    _isValidSession(maybeSession) {
      const isValidSession = typeof maybeSession === "object" && maybeSession !== null && "access_token" in maybeSession && "refresh_token" in maybeSession && "expires_at" in maybeSession;
      return isValidSession;
    }
    async _handleProviderSignIn(provider, options2) {
      const { url, flowId } = await this._getUrlForProvider(`${this.url}/authorize`, provider, {
        redirectTo: options2.redirectTo,
        scopes: options2.scopes,
        queryParams: options2.queryParams
      });
      this._debug("#_handleProviderSignIn()", "provider", provider, "options", options2, "url", url);
      if (isBrowser() && !options2.skipBrowserRedirect) {
        window.location.assign(url);
      }
      return { data: { provider, url, flowId }, error: null };
    }
    /**
     * Recovers the session from LocalStorage and refreshes the token
     * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
     */
    async _recoverAndRefresh() {
      var _a, _b;
      const debugName = "#_recoverAndRefresh()";
      this._debug(debugName, "begin");
      try {
        const currentSession = await getItemAsync(this.storage, this.storageKey);
        if (currentSession && this.userStorage) {
          let maybeUser = await getItemAsync(this.userStorage, this.storageKey + "-user");
          if (!this.storage.isServer && Object.is(this.storage, this.userStorage) && !maybeUser) {
            maybeUser = { user: currentSession.user };
            await setItemAsync(this.userStorage, this.storageKey + "-user", maybeUser);
          }
          currentSession.user = (_a = maybeUser === null || maybeUser === void 0 ? void 0 : maybeUser.user) !== null && _a !== void 0 ? _a : userNotAvailableProxy();
        } else if (currentSession && !currentSession.user) {
          if (!currentSession.user) {
            const separateUser = await getItemAsync(this.storage, this.storageKey + "-user");
            if (separateUser && (separateUser === null || separateUser === void 0 ? void 0 : separateUser.user)) {
              currentSession.user = separateUser.user;
              await removeItemAsync(this.storage, this.storageKey + "-user");
              await setItemAsync(this.storage, this.storageKey, currentSession);
            } else {
              currentSession.user = userNotAvailableProxy();
            }
          }
        }
        this._debug(debugName, "session from storage", currentSession);
        if (!this._isValidSession(currentSession)) {
          this._debug(debugName, "session is not valid");
          if (currentSession !== null) {
            await this._removeSession();
          }
          return;
        }
        const expiresWithMargin = ((_b = currentSession.expires_at) !== null && _b !== void 0 ? _b : Infinity) * 1e3 - Date.now() < EXPIRY_MARGIN_MS;
        this._debug(debugName, `session has${expiresWithMargin ? "" : " not"} expired with margin of ${EXPIRY_MARGIN_MS}s`);
        if (expiresWithMargin) {
          if (this.autoRefreshToken && currentSession.refresh_token) {
            const { error } = await this._callRefreshToken(currentSession.refresh_token);
            if (error) {
              if (isAuthRefreshDiscardedError(error)) {
                this._debug(debugName, "refresh discarded by commit guard", error);
              } else {
                this._debug(debugName, "refresh failed", error);
              }
            }
          }
        } else if (currentSession.user && currentSession.user.__isUserNotAvailableProxy === true) {
          try {
            const { data, error: userError } = await this._getUser(currentSession.access_token);
            if (!userError && (data === null || data === void 0 ? void 0 : data.user)) {
              currentSession.user = data.user;
              await this._saveSession(currentSession);
              await this._notifyAllSubscribers("SIGNED_IN", currentSession);
            } else {
              this._debug(debugName, "could not get user data, skipping SIGNED_IN notification");
            }
          } catch (getUserError) {
            console.error("Error getting user data:", getUserError);
            this._debug(debugName, "error getting user data, skipping SIGNED_IN notification", getUserError);
          }
        } else {
          await this._notifyAllSubscribers("SIGNED_IN", currentSession);
        }
      } catch (err) {
        this._debug(debugName, "error", err);
        if (isAuthRetryableFetchError(err)) {
          console.warn(err);
        } else {
          console.error(err);
        }
        return;
      } finally {
        this._debug(debugName, "end");
      }
    }
    async _callRefreshToken(refreshToken) {
      var _a, _b;
      if (!refreshToken) {
        throw new AuthSessionMissingError();
      }
      if (this.refreshingDeferred) {
        return this.refreshingDeferred.promise;
      }
      if (this.lastRefreshFailure && this.lastRefreshFailure.refreshToken === refreshToken && Date.now() < this.lastRefreshFailure.expiresAt) {
        this._debug("#_callRefreshToken()", "returning cached failure (cooldown active)");
        return this.lastRefreshFailure.result;
      }
      const debugName = `#_callRefreshToken()`;
      this._debug(debugName, "begin");
      try {
        this.refreshingDeferred = new Deferred();
        this.refreshingDeferred.promise.then(void 0, () => {
        });
        const storedAtStart = await getItemAsync(this.storage, this.storageKey);
        const { data, error } = await this._refreshAccessToken(refreshToken);
        if (error)
          throw error;
        if (!data.session)
          throw new AuthSessionMissingError();
        const storedAfter = await getItemAsync(this.storage, this.storageKey);
        const storageChangedUnderUs = storedAtStart !== null && (storedAfter === null || storedAfter.refresh_token !== storedAtStart.refresh_token);
        if (storageChangedUnderUs) {
          this._debug(debugName, "commit guard: storage changed since refresh started, discarding rotated tokens", {
            // Presence indicators only — never log refresh token fragments,
            // even partial. Logs may be forwarded to third-party services.
            startedWith: "present",
            nowHolds: storedAfter ? "replaced" : "cleared"
          });
          const discarded = {
            data: null,
            error: new AuthRefreshDiscardedError()
          };
          this.refreshingDeferred.resolve(discarded);
          return discarded;
        }
        const epochBeforeSave = this._sessionRemovalEpoch;
        await this._saveSession(data.session);
        if (this._sessionRemovalEpoch !== epochBeforeSave) {
          this._debug(debugName, "commit guard (post-save): _removeSession ran during _saveSession, undoing write");
          await removeItemAsync(this.storage, this.storageKey);
          if (this.userStorage) {
            await removeItemAsync(this.userStorage, this.storageKey + "-user");
          }
          const discarded = {
            data: null,
            error: new AuthRefreshDiscardedError()
          };
          this.refreshingDeferred.resolve(discarded);
          return discarded;
        }
        await this._notifyAllSubscribers("TOKEN_REFRESHED", data.session);
        const result = { data: data.session, error: null };
        this.lastRefreshFailure = null;
        this.refreshingDeferred.resolve(result);
        return result;
      } catch (error) {
        this._debug(debugName, "error", error);
        if (isAuthError(error)) {
          const result = { data: null, error };
          if (!isAuthRetryableFetchError(error)) {
            const storedNow = await getItemAsync(this.storage, this.storageKey);
            const accessTokenStillValid = !!((storedNow === null || storedNow === void 0 ? void 0 : storedNow.expires_at) && storedNow.expires_at * 1e3 > Date.now());
            if (accessTokenStillValid) {
              this._debug(debugName, "proactive refresh failed, access token still valid \u2014 preserving session");
            } else {
              await this._removeSession();
            }
          }
          this.lastRefreshFailure = {
            refreshToken,
            result,
            expiresAt: Date.now() + REFRESH_FAILURE_COOLDOWN_MS
          };
          (_a = this.refreshingDeferred) === null || _a === void 0 ? void 0 : _a.resolve(result);
          return result;
        }
        (_b = this.refreshingDeferred) === null || _b === void 0 ? void 0 : _b.reject(error);
        throw error;
      } finally {
        this.refreshingDeferred = null;
        this._debug(debugName, "end");
      }
    }
    async _notifyAllSubscribers(event, session, broadcast = true) {
      if (this._pendingInitNotifications !== null && broadcast) {
        this._pendingInitNotifications.push({ event, session, broadcast });
        return;
      }
      const debugName = `#_notifyAllSubscribers(${event})`;
      this._debug(debugName, "begin", session, `broadcast = ${broadcast}`);
      try {
        if (this.broadcastChannel && broadcast) {
          this.broadcastChannel.postMessage({ event, session });
        }
        const errors = [];
        const promises = Array.from(this.stateChangeEmitters.values()).map(async (x) => {
          try {
            await x.callback(event, session);
          } catch (e) {
            errors.push(e);
          }
        });
        await Promise.all(promises);
        if (errors.length > 0) {
          for (let i = 0; i < errors.length; i += 1) {
            console.error(errors[i]);
          }
          throw errors[0];
        }
      } finally {
        this._debug(debugName, "end");
      }
    }
    /**
     * set currentSession and currentUser
     * process to _startAutoRefreshToken if possible
     */
    async _saveSession(session) {
      this._debug("#_saveSession()", session);
      this.suppressGetSessionWarning = true;
      const sessionToProcess = Object.assign({}, session);
      const userIsProxy = sessionToProcess.user && sessionToProcess.user.__isUserNotAvailableProxy === true;
      if (this.userStorage) {
        if (!userIsProxy && sessionToProcess.user) {
          await setItemAsync(this.userStorage, this.storageKey + "-user", {
            user: sessionToProcess.user
          });
        } else if (userIsProxy) {
        }
        const mainSessionData = Object.assign({}, sessionToProcess);
        delete mainSessionData.user;
        const clonedMainSessionData = deepClone(mainSessionData);
        await setItemAsync(this.storage, this.storageKey, clonedMainSessionData);
      } else {
        const clonedSession = deepClone(sessionToProcess);
        await setItemAsync(this.storage, this.storageKey, clonedSession);
      }
    }
    async _removeSession() {
      this._sessionRemovalEpoch += 1;
      this._debug("#_removeSession()");
      this.lastRefreshFailure = null;
      this.suppressGetSessionWarning = false;
      await removeItemAsync(this.storage, this.storageKey);
      await removeAllPKCEVerifiers(this.storage, this.storageKey);
      await removeItemAsync(this.storage, this.storageKey + "-user");
      if (this.userStorage) {
        await removeItemAsync(this.userStorage, this.storageKey + "-user");
      }
      await this._notifyAllSubscribers("SIGNED_OUT", null);
    }
    /**
     * Removes any registered visibilitychange callback.
     *
     * {@link GoTrueClient.startAutoRefresh}
     * {@link GoTrueClient.stopAutoRefresh}
     */
    _removeVisibilityChangedCallback() {
      this._debug("#_removeVisibilityChangedCallback()");
      const callback = this.visibilityChangedCallback;
      this.visibilityChangedCallback = null;
      try {
        if (callback && isBrowser() && (window === null || window === void 0 ? void 0 : window.removeEventListener)) {
          window.removeEventListener("visibilitychange", callback);
        }
      } catch (e) {
        console.error("removing visibilitychange callback failed", e);
      }
    }
    /**
     * This is the private implementation of {@link GoTrueClient.startAutoRefresh}. Use this
     * within the library.
     */
    async _startAutoRefresh() {
      await this._stopAutoRefresh();
      this._debug("#_startAutoRefresh()");
      const ticker = setInterval(() => this._autoRefreshTokenTick(), AUTO_REFRESH_TICK_DURATION_MS);
      this.autoRefreshTicker = ticker;
      if (ticker && typeof ticker === "object" && typeof ticker.unref === "function") {
        ticker.unref();
      } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
        Deno.unrefTimer(ticker);
      }
      const timeout = setTimeout(async () => {
        await this.initializePromise;
        await this._autoRefreshTokenTick();
      }, 0);
      this.autoRefreshTickTimeout = timeout;
      if (timeout && typeof timeout === "object" && typeof timeout.unref === "function") {
        timeout.unref();
      } else if (typeof Deno !== "undefined" && typeof Deno.unrefTimer === "function") {
        Deno.unrefTimer(timeout);
      }
    }
    /**
     * This is the private implementation of {@link GoTrueClient.stopAutoRefresh}. Use this
     * within the library.
     */
    async _stopAutoRefresh() {
      this._debug("#_stopAutoRefresh()");
      const ticker = this.autoRefreshTicker;
      this.autoRefreshTicker = null;
      if (ticker) {
        clearInterval(ticker);
      }
      const timeout = this.autoRefreshTickTimeout;
      this.autoRefreshTickTimeout = null;
      if (timeout) {
        clearTimeout(timeout);
      }
    }
    /**
     * Starts an auto-refresh process in the background. The session is checked
     * every few seconds. Close to the time of expiration a process is started to
     * refresh the session. If refreshing fails it will be retried for as long as
     * necessary.
     *
     * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
     * to call this function, it will be called for you.
     *
     * On browsers the refresh process works only when the tab/window is in the
     * foreground to conserve resources as well as prevent race conditions and
     * flooding auth with requests. If you call this method any managed
     * visibility change callback will be removed and you must manage visibility
     * changes on your own.
     *
     * On non-browser platforms the refresh process works *continuously* in the
     * background, which may not be desirable. You should hook into your
     * platform's foreground indication mechanism and call these methods
     * appropriately to conserve resources.
     *
     * {@link GoTrueClient.stopAutoRefresh}
     *
     * @category Auth
     *
     * @remarks
     * - Only useful in non-browser environments such as React Native or Electron.
     * - The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.
     * - On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is _focused_ or not.
     * - To give this hint to the application, you should be calling this method when the app is in focus and calling `supabase.auth.stopAutoRefresh()` when it's out of focus.
     *
     * @example Start and stop auto refresh in React Native
     * ```js
     * import { AppState } from 'react-native'
     *
     * // make sure you register this only once!
     * AppState.addEventListener('change', (state) => {
     *   if (state === 'active') {
     *     supabase.auth.startAutoRefresh()
     *   } else {
     *     supabase.auth.stopAutoRefresh()
     *   }
     * })
     * ```
     */
    async startAutoRefresh() {
      this._removeVisibilityChangedCallback();
      await this._startAutoRefresh();
    }
    /**
     * Stops an active auto refresh process running in the background (if any).
     *
     * If you call this method any managed visibility change callback will be
     * removed and you must manage visibility changes on your own.
     *
     * See {@link GoTrueClient.startAutoRefresh} for more details.
     *
     * @category Auth
     *
     * @remarks
     * - Only useful in non-browser environments such as React Native or Electron.
     * - The Supabase Auth library automatically starts and stops proactively refreshing the session when a tab is focused or not.
     * - On non-browser platforms, such as mobile or desktop apps built with web technologies, the library is not able to effectively determine whether the application is _focused_ or not.
     * - When your application goes in the background or out of focus, call this method to stop the proactive refreshing of the session.
     *
     * @example Start and stop auto refresh in React Native
     * ```js
     * import { AppState } from 'react-native'
     *
     * // make sure you register this only once!
     * AppState.addEventListener('change', (state) => {
     *   if (state === 'active') {
     *     supabase.auth.startAutoRefresh()
     *   } else {
     *     supabase.auth.stopAutoRefresh()
     *   }
     * })
     * ```
     */
    async stopAutoRefresh() {
      this._removeVisibilityChangedCallback();
      await this._stopAutoRefresh();
    }
    /**
     * Tears down the client's background work: stops the auto-refresh interval,
     * removes the `visibilitychange` listener, closes the cross-tab
     * `BroadcastChannel`, and clears registered `onAuthStateChange` subscribers.
     *
     * Call this from cleanup hooks when the client is being replaced before
     * its JS realm is destroyed. React Strict Mode and HMR are the common
     * cases. Any in-flight `fetch` calls continue to completion and may still
     * write to storage; dispose doesn't abort them or erase storage.
     *
     * Lifecycle caveat: because in-flight refreshes are not aborted, a
     * disposed instance can still persist a rotated session to storage after
     * `dispose()` returns. A subsequent `createClient` against the same
     * `storageKey` will pick up that session on its next read. If you need
     * strict isolation between client lifecycles, await any pending auth
     * operation before calling `dispose()` (or change the `storageKey` for
     * the replacement client).
     *
     * Safe to call repeatedly.
     *
     * @category Auth
     *
     * @example Cleanup on React unmount
     * ```ts
     * useEffect(() => {
     *   const client = createClient(...)
     *   return () => { client.auth.dispose() }
     * }, [])
     * ```
     */
    async dispose() {
      var _a;
      this._removeVisibilityChangedCallback();
      await this._stopAutoRefresh();
      (_a = this.broadcastChannel) === null || _a === void 0 ? void 0 : _a.close();
      this.broadcastChannel = null;
      this.stateChangeEmitters.clear();
    }
    /**
     * Runs the auto refresh token tick.
     */
    async _autoRefreshTokenTick() {
      this._debug("#_autoRefreshTokenTick()", "begin");
      if (this.lock != null) {
        try {
          await this._acquireLock(0, async () => {
            try {
              const now = Date.now();
              try {
                return await this._useSession(async (result) => {
                  const { data: { session } } = result;
                  if (!session || !session.refresh_token || !session.expires_at) {
                    this._debug("#_autoRefreshTokenTick()", "no session");
                    return;
                  }
                  const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / AUTO_REFRESH_TICK_DURATION_MS);
                  this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${AUTO_REFRESH_TICK_THRESHOLD} ticks`);
                  if (expiresInTicks <= AUTO_REFRESH_TICK_THRESHOLD) {
                    await this._callRefreshToken(session.refresh_token);
                  }
                });
              } catch (e) {
                console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
              }
            } finally {
              this._debug("#_autoRefreshTokenTick()", "end");
            }
          });
        } catch (e) {
          if (e instanceof LockAcquireTimeoutError) {
            this._debug("auto refresh token tick lock not available");
          } else {
            throw e;
          }
        }
        return;
      }
      if (this.refreshingDeferred !== null) {
        this._debug("#_autoRefreshTokenTick()", "refresh already in flight, skipping");
        return;
      }
      try {
        const now = Date.now();
        try {
          await this._useSession(async (result) => {
            const { data: { session } } = result;
            if (!session || !session.refresh_token || !session.expires_at) {
              this._debug("#_autoRefreshTokenTick()", "no session");
              return;
            }
            const expiresInTicks = Math.floor((session.expires_at * 1e3 - now) / AUTO_REFRESH_TICK_DURATION_MS);
            this._debug("#_autoRefreshTokenTick()", `access token expires in ${expiresInTicks} ticks, a tick lasts ${AUTO_REFRESH_TICK_DURATION_MS}ms, refresh threshold is ${AUTO_REFRESH_TICK_THRESHOLD} ticks`);
            if (expiresInTicks <= AUTO_REFRESH_TICK_THRESHOLD) {
              await this._callRefreshToken(session.refresh_token);
            }
          });
        } catch (e) {
          console.error("Auto refresh tick failed with error. This is likely a transient error.", e);
        }
      } finally {
        this._debug("#_autoRefreshTokenTick()", "end");
      }
    }
    /**
     * Registers callbacks on the browser / platform, which in-turn run
     * algorithms when the browser window/tab are in foreground. On non-browser
     * platforms it assumes always foreground.
     */
    async _handleVisibilityChange() {
      this._debug("#_handleVisibilityChange()");
      if (!isBrowser() || !(window === null || window === void 0 ? void 0 : window.addEventListener)) {
        if (this.autoRefreshToken) {
          this.startAutoRefresh();
        }
        return false;
      }
      try {
        this.visibilityChangedCallback = async () => {
          try {
            await this._onVisibilityChanged(false);
          } catch (error) {
            this._debug("#visibilityChangedCallback", "error", error);
          }
        };
        window === null || window === void 0 ? void 0 : window.addEventListener("visibilitychange", this.visibilityChangedCallback);
        await this._onVisibilityChanged(true);
      } catch (error) {
        console.error("_handleVisibilityChange", error);
      }
    }
    /**
     * Callback registered with `window.addEventListener('visibilitychange')`.
     */
    async _onVisibilityChanged(calledFromInitialize) {
      const methodName = `#_onVisibilityChanged(${calledFromInitialize})`;
      this._debug(methodName, "visibilityState", document.visibilityState);
      if (document.visibilityState === "visible") {
        if (this.autoRefreshToken) {
          this._startAutoRefresh();
        }
        if (!calledFromInitialize) {
          await this.initializePromise;
          if (this.lock != null) {
            await this._acquireLock(this.lockAcquireTimeout, async () => {
              if (document.visibilityState !== "visible") {
                this._debug(methodName, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
                return;
              }
              await this._recoverAndRefresh();
            });
          } else {
            if (document.visibilityState !== "visible") {
              this._debug(methodName, "visibilityState is no longer visible, skipping recovery");
              return;
            }
            await this._recoverAndRefresh();
          }
        }
      } else if (document.visibilityState === "hidden") {
        if (this.autoRefreshToken) {
          this._stopAutoRefresh();
        }
      }
    }
    /**
     * Generates the relevant login URL for a third-party provider.
     * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
     * @param options.scopes A space-separated list of scopes granted to the OAuth application.
     * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
     */
    async _getUrlForProvider(url, provider, options2) {
      let redirectTo = options2 === null || options2 === void 0 ? void 0 : options2.redirectTo;
      let codeChallenge = null;
      let codeChallengeMethod = null;
      let flowId = null;
      if (this.flowType === "pkce") {
        ;
        [codeChallenge, codeChallengeMethod, flowId] = await this._getCodeChallengeAndMethod();
        redirectTo = this._maybeAppendFlowIdToRedirect(redirectTo, flowId);
      }
      const urlParams = [`provider=${encodeURIComponent(provider)}`];
      if (redirectTo) {
        urlParams.push(`redirect_to=${encodeURIComponent(redirectTo)}`);
      }
      if (options2 === null || options2 === void 0 ? void 0 : options2.scopes) {
        urlParams.push(`scopes=${encodeURIComponent(options2.scopes)}`);
      }
      if (codeChallenge != null && codeChallengeMethod != null) {
        const flowParams = new URLSearchParams({
          code_challenge: `${encodeURIComponent(codeChallenge)}`,
          code_challenge_method: `${encodeURIComponent(codeChallengeMethod)}`
        });
        urlParams.push(flowParams.toString());
      }
      if (options2 === null || options2 === void 0 ? void 0 : options2.queryParams) {
        const query = new URLSearchParams(options2.queryParams);
        urlParams.push(query.toString());
      }
      if (options2 === null || options2 === void 0 ? void 0 : options2.skipBrowserRedirect) {
        urlParams.push(`skip_http_redirect=${options2.skipBrowserRedirect}`);
      }
      return { url: `${url}?${urlParams.join("&")}`, flowId };
    }
    /**
     * Appends the reserved flow id parameter to a redirect URL so the callback
     * can be matched to the verifier stored for its flow. Opt-in via
     * `experimental.appendPkceFlowIdToRedirects`: redirect URLs are validated
     * against the project's allow list including the query string, so an extra
     * parameter can stop exact (non-wildcard) entries from matching.
     */
    _maybeAppendFlowIdToRedirect(redirectTo, flowId) {
      if (!redirectTo || !flowId || !this.experimental.appendPkceFlowIdToRedirects) {
        return redirectTo !== null && redirectTo !== void 0 ? redirectTo : void 0;
      }
      return appendFlowIdToRedirectTo(redirectTo, flowId);
    }
    /**
     * Generates and stores a PKCE challenge/verifier pair for a new flow,
     * logging any pending verifier the bounded slot ring evicts.
     */
    async _getCodeChallengeAndMethod(isPasswordRecovery = false) {
      return getCodeChallengeAndMethod(this.storage, this.storageKey, isPasswordRecovery, (evictedFlowId) => this._debug("#_getCodeChallengeAndMethod()", "evicted oldest pending PKCE verifier slot", evictedFlowId));
    }
    async _unenroll(params) {
      try {
        return await this._useSession(async (result) => {
          var _a;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          return await _request(this.fetch, "DELETE", `${this.url}/factors/${params.factorId}`, {
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async _enroll(params) {
      try {
        return await this._useSession(async (result) => {
          var _a, _b;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          const body = Object.assign({ friendly_name: params.friendlyName, factor_type: params.factorType }, params.factorType === "phone" ? { phone: params.phone } : params.factorType === "totp" ? { issuer: params.issuer } : {});
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors`, {
            body,
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          if (params.factorType === "totp" && data.type === "totp" && ((_b = data === null || data === void 0 ? void 0 : data.totp) === null || _b === void 0 ? void 0 : _b.qr_code)) {
            data.totp.qr_code = `data:image/svg+xml;utf-8,${data.totp.qr_code}`;
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async _verify(params) {
      const run = async () => {
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const body = Object.assign({ challenge_id: params.challengeId }, "webauthn" in params ? {
              webauthn: Object.assign(Object.assign({}, params.webauthn), { credential_response: params.webauthn.type === "create" ? serializeCredentialCreationResponse(params.webauthn.credential_response) : serializeCredentialRequestResponse(params.webauthn.credential_response) })
            } : { code: params.code });
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/verify`, {
              body,
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + data.expires_in }, data));
            await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", data);
            return this._returnResult({ data, error });
          });
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      };
      if (this.lock != null) {
        return this._acquireLock(this.lockAcquireTimeout, run);
      }
      return run();
    }
    async _challenge(params) {
      const run = async () => {
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const response = await _request(this.fetch, "POST", `${this.url}/factors/${params.factorId}/challenge`, {
              body: params,
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (response.error) {
              return response;
            }
            const { data } = response;
            if (data.type !== "webauthn") {
              return { data, error: null };
            }
            switch (data.webauthn.type) {
              case "create":
                return {
                  data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialCreationOptions(data.webauthn.credential_options.publicKey) }) }) }),
                  error: null
                };
              case "request":
                return {
                  data: Object.assign(Object.assign({}, data), { webauthn: Object.assign(Object.assign({}, data.webauthn), { credential_options: Object.assign(Object.assign({}, data.webauthn.credential_options), { publicKey: deserializeCredentialRequestOptions(data.webauthn.credential_options.publicKey) }) }) }),
                  error: null
                };
            }
          });
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      };
      if (this.lock != null) {
        return this._acquireLock(this.lockAcquireTimeout, run);
      }
      return run();
    }
    /**
     * {@link GoTrueMFAApi#challengeAndVerify}
     */
    async _challengeAndVerify(params) {
      const { data: challengeData, error: challengeError } = await this._challenge({
        factorId: params.factorId
      });
      if (challengeError) {
        return this._returnResult({ data: null, error: challengeError });
      }
      return await this._verify({
        factorId: params.factorId,
        challengeId: challengeData.id,
        code: params.code
      });
    }
    /**
     * {@link GoTrueMFAApi#listFactors}
     */
    async _listFactors() {
      var _a;
      const { data: { user }, error: userError } = await this.getUser();
      if (userError) {
        return { data: null, error: userError };
      }
      const data = {
        all: [],
        phone: [],
        totp: [],
        webauthn: [],
        recovery_code: []
      };
      for (const factor of (_a = user === null || user === void 0 ? void 0 : user.factors) !== null && _a !== void 0 ? _a : []) {
        data.all.push(factor);
        if (factor.status === "verified" && factor.factor_type in data && Array.isArray(data[factor.factor_type])) {
          ;
          data[factor.factor_type].push(factor);
        }
      }
      return {
        data,
        error: null
      };
    }
    /**
     * {@link GoTrueMFAApi#getAuthenticatorAssuranceLevel}
     */
    async _getAuthenticatorAssuranceLevel(jwt) {
      var _a, _b, _c, _d;
      if (jwt) {
        try {
          const { payload: payload2 } = decodeJWT(jwt);
          let currentLevel2 = null;
          if (payload2.aal) {
            currentLevel2 = payload2.aal;
          }
          let nextLevel2 = currentLevel2;
          const { data: { user }, error: userError } = await this.getUser(jwt);
          if (userError) {
            return this._returnResult({ data: null, error: userError });
          }
          const verifiedFactors2 = (_b = (_a = user === null || user === void 0 ? void 0 : user.factors) === null || _a === void 0 ? void 0 : _a.filter((factor) => factor.status === "verified")) !== null && _b !== void 0 ? _b : [];
          if (verifiedFactors2.length > 0) {
            nextLevel2 = "aal2";
          }
          const currentAuthenticationMethods2 = payload2.amr || [];
          return { data: { currentLevel: currentLevel2, nextLevel: nextLevel2, currentAuthenticationMethods: currentAuthenticationMethods2 }, error: null };
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      }
      const { data: { session }, error: sessionError } = await this.getSession();
      if (sessionError) {
        return this._returnResult({ data: null, error: sessionError });
      }
      if (!session) {
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      }
      const { payload } = decodeJWT(session.access_token);
      let currentLevel = null;
      if (payload.aal) {
        currentLevel = payload.aal;
      }
      let nextLevel = currentLevel;
      const verifiedFactors = (_d = (_c = session.user.factors) === null || _c === void 0 ? void 0 : _c.filter((factor) => factor.status === "verified")) !== null && _d !== void 0 ? _d : [];
      if (verifiedFactors.length > 0) {
        nextLevel = "aal2";
      }
      const currentAuthenticationMethods = payload.amr || [];
      return { data: { currentLevel, nextLevel, currentAuthenticationMethods }, error: null };
    }
    /**
     * {@link AuthMFARecoveryCodesApi#getStatus}
     */
    async _getRecoveryCodesStatus() {
      assertRecoveryCodesExperimentalEnabled(this.experimental);
      try {
        return await this._useSession(async (result) => {
          var _a;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          const { data, error } = await _request(this.fetch, "GET", `${this.url}/factors/recovery-codes`, {
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * {@link AuthMFARecoveryCodesApi#generate}
     */
    async _generateRecoveryCodes(params) {
      assertRecoveryCodesExperimentalEnabled(this.experimental);
      try {
        return await this._useSession(async (result) => {
          var _a;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/recovery-codes`, {
            // The body is optional server-side; only send one when a name was given.
            body: (params === null || params === void 0 ? void 0 : params.friendlyName) ? { friendly_name: params.friendlyName } : void 0,
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * {@link AuthMFARecoveryCodesApi#verify}
     */
    async _verifyRecoveryCode(params) {
      assertRecoveryCodesExperimentalEnabled(this.experimental);
      const run = async () => {
        try {
          return await this._useSession(async (result) => {
            var _a;
            const { data: sessionData, error: sessionError } = result;
            if (sessionError) {
              return this._returnResult({ data: null, error: sessionError });
            }
            const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/recovery-codes/verify`, {
              body: { code: params.code },
              headers: this.headers,
              jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
            });
            if (error) {
              return this._returnResult({ data: null, error });
            }
            const session = Object.assign({ expires_at: expiresAt(data.expires_in) }, data);
            await this._saveSession(session);
            await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", session);
            return this._returnResult({ data, error: null });
          });
        } catch (error) {
          if (isAuthError(error)) {
            return this._returnResult({ data: null, error });
          }
          throw error;
        }
      };
      if (this.lock != null) {
        return this._acquireLock(this.lockAcquireTimeout, run);
      }
      return run();
    }
    /**
     * {@link AuthMFARecoveryCodesApi#regenerate}
     */
    async _regenerateRecoveryCodes() {
      assertRecoveryCodesExperimentalEnabled(this.experimental);
      try {
        return await this._useSession(async (result) => {
          var _a;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/factors/recovery-codes/regenerate`, {
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * {@link AuthMFARecoveryCodesApi#unenroll}
     */
    async _unenrollRecoveryCodes() {
      assertRecoveryCodesExperimentalEnabled(this.experimental);
      try {
        return await this._useSession(async (result) => {
          var _a;
          const { data: sessionData, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          const { data, error } = await _request(this.fetch, "DELETE", `${this.url}/factors/recovery-codes`, {
            headers: this.headers,
            jwt: (_a = sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Retrieves details about an OAuth authorization request.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     *
     * Returns authorization details including client info, scopes, and user information.
     * If the response includes only a redirect_url field, it means consent was already given - the caller
     * should handle the redirect manually if needed.
     */
    async _getAuthorizationDetails(authorizationId) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          return await _request(this.fetch, "GET", `${this.url}/oauth/authorizations/${authorizationId}`, {
            headers: this.headers,
            jwt: session.access_token,
            xform: (data) => ({ data, error: null })
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Approves an OAuth authorization request.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _approveAuthorization(authorizationId, options2) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
            headers: this.headers,
            jwt: session.access_token,
            body: { action: "approve" },
            xform: (data) => ({ data, error: null })
          });
          if (response.data && response.data.redirect_url) {
            if (isBrowser() && !(options2 === null || options2 === void 0 ? void 0 : options2.skipBrowserRedirect)) {
              window.location.assign(response.data.redirect_url);
            }
          }
          return response;
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Denies an OAuth authorization request.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _denyAuthorization(authorizationId, options2) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const response = await _request(this.fetch, "POST", `${this.url}/oauth/authorizations/${authorizationId}/consent`, {
            headers: this.headers,
            jwt: session.access_token,
            body: { action: "deny" },
            xform: (data) => ({ data, error: null })
          });
          if (response.data && response.data.redirect_url) {
            if (isBrowser() && !(options2 === null || options2 === void 0 ? void 0 : options2.skipBrowserRedirect)) {
              window.location.assign(response.data.redirect_url);
            }
          }
          return response;
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Lists all OAuth grants that the authenticated user has authorized.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _listOAuthGrants() {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          return await _request(this.fetch, "GET", `${this.url}/user/oauth/grants`, {
            headers: this.headers,
            jwt: session.access_token,
            xform: (data) => ({ data, error: null })
          });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Revokes a user's OAuth grant for a specific client.
     * Only relevant when the OAuth 2.1 server is enabled in Supabase Auth.
     */
    async _revokeOAuthGrant(options2) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          await _request(this.fetch, "DELETE", `${this.url}/user/oauth/grants`, {
            headers: this.headers,
            jwt: session.access_token,
            query: { client_id: options2.clientId },
            noResolveJson: true
          });
          return { data: {}, error: null };
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    async fetchJwk(kid, jwks = { keys: [] }) {
      let jwk = jwks.keys.find((key) => key.kid === kid);
      if (jwk) {
        return jwk;
      }
      const now = Date.now();
      jwk = this.jwks.keys.find((key) => key.kid === kid);
      if (jwk && this.jwks_cached_at + JWKS_TTL > now) {
        return jwk;
      }
      const { data, error } = await _request(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
        headers: this.headers
      });
      if (error) {
        throw error;
      }
      if (!data.keys || data.keys.length === 0) {
        return null;
      }
      this.jwks = data;
      this.jwks_cached_at = now;
      jwk = data.keys.find((key) => key.kid === kid);
      if (!jwk) {
        return null;
      }
      return jwk;
    }
    /**
     * Extracts the JWT claims present in the access token by first verifying the
     * JWT against the server's JSON Web Key Set endpoint
     * `/.well-known/jwks.json` which is often cached, resulting in significantly
     * faster responses. Prefer this method over {@link GoTrueClient.getUser} which always
     * sends a request to the Auth server for each JWT.
     *
     * If the project is not using an asymmetric JWT signing key (like ECC or
     * RSA) it always sends a request to the Auth server (similar to
     * {@link GoTrueClient.getUser}) to verify the JWT.
     *
     * @param jwt An optional specific JWT you wish to verify, not the one you
     *            can obtain from {@link GoTrueClient.getSession}.
     * @param options Various additional options that allow you to customize the
     *                behavior of this method.
     *
     * @category Auth
     *
     * @remarks
     * - Parses the user's [access token](/docs/guides/auth/sessions#access-token-jwt-claims) as a [JSON Web Token (JWT)](/docs/guides/auth/jwts) and returns its components if valid and not expired.
     * - If your project is using asymmetric JWT signing keys, then the verification is done locally usually without a network request using the [WebCrypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).
     * - A network request is sent to your project's JWT signing key discovery endpoint `https://project-id.supabase.co/auth/v1/.well-known/jwks.json`, which is cached locally. If your environment is ephemeral, such as a Lambda function that is destroyed after every request, a network request will be sent for each new invocation. Supabase provides a network-edge cache providing fast responses for these situations.
     * - If the user's access token is about to expire when calling this function, the user's session will first be refreshed before validating the JWT.
     * - If your project is using a symmetric secret to sign the JWT, it always sends a request similar to `getUser()` to validate the JWT at the server before returning the decoded token. This is also used if the WebCrypto API is not available in the environment. Make sure you polyfill it in such situations.
     * - The returned claims can be customized per project using the [Custom Access Token Hook](/docs/guides/auth/auth-hooks/custom-access-token-hook).
     *
     * @example Get JWT claims, header and signature
     * ```js
     * const { data, error } = await supabase.auth.getClaims()
     * ```
     *
     * @exampleResponse Get JWT claims, header and signature
     * ```json
     * {
     *   "data": {
     *     "claims": {
     *       "aal": "aal1",
     *       "amr": [{
     *         "method": "email",
     *         "timestamp": 1715766000
     *       }],
     *       "app_metadata": {},
     *       "aud": "authenticated",
     *       "email": "example@email.com",
     *       "exp": 1715769600,
     *       "iat": 1715766000,
     *       "is_anonymous": false,
     *       "iss": "https://project-id.supabase.co/auth/v1",
     *       "phone": "+13334445555",
     *       "role": "authenticated",
     *       "session_id": "11111111-1111-1111-1111-111111111111",
     *       "sub": "11111111-1111-1111-1111-111111111111",
     *       "user_metadata": {}
     *     },
     *     "header": {
     *       "alg": "RS256",
     *       "typ": "JWT",
     *       "kid": "11111111-1111-1111-1111-111111111111"
     *     },
     *     "signature": [/** Uint8Array *\/],
     *   },
     *   "error": null
     * }
     * ```
     */
    async getClaims(jwt, options2 = {}) {
      try {
        let token = jwt;
        if (!token) {
          const { data, error } = await this.getSession();
          if (error || !data.session) {
            return this._returnResult({ data: null, error });
          }
          token = data.session.access_token;
        }
        const { header, payload, signature, raw: { header: rawHeader, payload: rawPayload } } = decodeJWT(token);
        if (!(options2 === null || options2 === void 0 ? void 0 : options2.allowExpired)) {
          try {
            validateExp(payload.exp);
          } catch (e) {
            throw new AuthInvalidJwtError(e instanceof Error ? e.message : "JWT validation failed");
          }
        }
        const signingKey = !header.alg || header.alg.startsWith("HS") || !header.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(header.kid, (options2 === null || options2 === void 0 ? void 0 : options2.keys) ? { keys: options2.keys } : options2 === null || options2 === void 0 ? void 0 : options2.jwks);
        if (!signingKey) {
          const { error } = await this.getUser(token);
          if (error) {
            throw error;
          }
          return {
            data: {
              claims: payload,
              header,
              signature
            },
            error: null
          };
        }
        const algorithm = getAlgorithm(header.alg);
        const publicKey = await crypto.subtle.importKey("jwk", signingKey, algorithm, true, [
          "verify"
        ]);
        const isValid = await crypto.subtle.verify(algorithm, publicKey, signature, stringToUint8Array(`${rawHeader}.${rawPayload}`));
        if (!isValid) {
          throw new AuthInvalidJwtError("Invalid JWT signature");
        }
        return {
          data: {
            claims: payload,
            header,
            signature
          },
          error: null
        };
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    // --- Passkey Methods ---
    /**
     * Sign in with a passkey. Handles the full WebAuthn ceremony:
     * 1. Fetches authentication challenge from server
     * 2. Prompts user via navigator.credentials.get()
     * 3. Verifies credential with server and creates session
     *
     * Pass `options.mediation: 'conditional'` to use WebAuthn Conditional UI
     * (passkey autofill) instead of the modal picker; the value is forwarded to
     * `navigator.credentials.get()` unchanged.
     *
     * The challenge fetched in step 1 expires after the server's
     * GOTRUE_WEBAUTHN_CHALLENGE_EXPIRY_DURATION (5 minutes by default). With
     * `mediation: 'conditional'` the autofill prompt can stay pending for longer
     * than that: the browser ceremony then still succeeds, but verification fails
     * with `error_code: "webauthn_challenge_expired"`. Recover by calling
     * `signInWithPasskey()` again. It fetches a fresh challenge and, unless you
     * passed your own `options.signal`, cancels the pending ceremony first, so
     * the browser never sees two concurrent WebAuthn requests; the earlier call
     * resolves with a `WebAuthnError` whose code is `ERROR_CEREMONY_ABORTED`. If
     * you pass your own `signal`, abort it before retrying.
     *
     * @category Auth
     *
     * @example Sign in with Conditional UI (passkey autofill)
     * ```js
     * // <input autocomplete="username webauthn" /> somewhere on the page
     * const { data, error } = await supabase.auth.signInWithPasskey({
     *   options: {
     *     mediation: 'conditional'
     *   }
     * });
     * ```
     */
    async signInWithPasskey(credentials) {
      var _a, _b, _c, _d;
      try {
        if (!browserSupportsWebAuthn()) {
          return this._returnResult({
            data: null,
            error: new AuthUnknownError("Browser does not support WebAuthn", null)
          });
        }
        const { data: options2, error: optionsError } = await this._startPasskeyAuthentication({
          options: { captchaToken: (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.captchaToken }
        });
        if (optionsError || !options2) {
          return this._returnResult({ data: null, error: optionsError });
        }
        const publicKeyOptions = deserializeCredentialRequestOptions(options2.options);
        const signal = (_c = (_b = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _b === void 0 ? void 0 : _b.signal) !== null && _c !== void 0 ? _c : webAuthnAbortService.createNewAbortSignal();
        const { data: credential, error: credentialError } = await getCredential({
          publicKey: publicKeyOptions,
          signal,
          mediation: (_d = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _d === void 0 ? void 0 : _d.mediation
        });
        if (credentialError || !credential) {
          return this._returnResult({
            data: null,
            error: credentialError !== null && credentialError !== void 0 ? credentialError : new AuthUnknownError("WebAuthn ceremony failed", null)
          });
        }
        const serialized = serializeCredentialRequestResponse(credential);
        return this._verifyPasskeyAuthentication({
          challengeId: options2.challenge_id,
          credential: serialized
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Register a passkey for the current authenticated user. Handles the full WebAuthn ceremony:
     * 1. Fetches registration challenge from server
     * 2. Prompts user via navigator.credentials.create()
     * 3. Verifies credential with server
     *
     * Requires an active session.
     *
     * @category Auth
     */
    async registerPasskey(credentials) {
      var _a, _b;
      try {
        if (!browserSupportsWebAuthn()) {
          return this._returnResult({
            data: null,
            error: new AuthUnknownError("Browser does not support WebAuthn", null)
          });
        }
        const { data: options2, error: optionsError } = await this._startPasskeyRegistration();
        if (optionsError || !options2) {
          return this._returnResult({ data: null, error: optionsError });
        }
        const publicKeyOptions = deserializeCredentialCreationOptions(options2.options);
        const signal = (_b = (_a = credentials === null || credentials === void 0 ? void 0 : credentials.options) === null || _a === void 0 ? void 0 : _a.signal) !== null && _b !== void 0 ? _b : webAuthnAbortService.createNewAbortSignal();
        const { data: credential, error: credentialError } = await createCredential({
          publicKey: publicKeyOptions,
          signal
        });
        if (credentialError || !credential) {
          return this._returnResult({
            data: null,
            error: credentialError !== null && credentialError !== void 0 ? credentialError : new AuthUnknownError("WebAuthn ceremony failed", null)
          });
        }
        const serialized = serializeCredentialCreationResponse(credential);
        return this._verifyPasskeyRegistration({
          challengeId: options2.challenge_id,
          credential: serialized
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Start passkey registration for the current authenticated user.
     * Returns WebAuthn credential creation options to pass to navigator.credentials.create().
     */
    async _startPasskeyRegistration() {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/passkeys/registration/options`, {
            headers: this.headers,
            jwt: session.access_token,
            body: {}
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Verify passkey registration with the credential response.
     * The credentialResponse should be the serialized output of navigator.credentials.create().
     */
    async _verifyPasskeyRegistration(params) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const { data, error } = await _request(this.fetch, "POST", `${this.url}/passkeys/registration/verify`, {
            headers: this.headers,
            jwt: session.access_token,
            body: {
              challenge_id: params.challengeId,
              credential: params.credential
            }
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Start passkey authentication.
     * Returns WebAuthn credential request options to pass to navigator.credentials.get().
     */
    async _startPasskeyAuthentication(params) {
      var _a;
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/passkeys/authentication/options`, {
          headers: this.headers,
          body: {
            gotrue_meta_security: { captcha_token: (_a = params === null || params === void 0 ? void 0 : params.options) === null || _a === void 0 ? void 0 : _a.captchaToken }
          }
        });
        if (error) {
          return this._returnResult({ data: null, error });
        }
        return this._returnResult({ data, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Verify passkey authentication and create a session.
     * The credential should be the serialized output of navigator.credentials.get().
     */
    async _verifyPasskeyAuthentication(params) {
      try {
        const { data, error } = await _request(this.fetch, "POST", `${this.url}/passkeys/authentication/verify`, {
          headers: this.headers,
          body: {
            challenge_id: params.challengeId,
            credential: params.credential
          },
          xform: _sessionResponse
        });
        if (error) {
          return this._returnResult({ data: null, error });
        }
        if (data.session) {
          await this._saveSession(data.session);
          await this._notifyAllSubscribers("SIGNED_IN", data.session);
        }
        return this._returnResult({ data, error: null });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * List all passkeys for the current user.
     */
    async _listPasskeys() {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const { data, error } = await _request(this.fetch, "GET", `${this.url}/passkeys`, {
            headers: this.headers,
            jwt: session.access_token,
            xform: (data2) => ({ data: data2, error: null })
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Update a passkey.
     */
    async _updatePasskey(params) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const { data, error } = await _request(this.fetch, "PATCH", `${this.url}/passkeys/${params.passkeyId}`, {
            headers: this.headers,
            jwt: session.access_token,
            body: { friendly_name: params.friendlyName }
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
    /**
     * Delete a passkey.
     */
    async _deletePasskey(params) {
      try {
        return await this._useSession(async (result) => {
          const { data: { session }, error: sessionError } = result;
          if (sessionError) {
            return this._returnResult({ data: null, error: sessionError });
          }
          if (!session) {
            return this._returnResult({ data: null, error: new AuthSessionMissingError() });
          }
          const { error } = await _request(this.fetch, "DELETE", `${this.url}/passkeys/${params.passkeyId}`, {
            headers: this.headers,
            jwt: session.access_token,
            noResolveJson: true
          });
          if (error) {
            return this._returnResult({ data: null, error });
          }
          return this._returnResult({ data: null, error: null });
        });
      } catch (error) {
        if (isAuthError(error)) {
          return this._returnResult({ data: null, error });
        }
        throw error;
      }
    }
  };
  GoTrueClient.nextInstanceID = {};
  var GoTrueClient_default = GoTrueClient;

  // node_modules/@supabase/auth-js/dist/module/AuthClient.js
  var AuthClient = GoTrueClient_default;
  var AuthClient_default = AuthClient;

  // node_modules/@supabase/supabase-js/dist/index.mjs
  var version4 = "2.119.2";
  function _typeof3(o) {
    "@babel/helpers - typeof";
    return _typeof3 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o$1) {
      return typeof o$1;
    } : function(o$1) {
      return o$1 && "function" == typeof Symbol && o$1.constructor === Symbol && o$1 !== Symbol.prototype ? "symbol" : typeof o$1;
    }, _typeof3(o);
  }
  function toPrimitive3(t, r) {
    if ("object" != _typeof3(t) || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
      var i = e.call(t, r || "default");
      if ("object" != _typeof3(i)) return i;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
  }
  function toPropertyKey3(t) {
    var i = toPrimitive3(t, "string");
    return "symbol" == _typeof3(i) ? i : i + "";
  }
  function _defineProperty3(e, r, t) {
    return (r = toPropertyKey3(r)) in e ? Object.defineProperty(e, r, {
      value: t,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e[r] = t, e;
  }
  function ownKeys3(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function(r$1) {
        return Object.getOwnPropertyDescriptor(e, r$1).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread23(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys3(Object(t), true).forEach(function(r$1) {
        _defineProperty3(e, r$1, t[r$1]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys3(Object(t)).forEach(function(r$1) {
        Object.defineProperty(e, r$1, Object.getOwnPropertyDescriptor(t, r$1));
      });
    }
    return e;
  }
  function asString(value) {
    return typeof value === "string" && value.length > 0 ? value : void 0;
  }
  function detectDenoPlatform(globals) {
    if (typeof globals.EdgeRuntime === "object" && globals.EdgeRuntime !== null) return {
      platform: "edge-runtime",
      platformVersion: asString(globals.SUPABASE_VERSION)
    };
    if (typeof globals.Netlify !== "undefined") return { platform: "netlify-edge" };
    return {};
  }
  function detectElectronFromUserAgent(userAgent) {
    var _userAgent$match;
    const electronVersion = userAgent === null || userAgent === void 0 || (_userAgent$match = userAgent.match(/\bElectron\/([\w.-]+)/)) === null || _userAgent$match === void 0 ? void 0 : _userAgent$match[1];
    return electronVersion ? {
      framework: "electron",
      frameworkVersion: electronVersion
    } : {};
  }
  function detectClientEnvironment(globals = globalThis) {
    var _globals$navigator, _globals$navigator2, _globals$process, _asString, _globals$process2;
    const userAgent = asString((_globals$navigator = globals.navigator) === null || _globals$navigator === void 0 ? void 0 : _globals$navigator.userAgent);
    if (userAgent === "Cloudflare-Workers") return { platform: "cloudflare-workers" };
    if (typeof globals.Deno !== "undefined") {
      var _globals$Deno$version;
      return _objectSpread23(_objectSpread23({}, detectDenoPlatform(globals)), {}, {
        runtime: "deno",
        runtimeVersion: asString((_globals$Deno$version = globals.Deno.version) === null || _globals$Deno$version === void 0 ? void 0 : _globals$Deno$version.deno)
      });
    }
    if (typeof globals.Bun !== "undefined") return {
      runtime: "bun",
      runtimeVersion: asString(globals.Bun.version)
    };
    if (typeof globals.EdgeRuntime === "string") return { platform: "vercel-edge-runtime" };
    if (((_globals$navigator2 = globals.navigator) === null || _globals$navigator2 === void 0 ? void 0 : _globals$navigator2.product) === "ReactNative") return { framework: "react-native" };
    if (typeof globals.document !== "undefined" || typeof globals.WorkerGlobalScope !== "undefined") return _objectSpread23({ platform: "browser" }, detectElectronFromUserAgent(userAgent));
    const processVersions = (_globals$process = globals.process) === null || _globals$process === void 0 ? void 0 : _globals$process["versions"];
    const electronVersion = asString(processVersions === null || processVersions === void 0 ? void 0 : processVersions["electron"]);
    return _objectSpread23({
      runtime: "node",
      runtimeVersion: (_asString = asString((_globals$process2 = globals.process) === null || _globals$process2 === void 0 ? void 0 : _globals$process2["version"])) === null || _asString === void 0 ? void 0 : _asString.replace(/^v/, "")
    }, electronVersion ? {
      framework: "electron",
      frameworkVersion: electronVersion
    } : {});
  }
  function formatClientEnvironment(environment) {
    return [
      ["platform", environment.platform],
      ["platform-version", environment.platformVersion],
      ["runtime", environment.runtime],
      ["runtime-version", environment.runtimeVersion],
      ["framework", environment.framework],
      ["framework-version", environment.frameworkVersion]
    ].filter(([, value]) => value).map(([key, value]) => `${key}=${value}`);
  }
  var DEFAULT_HEADERS3 = { "X-Client-Info": [`supabase-js/${version4}`, ...formatClientEnvironment(detectClientEnvironment())].join("; ") };
  var DEFAULT_GLOBAL_OPTIONS = { headers: DEFAULT_HEADERS3 };
  var DEFAULT_DB_OPTIONS = { schema: "public" };
  var DEFAULT_AUTH_OPTIONS = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "implicit"
  };
  var DEFAULT_REALTIME_OPTIONS = {};
  var DEFAULT_TRACE_PROPAGATION_OPTIONS = {
    enabled: false,
    respectSamplingDecision: true
  };
  function parseTraceParent(traceparent) {
    if (!traceparent || typeof traceparent !== "string") return null;
    const parts = traceparent.split("-");
    if (parts.length !== 4) return null;
    const [version$1, traceId, parentId, traceFlags] = parts;
    if (version$1.length !== 2 || traceId.length !== 32 || parentId.length !== 16 || traceFlags.length !== 2) return null;
    const hexRegex = /^[0-9a-f]+$/i;
    if (!hexRegex.test(version$1) || !hexRegex.test(traceId) || !hexRegex.test(parentId) || !hexRegex.test(traceFlags)) return null;
    if (traceId === "00000000000000000000000000000000" || parentId === "0000000000000000") return null;
    return {
      version: version$1,
      traceId,
      parentId,
      traceFlags,
      isSampled: (parseInt(traceFlags, 16) & 1) === 1
    };
  }
  function shouldPropagateToTarget(targetUrl, targets) {
    if (!targetUrl || !targets || targets.length === 0) return false;
    let url;
    if (targetUrl instanceof URL) url = targetUrl;
    else try {
      url = new URL(targetUrl);
    } catch (error) {
      return false;
    }
    for (const target of targets) try {
      if (typeof target === "string") {
        if (matchStringTarget(url.hostname, target)) return true;
      } else if (target instanceof RegExp) {
        if (target.test(url.hostname)) return true;
      } else if (typeof target === "function") {
        if (target(url)) return true;
      }
    } catch (error) {
      continue;
    }
    return false;
  }
  function matchStringTarget(hostname, target) {
    if (target === hostname) return true;
    if (target.startsWith("*.")) {
      const domain = target.slice(2);
      if (hostname.endsWith(domain)) {
        if (hostname === domain || hostname.endsWith("." + domain)) return true;
      }
    }
    return false;
  }
  function getDefaultPropagationTargets(supabaseUrl) {
    const targets = [];
    try {
      const url = new URL(supabaseUrl);
      targets.push(url.hostname);
    } catch (error) {
    }
    targets.push("*.supabase.co", "*.supabase.in");
    targets.push("localhost", "127.0.0.1", "[::1]");
    return targets;
  }
  var resolveFetch4 = (customFetch) => {
    if (customFetch) return (...args) => customFetch(...args);
    return (...args) => fetch(...args);
  };
  var resolveHeadersConstructor = () => {
    return Headers;
  };
  var isNewApiKey = (key) => key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
  var TEMP_KEY_PREFIX = "sb_temp_";
  var warnedKeySubtypes = /* @__PURE__ */ new Set();
  var checkApiKeyFormat = (key) => {
    var _key$match$, _key$match;
    if (!key.startsWith("sb_") || isNewApiKey(key) || key.startsWith(TEMP_KEY_PREFIX)) return;
    const subtype = (_key$match$ = (_key$match = key.match(/^sb_[a-zA-Z0-9]+_/)) === null || _key$match === void 0 ? void 0 : _key$match[0]) !== null && _key$match$ !== void 0 ? _key$match$ : "unknown";
    if (warnedKeySubtypes.has(subtype)) return;
    warnedKeySubtypes.add(subtype);
    console.warn("@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type.");
  };
  var fetchWithAuth = (supabaseKey, supabaseUrl, getAccessToken, customFetch, tracePropagationOptions, options2) => {
    const fetch$1 = resolveFetch4(customFetch);
    const HeadersConstructor = resolveHeadersConstructor();
    const traceEnabled = (tracePropagationOptions === null || tracePropagationOptions === void 0 ? void 0 : tracePropagationOptions.enabled) === true;
    const respectSampling = (tracePropagationOptions === null || tracePropagationOptions === void 0 ? void 0 : tracePropagationOptions.respectSamplingDecision) !== false;
    const traceTargets = traceEnabled ? getDefaultPropagationTargets(supabaseUrl) : null;
    const allowKeyAsBearer = !((options2 === null || options2 === void 0 ? void 0 : options2.omitApiKeyAsBearer) && isNewApiKey(supabaseKey));
    return async (input, init) => {
      const realToken = await getAccessToken();
      let headers = new HeadersConstructor(init === null || init === void 0 ? void 0 : init.headers);
      if (!headers.has("apikey")) headers.set("apikey", supabaseKey);
      if (!headers.has("Authorization")) {
        const bearer = realToken !== null && realToken !== void 0 ? realToken : allowKeyAsBearer ? supabaseKey : null;
        if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
      }
      if (traceTargets) {
        const traceHeaders = getTraceHeaders(input, traceTargets, respectSampling);
        if (traceHeaders) {
          if (traceHeaders.traceparent && !headers.has("traceparent")) headers.set("traceparent", traceHeaders.traceparent);
          if (traceHeaders.tracestate && !headers.has("tracestate")) headers.set("tracestate", traceHeaders.tracestate);
          if (traceHeaders.baggage && !headers.has("baggage")) headers.set("baggage", traceHeaders.baggage);
        }
      }
      return fetch$1(input, _objectSpread23(_objectSpread23({}, init), {}, { headers }));
    };
  };
  var warnedMissingTracingRuntime = false;
  var warnedNonW3CPropagator = false;
  function getTraceHeaders(input, targets, respectSampling) {
    const extractTraceContext = getTraceContextExtractor();
    if (!extractTraceContext) {
      if (!warnedMissingTracingRuntime) {
        warnedMissingTracingRuntime = true;
        console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.");
      }
      return null;
    }
    if (!shouldPropagateToTarget(typeof input === "string" ? input : input instanceof URL ? input : input.url, targets)) return null;
    const traceContext = extractTraceContext();
    if (!traceContext || !traceContext.traceparent) {
      var _traceContext$carrier;
      if ((traceContext === null || traceContext === void 0 || (_traceContext$carrier = traceContext.carrierKeys) === null || _traceContext$carrier === void 0 ? void 0 : _traceContext$carrier.length) && !warnedNonW3CPropagator) {
        warnedNonW3CPropagator = true;
        const sentryHint = traceContext.carrierKeys.includes("sentry-trace") ? " Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it." : " Configure your tracing SDK to emit W3C trace context on outgoing requests.";
        console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${traceContext.carrierKeys.join(", ")}] and no W3C traceparent header, so trace headers will not be attached.` + sentryHint);
      }
      return null;
    }
    if (respectSampling) {
      const parsed = parseTraceParent(traceContext.traceparent);
      if (parsed && !parsed.isSampled) return { traceparent: traceContext.traceparent };
    }
    return traceContext;
  }
  function normalizeTracePropagation(value) {
    return typeof value === "boolean" ? { enabled: value } : value;
  }
  function ensureTrailingSlash(url) {
    return url.endsWith("/") ? url : url + "/";
  }
  var warnedTopLevelSchema = false;
  function checkTopLevelSchemaOption(options2) {
    if (warnedTopLevelSchema) return;
    if (typeof options2 !== "object" || options2 === null || !("schema" in options2) || options2.schema === void 0) return;
    warnedTopLevelSchema = true;
    console.warn(`@supabase/supabase-js: The "schema" option must be nested under "db", e.g. createClient(url, key, { db: { schema: 'myschema' } }). A top-level "schema" is ignored and queries go to the default schema.`);
  }
  function applySettingDefaults(options2, defaults) {
    var _DEFAULT_GLOBAL_OPTIO, _globalOptions$header, _ref, _tracePropagationOpti, _ref2, _tracePropagationOpti2;
    const { db: dbOptions, auth: authOptions, realtime: realtimeOptions, global: globalOptions } = options2;
    const { db: DEFAULT_DB_OPTIONS$1, auth: DEFAULT_AUTH_OPTIONS$1, realtime: DEFAULT_REALTIME_OPTIONS$1, global: DEFAULT_GLOBAL_OPTIONS$1 } = defaults;
    const tracePropagationOptions = normalizeTracePropagation(options2.tracePropagation);
    const DEFAULT_TRACE_PROPAGATION_OPTIONS$1 = normalizeTracePropagation(defaults.tracePropagation);
    const result = {
      db: _objectSpread23(_objectSpread23({}, DEFAULT_DB_OPTIONS$1), dbOptions),
      auth: _objectSpread23(_objectSpread23({}, DEFAULT_AUTH_OPTIONS$1), authOptions),
      realtime: _objectSpread23(_objectSpread23({}, DEFAULT_REALTIME_OPTIONS$1), realtimeOptions),
      storage: {},
      global: _objectSpread23(_objectSpread23(_objectSpread23({}, DEFAULT_GLOBAL_OPTIONS$1), globalOptions), {}, { headers: _objectSpread23(_objectSpread23({}, (_DEFAULT_GLOBAL_OPTIO = DEFAULT_GLOBAL_OPTIONS$1 === null || DEFAULT_GLOBAL_OPTIONS$1 === void 0 ? void 0 : DEFAULT_GLOBAL_OPTIONS$1.headers) !== null && _DEFAULT_GLOBAL_OPTIO !== void 0 ? _DEFAULT_GLOBAL_OPTIO : {}), (_globalOptions$header = globalOptions === null || globalOptions === void 0 ? void 0 : globalOptions.headers) !== null && _globalOptions$header !== void 0 ? _globalOptions$header : {}) }),
      tracePropagation: {
        enabled: (_ref = (_tracePropagationOpti = tracePropagationOptions === null || tracePropagationOptions === void 0 ? void 0 : tracePropagationOptions.enabled) !== null && _tracePropagationOpti !== void 0 ? _tracePropagationOpti : DEFAULT_TRACE_PROPAGATION_OPTIONS$1 === null || DEFAULT_TRACE_PROPAGATION_OPTIONS$1 === void 0 ? void 0 : DEFAULT_TRACE_PROPAGATION_OPTIONS$1.enabled) !== null && _ref !== void 0 ? _ref : false,
        respectSamplingDecision: (_ref2 = (_tracePropagationOpti2 = tracePropagationOptions === null || tracePropagationOptions === void 0 ? void 0 : tracePropagationOptions.respectSamplingDecision) !== null && _tracePropagationOpti2 !== void 0 ? _tracePropagationOpti2 : DEFAULT_TRACE_PROPAGATION_OPTIONS$1 === null || DEFAULT_TRACE_PROPAGATION_OPTIONS$1 === void 0 ? void 0 : DEFAULT_TRACE_PROPAGATION_OPTIONS$1.respectSamplingDecision) !== null && _ref2 !== void 0 ? _ref2 : true
      },
      accessToken: async () => ""
    };
    if (options2.accessToken) result.accessToken = options2.accessToken;
    else delete result.accessToken;
    return result;
  }
  function validateSupabaseUrl(supabaseUrl) {
    const trimmedUrl = supabaseUrl === null || supabaseUrl === void 0 ? void 0 : supabaseUrl.trim();
    if (!trimmedUrl) throw new Error("supabaseUrl is required.");
    if (!trimmedUrl.match(/^https?:\/\//i)) throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");
    try {
      return new URL(ensureTrailingSlash(trimmedUrl));
    } catch (_unused) {
      throw Error("Invalid supabaseUrl: Provided URL is malformed.");
    }
  }
  var SupabaseAuthClient = class extends AuthClient_default {
    constructor(options2) {
      super(options2);
    }
  };
  var SupabaseClient = class {
    /**
    * Create a new client for use in the browser.
    *
    * @category Initializing
    *
    * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
    * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
    * @param options Optional configuration for the client:
    * - `db.schema` — You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
    * - `auth.autoRefreshToken` — Set to `true` if you want to automatically refresh the token before expiring.
    * - `auth.persistSession` — Set to `true` if you want to automatically save the user session into local storage.
    * - `auth.detectSessionInUrl` — Set to `true` if you want to automatically detect OAuth grants in the URL and sign in the user.
    * - `realtime` — Options passed along to the realtime-js constructor.
    * - `storage` — Options passed along to the storage-js constructor.
    * - `global.fetch` — A custom fetch implementation.
    * - `global.headers` — Any additional headers to send with each network request.
    *
    * @example Creating a client
    * ```js
    * import { createClient } from '@supabase/supabase-js'
    *
    * // Create a single supabase client for interacting with your database
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    * ```
    *
    * @example With a custom domain
    * ```js
    * import { createClient } from '@supabase/supabase-js'
    *
    * // Use a custom domain as the supabase URL
    * const supabase = createClient('https://my-custom-domain.com', 'your-publishable-key')
    * ```
    *
    * @example With additional parameters
    * ```js
    * import { createClient } from '@supabase/supabase-js'
    *
    * const options = {
    *   db: {
    *     schema: 'public',
    *   },
    *   auth: {
    *     autoRefreshToken: true,
    *     persistSession: true,
    *     detectSessionInUrl: true
    *   },
    *   global: {
    *     headers: { 'x-my-custom-header': 'my-app-name' },
    *   },
    * }
    * const supabase = createClient("https://xyzcompany.supabase.co", "your-publishable-key", options)
    * ```
    *
    * @exampleDescription With custom schemas
    * By default the API server points to the `public` schema. You can enable other database schemas within the Dashboard.
    * Go to [Settings > API > Exposed schemas](/dashboard/project/_/settings/api) and add the schema which you want to expose to the API.
    *
    * Note: each client connection can only access a single schema, so the code above can access the `other_schema` schema but cannot access the `public` schema.
    *
    * @example With custom schemas
    * ```js
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key', {
    *   // Provide a custom schema. Defaults to "public".
    *   db: { schema: 'other_schema' }
    * })
    * ```
    *
    * @exampleDescription Custom fetch implementation
    * `supabase-js` uses the runtime's global `fetch` to make HTTP requests,
    * but an alternative `fetch` implementation can be provided as an option.
    * This is useful in environments where the global `fetch` is unavailable or where you want to customize request behavior.
    *
    * @example Custom fetch implementation
    * ```js
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key', {
    *   global: { fetch: fetch.bind(globalThis) }
    * })
    * ```
    *
    * @exampleDescription React Native options with AsyncStorage
    * For React Native we recommend using `AsyncStorage` as the storage implementation for Supabase Auth.
    *
    * @example React Native options with AsyncStorage
    * ```js
    * import 'react-native-url-polyfill/auto'
    * import { createClient } from '@supabase/supabase-js'
    * import AsyncStorage from "@react-native-async-storage/async-storage";
    *
    * const supabase = createClient("https://xyzcompany.supabase.co", "your-publishable-key", {
    *   auth: {
    *     storage: AsyncStorage,
    *     autoRefreshToken: true,
    *     persistSession: true,
    *     detectSessionInUrl: false,
    *   },
    * });
    * ```
    *
    * @exampleDescription React Native options with Expo SecureStore
    * If you wish to encrypt the user's session information, you can use `aes-js` and store the encryption key in Expo SecureStore.
    * The `aes-js` library, a reputable JavaScript-only implementation of the AES encryption algorithm in CTR mode.
    * A new 256-bit encryption key is generated using the `react-native-get-random-values` library.
    * This key is stored inside Expo's SecureStore, while the value is encrypted and placed inside AsyncStorage.
    *
    * Please make sure that:
    * - You keep the `expo-secure-store`, `aes-js` and `react-native-get-random-values` libraries up-to-date.
    * - Choose the correct [`SecureStoreOptions`](https://docs.expo.dev/versions/latest/sdk/securestore/#securestoreoptions) for your app's needs.
    *   E.g. [`SecureStore.WHEN_UNLOCKED`](https://docs.expo.dev/versions/latest/sdk/securestore/#securestorewhen_unlocked) regulates when the data can be accessed.
    * - Carefully consider optimizations or other modifications to the above example, as those can lead to introducing subtle security vulnerabilities.
    *
    * @example React Native options with Expo SecureStore
    * ```ts
    * import 'react-native-url-polyfill/auto'
    * import { createClient } from '@supabase/supabase-js'
    * import AsyncStorage from '@react-native-async-storage/async-storage';
    * import * as SecureStore from 'expo-secure-store';
    * import * as aesjs from 'aes-js';
    * import 'react-native-get-random-values';
    *
    * // As Expo's SecureStore does not support values larger than 2048
    * // bytes, an AES-256 key is generated and stored in SecureStore, while
    * // it is used to encrypt/decrypt values stored in AsyncStorage.
    * class LargeSecureStore {
    *   private async _encrypt(key: string, value: string) {
    *     const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    *
    *     const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    *     const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    *
    *     await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    *
    *     return aesjs.utils.hex.fromBytes(encryptedBytes);
    *   }
    *
    *   private async _decrypt(key: string, value: string) {
    *     const encryptionKeyHex = await SecureStore.getItemAsync(key);
    *     if (!encryptionKeyHex) {
    *       return encryptionKeyHex;
    *     }
    *
    *     const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
    *     const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    *
    *     return aesjs.utils.utf8.fromBytes(decryptedBytes);
    *   }
    *
    *   async getItem(key: string) {
    *     const encrypted = await AsyncStorage.getItem(key);
    *     if (!encrypted) { return encrypted; }
    *
    *     return await this._decrypt(key, encrypted);
    *   }
    *
    *   async removeItem(key: string) {
    *     await AsyncStorage.removeItem(key);
    *     await SecureStore.deleteItemAsync(key);
    *   }
    *
    *   async setItem(key: string, value: string) {
    *     const encrypted = await this._encrypt(key, value);
    *
    *     await AsyncStorage.setItem(key, encrypted);
    *   }
    * }
    *
    * const supabase = createClient("https://xyzcompany.supabase.co", "your-publishable-key", {
    *   auth: {
    *     storage: new LargeSecureStore(),
    *     autoRefreshToken: true,
    *     persistSession: true,
    *     detectSessionInUrl: false,
    *   },
    * });
    * ```
    *
    * @example With a database query
    * ```ts
    * import { createClient } from '@supabase/supabase-js'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key')
    *
    * const { data } = await supabase.from('profiles').select('*')
    * ```
    *
    * @exampleDescription With OpenTelemetry tracing
    * Opt in to W3C trace context propagation so the `trace_id` from your
    * client-side spans is attached to Supabase requests and appears in API
    * Gateway and Edge Function logs. Requires `@opentelemetry/api` to be
    * installed in your application and the tracing runtime to be loaded via
    * `import '@supabase/supabase-js/tracing'`. See [Tracing with the JS SDK](https://supabase.com/docs/guides/telemetry/client-side-tracing).
    *
    * @example With OpenTelemetry tracing
    * ```ts
    * import '@supabase/supabase-js/tracing'
    * import { createClient } from '@supabase/supabase-js'
    * import { trace } from '@opentelemetry/api'
    *
    * const supabase = createClient('https://xyzcompany.supabase.co', 'your-publishable-key', {
    *   tracePropagation: true,
    * })
    *
    * const tracer = trace.getTracer('my-app')
    *
    * await tracer.startActiveSpan('fetch-users', async (span) => {
    *   // Outgoing request carries the active trace context.
    *   const { data, error } = await supabase.from('users').select('*')
    *   span.end()
    * })
    * ```
    */
    constructor(supabaseUrl, supabaseKey, options2) {
      var _settings$auth$storag, _settings$global$head;
      this.supabaseUrl = supabaseUrl;
      this.supabaseKey = supabaseKey;
      const baseUrl = validateSupabaseUrl(supabaseUrl);
      if (!supabaseKey) throw new Error("supabaseKey is required.");
      checkApiKeyFormat(supabaseKey);
      checkTopLevelSchemaOption(options2);
      this.realtimeUrl = new URL("realtime/v1", baseUrl);
      this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws");
      this.authUrl = new URL("auth/v1", baseUrl);
      this.storageUrl = new URL("storage/v1", baseUrl);
      this.functionsUrl = new URL("functions/v1", baseUrl);
      const defaultStorageKey = `sb-${baseUrl.hostname.split(".")[0]}-auth-token`;
      const DEFAULTS = {
        db: DEFAULT_DB_OPTIONS,
        realtime: DEFAULT_REALTIME_OPTIONS,
        auth: _objectSpread23(_objectSpread23({}, DEFAULT_AUTH_OPTIONS), {}, { storageKey: defaultStorageKey }),
        global: DEFAULT_GLOBAL_OPTIONS,
        tracePropagation: DEFAULT_TRACE_PROPAGATION_OPTIONS
      };
      const settings = applySettingDefaults(options2 !== null && options2 !== void 0 ? options2 : {}, DEFAULTS);
      this.settings = settings;
      this.storageKey = (_settings$auth$storag = settings.auth.storageKey) !== null && _settings$auth$storag !== void 0 ? _settings$auth$storag : "";
      this.headers = (_settings$global$head = settings.global.headers) !== null && _settings$global$head !== void 0 ? _settings$global$head : {};
      if (!settings.accessToken) {
        var _settings$auth;
        this.auth = this._initSupabaseAuthClient((_settings$auth = settings.auth) !== null && _settings$auth !== void 0 ? _settings$auth : {}, this.headers, settings.global.fetch);
      } else {
        this.accessToken = settings.accessToken;
        this.auth = new Proxy({}, { get: (_, prop) => {
          throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(prop)} is not possible`);
        } });
      }
      this.fetch = fetchWithAuth(supabaseKey, supabaseUrl, this._getSessionToken.bind(this), settings.global.fetch, settings.tracePropagation);
      this.functionsFetch = fetchWithAuth(supabaseKey, supabaseUrl, this._getSessionToken.bind(this), settings.global.fetch, settings.tracePropagation, { omitApiKeyAsBearer: true });
      this.realtime = this._initRealtimeClient(_objectSpread23({
        headers: this.headers,
        accessToken: this._getAccessToken.bind(this),
        fetch: this.fetch
      }, settings.realtime));
      if (this.accessToken) Promise.resolve(this.accessToken()).then((token) => this.realtime.setAuth(token)).catch((e) => console.warn("Failed to set initial Realtime auth token:", e));
      this.rest = new PostgrestClient(new URL("rest/v1", baseUrl).href, {
        headers: this.headers,
        schema: settings.db.schema,
        fetch: resolveFetch4(settings.global.fetch),
        wrapFetch: (fetch$1) => fetchWithAuth(supabaseKey, supabaseUrl, this._getSessionToken.bind(this), fetch$1, settings.tracePropagation),
        timeout: settings.db.timeout,
        urlLengthLimit: settings.db.urlLengthLimit,
        retry: settings.db.retry
      });
      this.storage = new StorageClient(this.storageUrl.href, this.headers, this.fetch, options2 === null || options2 === void 0 ? void 0 : options2.storage);
      if (!settings.accessToken) this._listenForAuthEvents();
    }
    /**
    * Supabase Functions allows you to deploy and invoke edge functions.
    */
    get functions() {
      return new FunctionsClient(this.functionsUrl.href, {
        headers: this.headers,
        customFetch: this.functionsFetch
      });
    }
    /**
    * Perform a query on a table or a view.
    *
    * A per-request `fetch` is wrapped the same way as the client-level fetch: the
    * `apikey`, `Authorization` and trace headers are added before it is called.
    * The same applies to clients returned by `.schema()`.
    *
    * @param relation - The table or view name to query
    * @param options - Per-request options that override client-level defaults
    *
    * @example Per-request fetch options
    * ```ts
    * const { data } = await supabase
    *   .from('countries', {
    *     fetch: (input, init) => fetch(input, { ...init, cache: 'force-cache' }),
    *   })
    *   .select('*')
    * ```
    */
    from(relation, options2) {
      return this.rest.from(relation, options2);
    }
    /**
    * Select a schema to query or perform an function (rpc) call.
    *
    * The schema needs to be on the list of exposed schemas inside Supabase.
    *
    * @param schema - The schema to query
    */
    schema(schema) {
      return this.rest.schema(schema);
    }
    /**
    * Fetch the OpenAPI description PostgREST publishes for this client's schema.
    *
    * The document lists only the tables, views and functions the caller's role
    * holds privileges on. The request carries the same `apikey` and
    * `Authorization` headers as every other query, so the description is scoped
    * to the signed-in user. Call `.schema()` first to describe a schema other
    * than the client default.
    *
    * @example
    * ```ts
    * const { data, error } = await supabase.getOpenApiSpec()
    * ```
    */
    getOpenApiSpec() {
      return this.rest.getOpenApiSpec();
    }
    /**
    * Perform a function call.
    *
    * @param fn - The function name to call
    * @param args - The arguments to pass to the function call
    * @param options - Named parameters
    * @param options.head - When set to `true`, `data` will not be returned.
    * Useful if you only need the count.
    * @param options.get - When set to `true`, the function will be called with
    * read-only access mode.
    * @param options.count - Count algorithm to use to count rows returned by the
    * function. Only applicable for [set-returning
    * functions](https://www.postgresql.org/docs/current/functions-srf.html).
    *
    * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
    * hood.
    *
    * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
    * statistics under the hood.
    *
    * `"estimated"`: Uses exact count for low numbers and planned count for high
    * numbers.
    */
    rpc(fn, args = {}, options2 = {
      head: false,
      get: false,
      count: void 0
    }) {
      return this.rest.rpc(fn, args, options2);
    }
    /**
    * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
    *
    * @param {string} name - The name of the Realtime channel.
    * @param {Object} opts - The options to pass to the Realtime channel.
    *
    * @category Realtime
    */
    channel(name, opts = { config: {} }) {
      return this.realtime.channel(name, opts);
    }
    /**
    * Returns all Realtime channels.
    *
    * @category Realtime
    *
    * @example Get all channels
    * ```js
    * const channels = supabase.getChannels()
    * ```
    */
    getChannels() {
      return this.realtime.getChannels();
    }
    /**
    * Unsubscribes and removes Realtime channel from Realtime client.
    *
    * @param {RealtimeChannel} channel - The name of the Realtime channel.
    *
    *
    * @category Realtime
    *
    * @remarks
    * - Removing a channel is a great way to maintain the performance of your project's Realtime service as well as your database if you're listening to Postgres changes. Supabase will automatically handle cleanup 30 seconds after a client is disconnected, but unused channels may cause degradation as more clients are simultaneously subscribed.
    *
    * @example Removes a channel
    * ```js
    * supabase.removeChannel(myChannel)
    * ```
    */
    removeChannel(channel) {
      return this.realtime.removeChannel(channel);
    }
    /**
    * Unsubscribes and removes all Realtime channels from Realtime client.
    *
    * @category Realtime
    *
    * @remarks
    * - Removing channels is a great way to maintain the performance of your project's Realtime service as well as your database if you're listening to Postgres changes. Supabase will automatically handle cleanup 30 seconds after a client is disconnected, but unused channels may cause degradation as more clients are simultaneously subscribed.
    *
    * @example Remove all channels
    * ```js
    * supabase.removeAllChannels()
    * ```
    */
    removeAllChannels() {
      return this.realtime.removeAllChannels();
    }
    /**
    * The raw session token — the custom `accessToken` result or the signed-in user's JWT —
    * or `null` when there is no session. Unlike {@link _getAccessToken} it does not fall back
    * to `supabaseKey`, so callers can distinguish "no session" from "has session".
    */
    async _getSessionToken() {
      var _this = this;
      var _data$session$access_, _data$session;
      if (_this.accessToken) return await _this.accessToken();
      const { data } = await _this.auth.getSession();
      return (_data$session$access_ = (_data$session = data.session) === null || _data$session === void 0 ? void 0 : _data$session.access_token) !== null && _data$session$access_ !== void 0 ? _data$session$access_ : null;
    }
    async _getAccessToken() {
      var _this2 = this;
      var _await$this$_getSessi;
      return (_await$this$_getSessi = await _this2._getSessionToken()) !== null && _await$this$_getSessi !== void 0 ? _await$this$_getSessi : _this2.supabaseKey;
    }
    _initSupabaseAuthClient({ autoRefreshToken, persistSession, detectSessionInUrl, storage, userStorage, storageKey, flowType, lock, debug, throwOnError, experimental, lockAcquireTimeout, skipAutoInitialize }, headers, fetch$1) {
      const authHeaders = {
        Authorization: `Bearer ${this.supabaseKey}`,
        apikey: `${this.supabaseKey}`
      };
      return new SupabaseAuthClient({
        url: this.authUrl.href,
        headers: _objectSpread23(_objectSpread23({}, authHeaders), headers),
        storageKey,
        autoRefreshToken,
        persistSession,
        detectSessionInUrl,
        storage,
        userStorage,
        flowType,
        lock,
        debug,
        throwOnError,
        experimental,
        fetch: fetch$1,
        lockAcquireTimeout,
        skipAutoInitialize,
        hasCustomAuthorizationHeader: Object.keys(this.headers).some((key) => key.toLowerCase() === "authorization")
      });
    }
    _initRealtimeClient(options2) {
      return new RealtimeClient(this.realtimeUrl.href, _objectSpread23(_objectSpread23({}, options2), {}, { params: _objectSpread23(_objectSpread23({}, { apikey: this.supabaseKey }), options2 === null || options2 === void 0 ? void 0 : options2.params) }));
    }
    _listenForAuthEvents() {
      return this.auth.onAuthStateChange((event, session) => {
        this._handleTokenChanged(event, "CLIENT", session === null || session === void 0 ? void 0 : session.access_token);
      });
    }
    _handleTokenChanged(event, source, token) {
      if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION") && this.changedAccessToken !== token) {
        this.changedAccessToken = token;
        this.realtime.setAuth(token);
      } else if (event === "SIGNED_OUT") {
        this.realtime.setAuth();
        if (source == "STORAGE") this.auth.signOut();
        this.changedAccessToken = void 0;
      }
    }
  };
  var createClient = (supabaseUrl, supabaseKey, options2) => {
    return new SupabaseClient(supabaseUrl, supabaseKey, options2);
  };
  function shouldShowDeprecationWarning() {
    if (typeof window !== "undefined" || globalThis["Deno"] !== void 0) return false;
    const _process = globalThis["process"];
    if (!_process) return false;
    const processVersion = _process["version"];
    if (processVersion === void 0 || processVersion === null) return false;
    const versionMatch = processVersion.match(/^v(\d+)\./);
    if (!versionMatch) return false;
    return parseInt(versionMatch[1], 10) <= 20;
  }
  if (shouldShowDeprecationWarning()) console.warn("\u26A0\uFE0F  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715");

  // app/static/ts/app.ts
  var KEY_PREFIX = "vines-club-hub-v1:";
  var KEY = "";
  var SHARED_WRITES_ENABLED = true;
  var starter = {
    departments: [
      {
        name: "Marketing",
        head: "",
        description: "Campaigns, promotion and audience growth."
      },
      {
        name: "HR",
        head: "",
        description: "Recruitment, onboarding and member care."
      },
      {
        name: "PR",
        head: "",
        description: "University, guest and partner relations."
      },
      {
        name: "Editing",
        head: "",
        description: "Editing guidance, feedback and quality."
      },
      {
        name: "Designing",
        head: "",
        description: "Visual identity, thumbnails and graphics."
      },
      {
        name: "Videography",
        head: "",
        description: "Camera, lighting, sound and filming."
      },
      {
        name: "Educational",
        head: "",
        description: "Workshop planning and learning."
      },
      {
        name: "Actors",
        head: "",
        description: "On-camera talent and performance."
      },
      {
        name: "Researchers",
        head: "",
        description: "Research, scripts and fact checking."
      },
      {
        name: "OC",
        head: "",
        description: "Event logistics and club operations."
      }
    ],
    projects: [
      {
        name: "Podcasts",
        lead: "",
        description: "Conversations worth listening to."
      },
      { name: "Workshops", lead: "", description: "Learn it, try it, teach it." },
      {
        name: "Game Show",
        lead: "",
        description: "Big energy, friendly competition."
      },
      {
        name: "Reels",
        lead: "",
        description: "Short stories with a quick spark."
      },
      {
        name: "Sarcastic Shows",
        lead: "",
        description: "Satire and campus stories."
      }
    ],
    members: [],
    tasks: []
  };
  var db = structuredClone(starter);
  var role = "";
  var selectedPerson = "";
  var structureMode = "structure";
  var structureSelection = null;
  var structureDetailKey = "";
  var structureDetailTimer = 0;
  var animateStructureClose = false;
  var calendarMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
  var supabase = null;
  var authUser = null;
  var authProfile = null;
  var currentPositions = [];
  var positionsCatalog = [];
  var sessionReady = false;
  var syncedDb = null;
  var saveQueue = Promise.resolve();
  var passwordSetupFlow = false;
  var inviteSetupFlow = false;
  var profileSetupPending = false;
  var openingSessionFor = "";
  var $ = (id) => document.getElementById(id);
  function authNotice(message = "", isError = false) {
    const notice = $("authMessage");
    notice.textContent = message;
    notice.classList.toggle("error", isError);
  }
  var HUB_PATH = "/";
  var LOGIN_PATH = "/login";
  var onLoginPage = window.location.pathname.replace(/\/+$/, "") === LOGIN_PATH;
  var AUTH_NOTICE_KEY = "vines-auth-notice";
  function go(path) {
    window.location.replace(path);
  }
  function reveal(which) {
    $("bootSplash").classList.add("hidden");
    $("authGate").classList.toggle("hidden", which !== "gate");
    $("profileGate").classList.toggle("hidden", which !== "profile");
    $("appShell").classList.toggle("hidden", which !== "app");
  }
  var FACULTIES = [
    "Engineering",
    "Computer Science",
    "Business Informatics",
    "Digital Arts and Design"
  ];
  var COUNTRIES = [
    { name: "Egypt", dial: "20" },
    { name: "Saudi Arabia", dial: "966" },
    { name: "United Arab Emirates", dial: "971" },
    { name: "Kuwait", dial: "965" },
    { name: "Qatar", dial: "974" },
    { name: "Jordan", dial: "962" },
    { name: "Libya", dial: "218" },
    { name: "Sudan", dial: "249" },
    { name: "Germany", dial: "49" },
    { name: "United Kingdom", dial: "44" },
    { name: "United States / Canada", dial: "1" }
  ];
  function splitPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    const match = [...COUNTRIES].sort((x, y) => y.dial.length - x.dial.length).find((c) => digits.startsWith(c.dial));
    return match ? { dial: match.dial, number: digits.slice(match.dial.length) } : { dial: "20", number: digits };
  }
  function normalizePhone(dial, raw) {
    let digits = String(raw || "").replace(/[\s\-().]/g, "");
    if (!digits) return "";
    if (!/^\d+$/.test(digits)) return null;
    digits = digits.replace(/^0+/, "");
    if (dial === "20")
      return /^1[0125]\d{8}$/.test(digits) ? "+20" + digits : null;
    return digits.length >= 6 && digits.length <= 12 ? "+" + dial + digits : null;
  }
  var YEAR_NAMES = ["1st", "2nd", "3rd", "4th", "5th"];
  function yearsFor(faculty) {
    return faculty === "Engineering" ? 5 : 4;
  }
  function splitName(full) {
    const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || "", last: parts.slice(1).join(" ") };
  }
  function avatarUrl(path) {
    if (!supabase || !path) return "";
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }
  function setAvatar(el, path, name) {
    const url = avatarUrl(path);
    el.style.backgroundImage = url ? `url("${url}")` : "";
    el.textContent = url ? "" : initials(name);
  }
  function profileMissing(profile) {
    const missing = [];
    if (!profile?.avatar_path) missing.push("profile photo");
    if (!profile?.phone) missing.push("phone number");
    if (!profile?.faculty) missing.push("faculty");
    if (!profile?.study_year) missing.push("year of study");
    return missing;
  }
  function squarePhoto(file) {
    return new Promise((resolve, reject) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        return reject(new Error("Choose a JPG, PNG or WebP image."));
      if (file.size > 8 * 1024 * 1024)
        return reject(new Error("That photo is too large. Use one under 8 MB."));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read that photo."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Could not read that photo."));
        image.onload = () => {
          const side = Math.min(image.width, image.height);
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 400;
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("Could not process the photo."));
          context.drawImage(
            image,
            (image.width - side) / 2,
            (image.height - side) / 2,
            side,
            side,
            0,
            0,
            400,
            400
          );
          const preview = canvas.toDataURL("image/jpeg", 0.85);
          canvas.toBlob(
            (blob) => blob ? resolve({ blob, preview }) : reject(new Error("Could not process the photo.")),
            "image/jpeg",
            0.85
          );
        };
        image.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
  function mountProfileForm(host, prefix, profile, options2) {
    const names = splitName(profile.name);
    const phoneParts = splitPhone(profile.phone || "");
    const state = {
      blob: null,
      path: profile.avatar_path || "",
      previous: profile.avatar_path || ""
    };
    const facultyOptions = [...FACULTIES];
    if (profile.faculty && !facultyOptions.includes(profile.faculty))
      facultyOptions.push(profile.faculty);
    host.innerHTML = `<form class="pf" novalidate>
    <div class="pf-photo">
      <div class="pf-avatar" id="${prefix}Avatar" aria-hidden="true"></div>
      <div class="pf-photo-actions">
        <div class="pf-photo-buttons">
          <button class="btn ghost" type="button" id="${prefix}Upload">Upload a photo</button>
          <button class="btn ghost" type="button" id="${prefix}Remove">Remove</button>
        </div>
        <div class="pf-hint">JPG, PNG or WebP. Square works best. You can change it later.</div>
        <input type="file" id="${prefix}File" accept="image/jpeg,image/png,image/webp" hidden />
      </div>
    </div>
    <div class="pf-row">
      <div class="pf-field"><label for="${prefix}First">First name</label>
        <input id="${prefix}First" autocomplete="given-name" maxlength="60" value="${esc(names.first)}" /></div>
      <div class="pf-field"><label for="${prefix}Last">Last name</label>
        <input id="${prefix}Last" autocomplete="family-name" maxlength="60" value="${esc(names.last)}" /></div>
    </div>
    <div class="pf-hint" style="margin-top:-10px">Filled in from the name on your invitation. Change it if it is not right.</div>
    <div class="pf-field"><label for="${prefix}Email">Email</label>
      <input id="${prefix}Email" type="email" readonly value="${esc(profile.email)}" />
      <div class="pf-hint">Your email is tied to your invitation and can only be changed by the system admin.</div></div>
    <div class="pf-field"><label for="${prefix}Phone">Phone number</label>
      <div class="pf-phone">
        <select id="${prefix}Dial" aria-label="Country code">${COUNTRIES.map((c) => `<option value="${c.dial}" ${c.dial === phoneParts.dial ? "selected" : ""}>${esc(c.name)} (+${c.dial})</option>`).join("")}</select>
        <input id="${prefix}Phone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="20" value="${esc(phoneParts.number)}" placeholder="10 1234 5678" />
      </div>
      <div class="pf-hint">Egypt is selected by default. Club leaders and teammates on your projects can see it.</div></div>
    <div class="pf-row">
      <div class="pf-field"><label for="${prefix}Faculty">Faculty</label>
        <select id="${prefix}Faculty"><option value="">Choose your faculty</option>${options_(facultyOptions, profile.faculty || "")}</select></div>
      <div class="pf-field"><label for="${prefix}Year">Year of study</label>
        <select id="${prefix}Year"></select></div>
    </div>
    <div class="pf-error" id="${prefix}Error" role="alert"></div>
    <div class="pf-actions${options2.stacked ? " stacked" : ""}">
      <button class="btn lime" type="submit" id="${prefix}Save">${esc(options2.submitLabel)}</button>
      ${options2.stacked ? "" : `<button class="btn ghost" type="button" id="${prefix}Cancel">Cancel</button>`}
    </div></form>`;
    const q = (id) => host.querySelector("#" + prefix + id);
    const fillYears = (selected) => {
      const count = yearsFor(q("Faculty").value);
      q("Year").innerHTML = `<option value="">Choose your year</option>` + YEAR_NAMES.slice(0, count).map(
        (name, i) => `<option value="${i + 1}" ${String(i + 1) === selected ? "selected" : ""}>${name} year</option>`
      ).join("");
    };
    fillYears(profile.study_year ? String(profile.study_year) : "");
    q("Faculty").onchange = () => {
      const kept = q("Year").value;
      fillYears(Number(kept) <= yearsFor(q("Faculty").value) ? kept : "");
    };
    const showAvatar = (preview = "") => {
      const box = q("Avatar");
      const name = `${q("First").value} ${q("Last").value}`;
      if (preview) box.style.backgroundImage = `url("${preview}")`;
      else if (state.path && !state.blob)
        box.style.backgroundImage = `url("${avatarUrl(state.path)}")`;
      else box.style.backgroundImage = "";
      const has = Boolean(
        preview || state.path && !state.blob && avatarUrl(state.path)
      );
      box.classList.toggle("has-photo", has);
      box.textContent = has ? "" : initials(name);
      q("Remove").hidden = !has;
    };
    showAvatar();
    q("First").oninput = q("Last").oninput = () => {
      if (!q("Avatar").classList.contains("has-photo")) showAvatar();
    };
    q("Upload").onclick = () => q("File").click();
    q("File").onchange = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      try {
        const photo = await squarePhoto(file);
        state.blob = photo.blob;
        q("Error").textContent = "";
        showAvatar(photo.preview);
      } catch (error) {
        q("Error").textContent = error instanceof Error ? error.message : "Could not use that photo.";
      }
    };
    q("Remove").onclick = () => {
      state.blob = null;
      state.path = "";
      showAvatar();
    };
    const cancel = q("Cancel");
    if (cancel) cancel.onclick = () => options2.onSaved();
    const submit = host.querySelector("form");
    submit.onsubmit = async (event) => {
      event.preventDefault();
      const first = q("First").value.trim();
      const last = q("Last").value.trim();
      const faculty = q("Faculty").value;
      const year = q("Year").value ? Number(q("Year").value) : null;
      const phone = normalizePhone(q("Dial").value, q("Phone").value);
      q("Error").textContent = "";
      if (phone === null) {
        q("Error").textContent = q("Dial").value === "20" ? "Enter an Egyptian mobile number, like 010 1234 5678." : "Enter a valid phone number.";
        return;
      }
      if (!first) {
        q("Error").textContent = "Enter your first name.";
        return;
      }
      if (year && year > yearsFor(faculty)) {
        q("Error").textContent = "Choose a valid year for that faculty.";
        return;
      }
      const button = q("Save");
      button.disabled = true;
      try {
        await saveOwnProfile({
          name: `${first} ${last}`.trim(),
          faculty,
          year,
          phone,
          blob: state.blob,
          path: state.path,
          previous: state.previous,
          status: faculty && year && phone ? "Complete" : "Pending"
        });
        options2.onSaved();
      } catch (error) {
        q("Error").textContent = error instanceof Error ? error.message : "Could not save your profile.";
      } finally {
        button.disabled = false;
      }
    };
  }
  function options_(list, selected) {
    return options(list, selected);
  }
  async function saveOwnProfile(input) {
    if (!supabase || !authProfile) throw new Error("You are not signed in.");
    let path = input.path;
    if (input.blob) {
      path = `${authProfile.id}/avatar-${Date.now()}.jpg`;
      const { error: error2 } = await supabase.storage.from("avatars").upload(path, input.blob, { contentType: "image/jpeg" });
      if (error2)
        throw new Error(
          "Your photo could not be uploaded. Try a smaller image or try again."
        );
    }
    const { error } = await supabase.rpc("update_own_profile", {
      p_name: input.name,
      p_faculty: input.faculty || null,
      p_study_year: input.year,
      p_avatar_path: path || null,
      p_profile_status: input.status,
      p_phone: input.phone || null
    });
    if (error) {
      if (input.blob) await supabase.storage.from("avatars").remove([path]);
      throw new Error(
        error.message.includes("function") ? "Profile saving is not set up in Supabase yet. Ask the system admin to run shared-app/profile-update.sql." : error.message
      );
    }
    if (input.previous && input.previous !== path)
      void supabase.storage.from("avatars").remove([input.previous]);
    applyOwnProfile({
      name: input.name,
      faculty: input.faculty || null,
      study_year: input.year,
      avatar_path: path || null,
      profile_status: input.status,
      phone: input.phone || null
    });
  }
  function applyOwnProfile(fields) {
    Object.assign(authProfile, fields);
    const map = {
      name: "name",
      faculty: "faculty",
      study_year: "studyYear",
      avatar_path: "avatarPath",
      profile_status: "profileStatus",
      phone: "phone"
    };
    for (const list of [db, syncedDb]) {
      const me = list?.members?.find((m) => m.id === authProfile.id);
      if (!me) continue;
      for (const [column, key] of Object.entries(map))
        if (column in fields)
          me[key] = fields[column] ?? (key === "phone" ? "" : null);
    }
    paintChip();
    render();
  }
  function paintChip() {
    if (!authProfile) return;
    $("signedInAs").textContent = authProfile.name || authProfile.email;
    setAvatar($("chipAvatar"), authProfile.avatar_path, authProfile.name);
  }
  var STEPS = [
    "Create your password",
    "Complete your profile",
    "Open your workspace"
  ];
  function setAuthSide(mode) {
    const copy = {
      login: [
        "Welcome to Vines",
        "Make something people remember.",
        "People bring the skills. Projects bring the stories. This is where they meet."
      ],
      invite: [
        "You are invited",
        "Join the crew in three quick steps.",
        "Create a password, tell us a little about yourself, and you are in."
      ],
      recovery: [
        "Almost back in",
        "Choose a new password.",
        "Pick something you have not used before. You will be signed in right after."
      ],
      profile: [
        "Welcome to Vines",
        "Tell us who is joining the crew.",
        "A photo, your faculty and your year help department heads and teammates know who they are working with."
      ]
    }[mode];
    const step = mode === "invite" ? 0 : mode === "profile" ? 1 : -1;
    document.querySelectorAll("[data-pitch-kicker]").forEach((el) => {
      el.textContent = copy[0];
    });
    document.querySelectorAll("[data-pitch-title]").forEach((el) => {
      el.textContent = copy[1];
    });
    document.querySelectorAll("[data-pitch-copy]").forEach((el) => {
      el.textContent = copy[2];
    });
    document.querySelectorAll("[data-auth-steps]").forEach((list) => {
      list.hidden = step < 0;
      list.innerHTML = STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "";
        return `<li class="${state}"><span class="dot" aria-hidden="true">${i < step ? "\u2713" : i + 1}</span>${esc(label)}</li>`;
      }).join("");
    });
    $("authEyebrow").textContent = mode === "invite" ? "Step 1 of 3" : "Members workspace";
  }
  function rememberNotice(message, isError) {
    try {
      sessionStorage.setItem(
        AUTH_NOTICE_KEY,
        JSON.stringify({ message, isError })
      );
    } catch {
    }
  }
  function takeNotice() {
    try {
      const raw = sessionStorage.getItem(AUTH_NOTICE_KEY);
      sessionStorage.removeItem(AUTH_NOTICE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return typeof parsed?.message === "string" ? {
        message: parsed.message.slice(0, 300),
        isError: parsed.isError === true
      } : null;
    } catch {
      return null;
    }
  }
  function sendToLogin(message = "", isError = false) {
    forgetSetup();
    if (onLoginPage) {
      showAuthGate(message, isError);
      return;
    }
    rememberNotice(message, isError);
    go(LOGIN_PATH);
  }
  var linkToken = new URLSearchParams(window.location.hash.slice(1)).get("access_token") || "";
  var SETUP_KEY = "vines-password-setup";
  function rememberSetup(flow, userId) {
    try {
      sessionStorage.setItem(SETUP_KEY, JSON.stringify({ flow, userId }));
    } catch {
    }
  }
  function pendingSetup(userId) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SETUP_KEY) || "null");
      return saved?.userId === userId && (saved.flow === "invite" || saved.flow === "recovery") ? saved.flow : "";
    } catch {
      return "";
    }
  }
  function forgetSetup() {
    try {
      sessionStorage.removeItem(SETUP_KEY);
    } catch {
    }
  }
  function readSetupFlow() {
    const value = new URLSearchParams(window.location.search).get("flow") || new URLSearchParams(window.location.hash.slice(1)).get("type") || "";
    return value === "invite" || value === "recovery" ? value : "";
  }
  function tidyUrl() {
    if (window.location.search || window.location.hash)
      window.history.replaceState(null, "", window.location.pathname);
  }
  function showAuthGate(message = "", isError = false) {
    reveal("gate");
    $("loginForm").classList.remove("hidden");
    $("setPasswordForm").classList.add("hidden");
    $("authTitle").textContent = "Welcome back";
    $("authCopy").textContent = "Sign in with the email and password from your Vines invitation.";
    setAuthSide("login");
    authNotice(message, isError);
  }
  async function openWorkspace(user) {
    if (!supabase || !user?.email) return;
    if (passwordSetupFlow) {
      reveal("gate");
      $("loginForm").classList.add("hidden");
      $("setPasswordForm").classList.remove("hidden");
      return;
    }
    if (sessionReady && authUser?.id === user.id) return;
    if (openingSessionFor === user.id) return;
    openingSessionFor = user.id;
    const { data: profile, error } = await supabase.from("members").select(
      "id,name,email,club_role,is_club_admin,status,faculty,study_year,avatar_path,profile_status,phone"
    ).ilike("email", user.email).maybeSingle();
    if (error || !profile) {
      openingSessionFor = "";
      await supabase.auth.signOut();
      sendToLogin(
        "This email is not linked to a Vines member profile. Ask the system admin for help.",
        true
      );
      return;
    }
    if (profile.status !== "Active") {
      openingSessionFor = "";
      await supabase.auth.signOut();
      sendToLogin(
        "Your Vines invitation is not active yet. Ask the system admin to check your profile.",
        true
      );
      return;
    }
    if (onLoginPage) {
      go(HUB_PATH);
      return;
    }
    authUser = user;
    authProfile = profile;
    const [positionsResult, catalogResult, workspace] = await Promise.all([
      supabase.from("member_positions").select("position_id,department_id,project_id").eq("member_id", profile.id),
      supabase.from("positions").select("id,name"),
      loadSharedWorkspace().then(
        (value) => ({ value, failure: null }),
        (failure) => ({ value: null, failure })
      )
    ]);
    if (positionsResult.error || catalogResult.error) {
      openingSessionFor = "";
      await supabase.auth.signOut();
      sendToLogin(
        "Your profile is linked, but role data is not ready. Ask the system admin to check the matrix migration.",
        true
      );
      return;
    }
    const positionNames = new Map(
      catalogResult.data.map((item) => [item.id, item.name])
    );
    currentPositions = positionsResult.data.map((item) => positionNames.get(item.position_id)).filter(Boolean);
    positionsCatalog = catalogResult.data || [];
    role = profile.is_club_admin ? "System admin access" : currentPositions.includes("President") ? "President" : currentPositions.includes("Vice President") ? "Vice President" : currentPositions.includes("Department Head") ? "Department Head" : currentPositions.includes("Project Head") ? "Project Head" : profile.club_role;
    selectedPerson = profile.id;
    KEY = `${KEY_PREFIX}${String(profile.email).toLowerCase()}`;
    try {
      if (workspace.failure) throw workspace.failure;
      db = workspace.value;
      if (db.departments.some((department) => department.head === profile.id))
        currentPositions.push("Department Head");
      if (db.projects.some((project) => project.lead === profile.id))
        currentPositions.push("Project Head");
      currentPositions = [...new Set(currentPositions)];
      if (!profile.is_club_admin) {
        role = ["President", "Vice President", "Department Head", "Project Head"].find(
          (position) => currentPositions.includes(position)
        ) || profile.club_role;
      }
    } catch (loadError) {
      openingSessionFor = "";
      await supabase.auth.signOut();
      sendToLogin(
        loadError instanceof Error ? loadError.message : "Could not load the shared workspace.",
        true
      );
      return;
    }
    sessionReady = true;
    syncedDb = structuredClone(db);
    openingSessionFor = "";
    paintChip();
    render();
    if (profileSetupPending && profile.profile_status === "Pending") {
      profileSetupPending = false;
      showProfileSetup();
      return;
    }
    profileSetupPending = false;
    reveal("app");
  }
  function showProfileSetup() {
    setAuthSide("profile");
    mountProfileForm($("profileSetupHost"), "ps", authProfile, {
      submitLabel: "Save and continue",
      stacked: true,
      onSaved: () => {
        reveal("app");
        show("home");
      }
    });
    reveal("profile");
  }
  $("profileLater").addEventListener("click", async () => {
    const button = $("profileLater");
    button.disabled = true;
    try {
      if (supabase && authProfile && authProfile.profile_status === "Pending") {
        await supabase.rpc("update_own_profile", {
          p_name: authProfile.name,
          p_faculty: authProfile.faculty || null,
          p_study_year: authProfile.study_year || null,
          p_avatar_path: authProfile.avatar_path || null,
          p_profile_status: "Skipped",
          p_phone: authProfile.phone || null
        });
        applyOwnProfile({ profile_status: "Skipped" });
      }
    } catch {
    }
    button.disabled = false;
    reveal("app");
    show("home");
  });
  async function initializeSupabase() {
    try {
      const configResponse = await fetch("/api/config", { cache: "no-store" });
      const config = await configResponse.json();
      if (!config.supabaseUrl || !config.supabasePublishableKey)
        throw new Error(
          "Supabase settings are not configured for this site yet."
        );
      supabase = createClient(config.supabaseUrl, config.supabasePublishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      const requestedFlow = onLoginPage ? "" : readSetupFlow();
      const { data } = await supabase.auth.getSession();
      let flow = "";
      if (!onLoginPage && data.session) {
        const linkWorked = requestedFlow !== "" && linkToken !== "" && data.session.access_token === linkToken;
        if (linkWorked) {
          flow = requestedFlow;
          rememberSetup(flow, data.session.user.id);
        } else flow = pendingSetup(data.session.user.id);
      }
      inviteSetupFlow = flow === "invite";
      passwordSetupFlow = flow !== "";
      if (passwordSetupFlow) {
        $("loginForm").classList.add("hidden");
        $("setPasswordForm").classList.remove("hidden");
        $("authTitle").textContent = "Create your password";
        $("authCopy").textContent = "Create a password to finish setting up your Vines account.";
        setAuthSide(inviteSetupFlow ? "invite" : "recovery");
      }
      if (!passwordSetupFlow) tidyUrl();
      if (data.session) await openWorkspace(data.session.user);
      else if (requestedFlow)
        sendToLogin(
          "This link has expired or was already used. Ask the system admin for a new invitation, or use Forgot password.",
          true
        );
      else if (onLoginPage) {
        const notice = takeNotice();
        showAuthGate(notice?.message || "", notice?.isError);
      } else sendToLogin();
      supabase.auth.onAuthStateChange((_event, session) => {
        window.setTimeout(() => {
          if (session) void openWorkspace(session.user);
          else if (sessionReady) {
            sessionReady = false;
            authUser = null;
            authProfile = null;
            currentPositions = [];
            openingSessionFor = "";
            role = "";
            selectedPerson = "";
            sendToLogin("You have signed out.");
          }
        }, 0);
      });
    } catch (error) {
      sendToLogin(
        error instanceof Error ? error.message : "Could not connect to Supabase.",
        true
      );
    }
  }
  async function loadSharedWorkspace() {
    if (!supabase) throw new Error("Supabase is not connected.");
    const results = await Promise.all([
      supabase.from("members").select(
        "id,name,email,club_role,department_id,is_club_admin,status,faculty,study_year,avatar_path,profile_status,phone"
      ),
      supabase.from("departments").select("id,name,description,head_member_id"),
      supabase.from("projects").select("id,name,description,project_lead_id,status"),
      supabase.from("member_departments").select("member_id,department_id"),
      supabase.from("project_assignments").select("member_id,project_id,status,role_on_project"),
      supabase.from("tasks").select(
        "id,title,description,task_type,project_id,department_id,assignee_id,assigned_by,status,priority,due_at,progress_update"
      ),
      supabase.from("task_projects").select("task_id,project_id"),
      supabase.from("task_departments").select("task_id,department_id"),
      supabase.from("task_updates").select("task_id,author_id,note,created_at"),
      supabase.from("member_positions").select("member_id,position_id,department_id,project_id"),
      supabase.from("positions").select("id,name")
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error)
      throw new Error(`Could not load shared club data: ${failed.error.message}`);
    const [
      members,
      departments,
      projects,
      memberDepartments,
      assignments,
      tasks,
      taskProjects2,
      taskDepartments2,
      updates,
      memberPositions,
      positions
    ] = results.map((result) => result.data || []);
    const departmentNames = new Map(
      departments.map((item) => [item.id, item.name])
    );
    const projectNames = new Map(
      projects.map((item) => [item.id, item.name])
    );
    const projectsByTask = /* @__PURE__ */ new Map();
    taskProjects2.forEach((item) => {
      const name = projectNames.get(item.project_id);
      if (name) {
        const list = projectsByTask.get(item.task_id) || [];
        if (!list.includes(name)) list.push(name);
        projectsByTask.set(item.task_id, list);
      }
    });
    const departmentsByTask = /* @__PURE__ */ new Map();
    taskDepartments2.forEach((item) => {
      const name = departmentNames.get(item.department_id);
      if (name) {
        const list = departmentsByTask.get(item.task_id) || [];
        if (!list.includes(name)) list.push(name);
        departmentsByTask.set(item.task_id, list);
      }
    });
    const positionNames = new Map(
      positions.map((item) => [item.id, item.name])
    );
    const assignmentsByMember = /* @__PURE__ */ new Map();
    assignments.filter((item) => item.status === "Active").forEach((item) => {
      const list = assignmentsByMember.get(item.member_id) || [];
      const name = projectNames.get(item.project_id);
      if (name && !list.includes(name)) list.push(name);
      assignmentsByMember.set(item.member_id, list);
    });
    const departmentsByMember = /* @__PURE__ */ new Map();
    memberDepartments.forEach((item) => {
      const list = departmentsByMember.get(item.member_id) || [];
      const name = departmentNames.get(item.department_id);
      if (name && !list.includes(name)) list.push(name);
      departmentsByMember.set(item.member_id, list);
    });
    const rolesByMember = /* @__PURE__ */ new Map();
    memberPositions.forEach((item) => {
      const list = rolesByMember.get(item.member_id) || [];
      const name = positionNames.get(item.position_id);
      if (name && !list.includes(name)) list.push(name);
      rolesByMember.set(item.member_id, list);
    });
    const departmentHeads = /* @__PURE__ */ new Map();
    const projectHeads = /* @__PURE__ */ new Map();
    const headScopeByMember = /* @__PURE__ */ new Map();
    memberPositions.forEach((item) => {
      const position = positionNames.get(item.position_id);
      if (position === "Department Head" && item.department_id) {
        departmentHeads.set(item.department_id, item.member_id);
        headScopeByMember.set(
          item.member_id,
          departmentNames.get(item.department_id) || ""
        );
      }
      if (position === "Project Head" && item.project_id) {
        projectHeads.set(item.project_id, item.member_id);
        headScopeByMember.set(
          item.member_id,
          projectNames.get(item.project_id) || ""
        );
      }
    });
    departments.forEach((item) => {
      if (item.head_member_id && !departmentHeads.has(item.id)) {
        departmentHeads.set(item.id, item.head_member_id);
        headScopeByMember.set(
          item.head_member_id,
          departmentNames.get(item.id) || ""
        );
      }
    });
    projects.forEach((item) => {
      if (item.project_lead_id && !projectHeads.has(item.id)) {
        projectHeads.set(item.id, item.project_lead_id);
        headScopeByMember.set(
          item.project_lead_id,
          projectNames.get(item.id) || ""
        );
      }
    });
    const updatesByTask = /* @__PURE__ */ new Map();
    updates.forEach((item) => {
      const list = updatesByTask.get(item.task_id) || [];
      list.push({ text: item.note, by: item.author_id, at: item.created_at });
      updatesByTask.set(item.task_id, list);
    });
    return {
      departments: departments.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        head: departmentHeads.get(item.id) || item.head_member_id || ""
      })),
      projects: projects.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
        lead: projectHeads.get(item.id) || item.project_lead_id || "",
        status: item.status
      })),
      members: members.map((item) => {
        const memberDeptList = departmentsByMember.get(item.id) || [];
        const legacyDepartment = departmentNames.get(item.department_id);
        if (legacyDepartment && !memberDeptList.includes(legacyDepartment))
          memberDeptList.push(legacyDepartment);
        const memberPositionNames = [...rolesByMember.get(item.id) || []];
        if ([...departmentHeads.values()].includes(item.id) && !memberPositionNames.includes("Department Head"))
          memberPositionNames.push("Department Head");
        if ([...projectHeads.values()].includes(item.id) && !memberPositionNames.includes("Project Head"))
          memberPositionNames.push("Project Head");
        return {
          id: item.id,
          name: item.name,
          email: item.email,
          clubRole: item.club_role === "Department head" ? "Department Head" : item.club_role === "Project lead" || item.club_role === "Head" ? "Project Head" : item.club_role,
          extraRole: ["President", "Vice President"].includes(item.club_role) ? (rolesByMember.get(item.id) || []).find(
            (name) => ["Department Head", "Project Head"].includes(name)
          ) || "" : "",
          headScope: headScopeByMember.get(item.id) || "",
          isClubAdmin: item.is_club_admin,
          status: item.status,
          faculty: item.faculty || null,
          studyYear: item.study_year || null,
          avatarPath: item.avatar_path || null,
          profileStatus: item.profile_status || "Pending",
          phone: item.phone || "",
          departments: memberDeptList,
          department: memberDeptList[0] || "",
          projects: assignmentsByMember.get(item.id) || [],
          positionNames: memberPositionNames
        };
      }),
      tasks: tasks.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        projects: projectsByTask.get(item.id) || [projectNames.get(item.project_id)].filter(Boolean),
        departments: departmentsByTask.get(item.id) || [departmentNames.get(item.department_id)].filter(Boolean),
        project: projectNames.get(item.project_id) || "",
        department: departmentNames.get(item.department_id) || "",
        assignee: item.assignee_id || "",
        assigner: item.assigned_by,
        status: item.status,
        priority: item.priority,
        due: item.due_at ? String(item.due_at).slice(0, 10) : "",
        update: item.progress_update || "",
        updates: updatesByTask.get(item.id) || []
      }))
    };
  }
  $("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) return authNotice("Supabase is not configured yet.", true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    authNotice("Signing in\u2026");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) authNotice("That email and password could not sign in.", true);
  });
  $("forgotPassword").addEventListener("click", async () => {
    if (!supabase) return authNotice("Supabase is not configured yet.", true);
    const email = String($("loginEmail").value || "").trim();
    if (!email) return authNotice("Enter your email first.", true);
    const redirectTo = `${window.location.origin}/?flow=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    authNotice(
      error ? "Could not send a reset email. Check Auth email delivery settings." : "If that account is registered, a password reset email is on its way.",
      Boolean(error)
    );
  });
  $("setPasswordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) return authNotice("Supabase is not configured yet.", true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    const confirmation = String(form.get("confirmPassword") || "");
    if (password !== confirmation)
      return authNotice("The passwords do not match.", true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      return authNotice(
        "Could not set the password. Try the invite link again.",
        true
      );
    if (inviteSetupFlow) {
      const { data: sessionData } = await supabase.auth.getSession();
      const activation = await fetch("/api/activate-invited-member", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + (sessionData.session?.access_token || "")
        }
      });
      if (!activation.ok) {
        const result = await activation.json().catch(() => ({}));
        return authNotice(
          result.error || "Password saved, but your profile could not be activated. Contact the system admin.",
          true
        );
      }
    }
    profileSetupPending = inviteSetupFlow;
    passwordSetupFlow = false;
    inviteSetupFlow = false;
    forgetSetup();
    window.history.replaceState({}, "", window.location.pathname);
    const { data } = await supabase.auth.getUser();
    if (data.user) await openWorkspace(data.user);
  });
  $("signOutBtn").addEventListener("click", async () => {
    if (supabase) await supabase.auth.signOut();
  });
  function same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  function byName(items, name) {
    return items.find((item) => item.name === name)?.id || null;
  }
  async function writeTable(table, rows, onConflict = "") {
    if (!rows.length) return;
    const { error } = await supabase.from(table).upsert(rows, onConflict ? { onConflict } : void 0);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  async function deleteRows(table, filters) {
    let query = supabase.from(table).delete();
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { error } = await query;
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  async function persistChanges(before, after) {
    if (!supabase || !authUser || !authProfile)
      throw new Error("Your sign-in session has expired. Please sign in again.");
    const changedMembers = after.members.filter((member) => {
      const old = before.members.find((row) => row.id === member.id);
      return !old || ["name", "email", "clubRole", "isClubAdmin", "status"].some(
        (field) => old[field] !== member[field]
      );
    });
    if (changedMembers.length && !isAdmin())
      throw new Error(
        "Only the system admin can create or edit member profiles."
      );
    if (changedMembers.length) {
      await writeTable(
        "members",
        changedMembers.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email.trim().toLowerCase(),
          club_role: ["President", "Vice President"].includes(member.clubRole) ? member.clubRole : member.clubRole === "Department Head" ? "Department head" : member.clubRole === "Project Head" ? "Project lead" : "Member",
          department_id: null,
          is_club_admin: Boolean(member.isClubAdmin),
          status: member.status || "Pending invitation"
        }))
      );
    }
    const changedDepartments = after.departments.filter((item) => {
      const old = before.departments.find((row) => row.id === item.id);
      return !old || !same(old, item);
    });
    if (changedDepartments.length) {
      if (!isAdmin())
        throw new Error("Only the system admin can edit department records.");
      await writeTable(
        "departments",
        changedDepartments.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          head_member_id: item.head || null
        })),
        "name"
      );
    }
    const changedProjects = after.projects.filter((item) => {
      const old = before.projects.find((row) => row.id === item.id);
      return !old || !same(old, item);
    });
    if (changedProjects.length) {
      if (!isAdmin())
        throw new Error("Only the system admin can edit project records.");
      await writeTable(
        "projects",
        changedProjects.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          project_lead_id: item.lead || null,
          status: item.status || "Planning"
        })),
        "name"
      );
    }
    const changedAssignments = after.members.filter((member) => {
      const old = before.members.find((row) => row.id === member.id);
      return !old || !same(old.departments || [], member.departments || []) || !same(old.projects || [], member.projects || []);
    });
    for (const member of changedAssignments) {
      const old = before.members.find((row) => row.id === member.id);
      const oldDepartments = old?.departments || [];
      const newDepartments = member.departments || [];
      for (const name of oldDepartments.filter(
        (name2) => !newDepartments.includes(name2)
      )) {
        const departmentId = byName(after.departments, name);
        if (departmentId)
          await deleteRows("member_departments", {
            member_id: member.id,
            department_id: departmentId
          });
      }
      const departmentRows = newDepartments.filter((name) => !oldDepartments.includes(name)).map((name) => ({
        member_id: member.id,
        department_id: byName(after.departments, name),
        assigned_by: authProfile.id
      })).filter((row) => row.department_id);
      await writeTable("member_departments", departmentRows);
      const oldProjects = old?.projects || [];
      const newProjects = member.projects || [];
      for (const name of oldProjects.filter(
        (name2) => !newProjects.includes(name2)
      )) {
        const projectId = byName(after.projects, name);
        if (projectId)
          await deleteRows("project_assignments", {
            member_id: member.id,
            project_id: projectId
          });
      }
      const projectRows = newProjects.filter((name) => !oldProjects.includes(name)).map((name) => ({
        member_id: member.id,
        project_id: byName(after.projects, name),
        allocated_by: authProfile.id,
        status: "Active",
        role_on_project: "Core"
      })).filter((row) => row.project_id);
      await writeTable(
        "project_assignments",
        projectRows,
        "member_id,project_id"
      );
    }
    if (isAdmin()) {
      const changedPositions = after.members.filter((member) => {
        const old = before.members.find((row) => row.id === member.id);
        return !old || old.clubRole !== member.clubRole || old.extraRole !== member.extraRole || old.headScope !== member.headScope;
      });
      for (const member of changedPositions) {
        const { error: deleteError } = await supabase.from("member_positions").delete().eq("member_id", member.id);
        if (deleteError)
          throw new Error(`member_positions: ${deleteError.message}`);
        const names = [member.clubRole, member.extraRole].filter(Boolean);
        const positionRows = names.map((name) => {
          const scopeId = byName(
            name === "Department Head" ? after.departments : after.projects,
            member.headScope || ""
          );
          return {
            member_id: member.id,
            position_id: byName(positionsCatalog, name),
            department_id: name === "Department Head" ? scopeId : null,
            project_id: name === "Project Head" ? scopeId : null,
            assigned_by: authProfile.id
          };
        }).filter((row) => row.position_id);
        await writeTable("member_positions", positionRows);
      }
    }
    const removedTasks = before.tasks.filter(
      (old) => !after.tasks.some((task) => task.id === old.id)
    );
    if (removedTasks.length && !canDeleteTask())
      throw new Error(
        "Only the system admin, President or Vice President can delete tasks."
      );
    for (const task of removedTasks) {
      const { data, error } = await supabase.from("tasks").delete().eq("id", task.id).select("id");
      if (error) throw new Error(`tasks: ${error.message}`);
      if (!data?.length)
        throw new Error(
          `tasks: "${task.title}" could not be deleted. It may already be gone or you may not have permission.`
        );
    }
    const changedTasks = after.tasks.filter((task) => {
      const old = before.tasks.find((row) => row.id === task.id);
      return !old || !same(old, task) || !same(taskProjects(old), taskProjects(task)) || !same(taskDepartments(old), taskDepartments(task));
    });
    if (changedTasks.length) {
      for (const task of changedTasks) {
        const old = before.tasks.find((row2) => row2.id === task.id);
        const projects = taskProjects(task);
        const departments = taskDepartments(task);
        const row = {
          id: task.id,
          title: task.title,
          description: task.description || "",
          task_type: projects.length ? "Project task" : departments.length ? "Department task" : "Club-wide",
          project_id: byName(after.projects, projects[0] || ""),
          department_id: byName(after.departments, departments[0] || ""),
          assignee_id: task.assignee || null,
          assigned_by: task.assigner || authProfile.id,
          status: task.status || (task.assignee ? "Pending" : "Unassigned"),
          priority: task.priority || "Medium",
          due_at: task.due ? `${task.due}T23:59:00` : null,
          progress_update: task.update || ""
        };
        if (!old) {
          const { error } = await supabase.from("tasks").insert([row]);
          if (error) throw new Error(`tasks: ${error.message}`);
        } else {
          const allowed = {};
          if (old.assignee !== task.assignee)
            allowed.assignee_id = task.assignee || null;
          if (old.assigner !== task.assigner)
            allowed.assigned_by = task.assigner || authProfile.id;
          if (old.status !== task.status) allowed.status = task.status;
          if (old.update !== task.update)
            allowed.progress_update = task.update || "";
          if (Object.keys(allowed).length) {
            const { error } = await supabase.from("tasks").update(allowed).eq("id", task.id);
            if (error) throw new Error(`tasks: ${error.message}`);
          }
        }
        const priorProjects = taskProjects(old || {});
        const priorDepartments = taskDepartments(old || {});
        for (const name of priorProjects.filter(
          (name2) => !projects.includes(name2)
        )) {
          const projectId = byName(after.projects, name);
          if (projectId)
            await deleteRows("task_projects", {
              task_id: task.id,
              project_id: projectId
            });
        }
        for (const name of priorDepartments.filter(
          (name2) => !departments.includes(name2)
        )) {
          const departmentId = byName(after.departments, name);
          if (departmentId)
            await deleteRows("task_departments", {
              task_id: task.id,
              department_id: departmentId
            });
        }
        const projectRows = projects.filter((name) => !priorProjects.includes(name)).map((name) => ({
          task_id: task.id,
          project_id: byName(after.projects, name)
        })).filter((item) => item.project_id);
        const departmentRows = departments.filter((name) => !priorDepartments.includes(name)).map((name) => ({
          task_id: task.id,
          department_id: byName(after.departments, name)
        })).filter((item) => item.department_id);
        if (projectRows.length) {
          const { error } = await supabase.from("task_projects").insert(projectRows);
          if (error) throw new Error(`task_projects: ${error.message}`);
        }
        if (departmentRows.length) {
          const { error } = await supabase.from("task_departments").insert(departmentRows);
          if (error) throw new Error(`task_departments: ${error.message}`);
        }
        const oldUpdates = old?.updates || [];
        const newUpdates = task.updates || [];
        const additions = newUpdates.slice(oldUpdates.length).map((update) => ({
          task_id: task.id,
          author_id: update.by || authProfile.id,
          note: update.text
        }));
        await writeTable("task_updates", additions);
      }
    }
  }
  function save() {
    render();
    if (!SHARED_WRITES_ENABLED || !supabase || !syncedDb)
      return Promise.resolve(false);
    const next = structuredClone(db);
    let succeeded = true;
    saveQueue = saveQueue.then(async () => {
      await persistChanges(syncedDb, next);
      syncedDb = next;
    }).catch(async (error) => {
      succeeded = false;
      alert(error instanceof Error ? error.message : "Could not save changes.");
      try {
        db = await loadSharedWorkspace();
        syncedDb = structuredClone(db);
        render();
      } catch {
        await supabase?.auth.signOut();
      }
    });
    return saveQueue.then(() => succeeded);
  }
  async function sendInvitation(email) {
    const { data } = await supabase.auth.getSession();
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + (data.session?.access_token || "")
      },
      body: JSON.stringify({ email })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.error || "Could not send the invitation.");
  }
  function esc(x = "") {
    return String(x).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }
  function person(id) {
    return db.members.find((m) => m.id === id);
  }
  function personName(id) {
    return person(id)?.name || "Unassigned";
  }
  function deptsOf(m) {
    return m.departments || [m.department].filter(Boolean);
  }
  function memberRoles(m) {
    const legacyRole = m.clubRole === "Department head" || m.clubRole === "Head" ? "Department Head" : m.clubRole === "Project lead" ? "Project Head" : m.clubRole;
    const departmentHeadLabels = db.departments.filter((department) => department.head === m.id).map((department) => `${department.name} Head`);
    const projectHeadLabels = db.projects.filter((project) => project.lead === m.id).map((project) => `${project.name} Head`);
    const labels = [...m.positionNames || [], legacyRole, m.extraRole].filter(
      (position) => position && position !== "Member"
    );
    if (departmentHeadLabels.length) {
      labels.push(...departmentHeadLabels);
      while (labels.includes("Department Head"))
        labels.splice(labels.indexOf("Department Head"), 1);
    } else if (legacyRole === "Department Head" && m.headScope) {
      labels.push(`${m.headScope} Head`);
      while (labels.includes("Department Head"))
        labels.splice(labels.indexOf("Department Head"), 1);
    }
    if (projectHeadLabels.length) {
      labels.push(...projectHeadLabels);
      while (labels.includes("Project Head"))
        labels.splice(labels.indexOf("Project Head"), 1);
    } else if (legacyRole === "Project Head" && m.headScope) {
      labels.push(`${m.headScope} Head`);
      while (labels.includes("Project Head"))
        labels.splice(labels.indexOf("Project Head"), 1);
    }
    const unique = [...new Set(labels)];
    return unique.length ? unique : ["Member"];
  }
  function isAdmin() {
    return role === "System admin access";
  }
  function isExecutive() {
    return ["President", "Vice President"].includes(role) || currentPositions.some(
      (position) => ["President", "Vice President"].includes(position)
    );
  }
  function scope() {
    return selectedPerson || db.members[0]?.id || "";
  }
  function uid() {
    return crypto.randomUUID();
  }
  function initials(s = "?") {
    return s.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  }
  function statusClass(s) {
    return s === "Done" ? "done" : s === "Unassigned" ? "unassigned" : s === "Pending" ? "pending" : s === "In review" ? "review" : s === "In progress" ? "progress" : "todo";
  }
  function badge(s) {
    return `<span class="badge ${statusClass(s)}">${esc(s || "To do")}</span>`;
  }
  function options(list, selected = "") {
    return list.map(
      (v) => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`
    ).join("");
  }
  function fill(id, list, first) {
    $(id).innerHTML = `<option value="">${first}</option>` + list.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
  }
  function isHeadRole() {
    return role === "Head" || role === "Department Head" || role === "Project Head" || role === "Department head" || role === "Project lead" || currentPositions.some(
      (position) => ["Department Head", "Project Head"].includes(position)
    );
  }
  function allowedMembers() {
    return db.members;
  }
  function allowedTasks() {
    return db.tasks;
  }
  function canManageMember(m) {
    if (isAdmin()) return true;
    let ds = db.departments.filter((d) => d.head === scope()).map((d) => d.name), ps = db.projects.filter((p) => p.lead === scope()).map((p) => p.name);
    return deptsOf(m).some((d) => ds.includes(d)) || m.projects.some((p) => ps.includes(p));
  }
  function managedProjects() {
    return db.projects.filter((project) => project.lead === authProfile?.id);
  }
  function managedDepartments() {
    return db.departments.filter(
      (department) => department.head === authProfile?.id
    );
  }
  function taskProjects(task) {
    return task?.projects?.length ? task.projects : [task?.project].filter(Boolean);
  }
  function taskDepartments(task) {
    return task?.departments?.length ? task.departments : [task?.department].filter(Boolean);
  }
  function taskScopeLabel(task) {
    return [...taskProjects(task), ...taskDepartments(task)].join(" \xB7 ") || "Club-wide";
  }
  function canManageTask(task) {
    if (isAdmin() || isExecutive()) return true;
    const projectNames = taskProjects(task);
    if (projectNames.length)
      return projectNames.some(
        (name) => db.projects.some(
          (project) => project.name === name && project.lead === authProfile?.id
        )
      );
    return taskDepartments(task).some(
      (name) => db.departments.some(
        (department) => department.name === name && department.head === authProfile?.id
      )
    );
  }
  function canMarkTaskDone(task) {
    return Boolean(
      isAdmin() || isExecutive() || taskProjects(task).some(
        (name) => db.projects.some(
          (project) => project.name === name && project.lead === authProfile?.id
        )
      )
    );
  }
  function canDeleteTask() {
    return isAdmin() || isExecutive();
  }
  function canCreateTask() {
    return isAdmin() || isExecutive() || managedProjects().length > 0 || managedDepartments().length > 0;
  }
  function allowedProjects() {
    return db.projects;
  }
  function show(view) {
    if (view === "administration" && !isAdmin()) view = "home";
    const previousStructureMode = structureMode;
    if (["departments", "projects"].includes(view)) structureMode = view;
    else if (view === "structure") structureMode = "structure";
    if (structureMode !== previousStructureMode) structureSelection = null;
    const activeView = ["departments", "projects"].includes(view) ? "structure" : view;
    document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === activeView));
    document.querySelectorAll(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $("pageTitle").textContent = {
      home: "Overview",
      members: "Members",
      tasks: "Tasks",
      calendar: "Calendar",
      administration: "Administration",
      departments: "Departments",
      projects: "Projects",
      structure: "Departments & projects",
      profile: "My profile"
    }[view] || "Overview";
    if (activeView === "structure") renderStructure();
    if (view === "profile") mountOwnProfile();
  }
  document.querySelectorAll(".nav button").forEach((b) => b.onclick = () => show(b.dataset.view));
  document.querySelectorAll("[data-go]").forEach((b) => b.onclick = () => show(b.dataset.go));
  function render() {
    fill(
      "memberDeptFilter",
      db.departments.map((d) => d.name),
      "All departments"
    );
    fill(
      "memberProjectFilter",
      db.projects.map((p) => p.name),
      "All projects"
    );
    fill(
      "taskProjectFilter",
      allowedProjects().map((p) => p.name),
      "All projects"
    );
    fill(
      "taskDepartmentFilter",
      db.departments.map((department) => department.name),
      "All departments"
    );
    let members = db.members.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("");
    $("deptHead").innerHTML = '<option value="">Choose a member</option>' + members;
    $("projectLead").innerHTML = '<option value="">Choose a member</option>' + members;
    const leader = SHARED_WRITES_ENABLED && (isAdmin() || isExecutive() || isHeadRole());
    $("importMembersBtn").classList.toggle("hidden", !leader || !isAdmin());
    $("addDept").closest(".form").classList.toggle("hidden", !leader || !isAdmin());
    $("addProject").closest(".form").classList.toggle("hidden", !leader || !isAdmin());
    $("addTaskBtn").classList.toggle(
      "hidden",
      !SHARED_WRITES_ENABLED || !canCreateTask()
    );
    $("adminNav").classList.toggle("hidden", !isAdmin());
    renderHome();
    renderMembers();
    renderTasks();
    renderCalendar();
    renderAdministration();
    renderStructure();
    renderProfileInfo();
  }
  function mountOwnProfile() {
    if (!authProfile) return;
    mountProfileForm($("profileEditHost"), "pe", authProfile, {
      submitLabel: "Save changes",
      stacked: false,
      onSaved: () => {
        mountOwnProfile();
        renderProfileInfo();
      }
    });
  }
  function renderProfileInfo() {
    if (!authProfile) return;
    const missing = profileMissing(authProfile);
    const total = 5;
    const done = total - missing.length;
    const pct = Math.round(done / total * 100);
    const nudge = $("profileNudge");
    nudge.classList.toggle("hidden", missing.length === 0);
    $("profileNudgeText").textContent = missing.length ? `Still missing: ${missing.join(", ")}.` : "";
    const banner = $("profileBanner");
    banner.classList.toggle("hidden", missing.length === 0);
    $("profileBannerTitle").textContent = `Your profile is ${pct}% complete`;
    $("profileBannerMissing").textContent = missing.length ? `Still missing: ${missing.join(", ")}.` : "";
    $("profileMeter").setAttribute("aria-valuenow", String(pct));
    $("profileMeterFill").style.width = pct + "%";
    const me = db.members.find((m) => m.id === authProfile.id);
    const chips = (list, empty) => `<div class="profile-place-chips">${list.length ? list.map((x) => `<span class="chip">${esc(x)}</span>`).join("") : `<span class="quiet">${empty}</span>`}</div>`;
    $("profilePlace").innerHTML = me ? `<div class="profile-place-label">Position</div>${chips(memberRoles(me), "Member")}<div class="profile-place-label">Departments</div>${chips(deptsOf(me), "No department")}<div class="profile-place-label">Projects</div>${chips(me.projects || [], "No project")}` : "";
  }
  $("profileBtn").onclick = () => show("profile");
  $("passwordChangeForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase || !authProfile) return;
    const note = $("pwNote");
    const say = (text, isError = false) => {
      note.textContent = text;
      note.classList.toggle("error", isError);
    };
    const current = $("pwCurrent").value;
    const next = $("pwNew").value;
    const confirmation = $("pwConfirm").value;
    if (!current) return say("Enter your current password.", true);
    if (next.length < 8)
      return say("Your new password needs at least 8 characters.", true);
    if (next !== confirmation)
      return say("The new passwords do not match.", true);
    if (next === current)
      return say("Choose a password different from your current one.", true);
    $("pwSave").disabled = true;
    try {
      const check = await supabase.auth.signInWithPassword({
        email: authProfile.email,
        password: current
      });
      if (check.error) return say("Your current password is not correct.", true);
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) return say("Could not change the password. Try again.", true);
      $("passwordChangeForm").reset();
      say("Password changed. Use it the next time you sign in.");
    } finally {
      $("pwSave").disabled = false;
    }
  });
  $("profileReset").onclick = async () => {
    if (!supabase || !authProfile) return;
    const { error } = await supabase.auth.resetPasswordForEmail(
      authProfile.email,
      { redirectTo: `${window.location.origin}/?flow=recovery` }
    );
    $("profileResetNote").textContent = error ? "Could not send the email. Try again later." : `A reset link is on its way to ${authProfile.email}.`;
  };
  $("importMembersBtn").onclick = () => {
    if (isAdmin()) $("memberCsv").click();
  };
  $("memberCsv").onchange = (e) => {
    importMembersCsv(e.target.files[0]);
    e.target.value = "";
  };
  function overviewMode() {
    if (isAdmin() || isExecutive()) return "full";
    if (managedDepartments().length || managedProjects().length) return "head";
    return "member";
  }
  function renderHome() {
    const mode = overviewMode();
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const weekAhead = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    let people = db.members;
    let ts = db.tasks;
    if (mode === "head") {
      const ds = managedDepartments().map((d) => d.name);
      const ps = managedProjects().map((p) => p.name);
      people = db.members.filter(
        (m) => deptsOf(m).some((d) => ds.includes(d)) || (m.projects || []).some((p) => ps.includes(p))
      );
      ts = db.tasks.filter(
        (t) => taskDepartments(t).some((d) => ds.includes(d)) || taskProjects(t).some((p) => ps.includes(p))
      );
    } else if (mode === "member") {
      ts = db.tasks.filter((t) => t.assignee === authProfile?.id);
    }
    const open = ts.filter((t) => t.status !== "Done");
    const soon = open.filter((t) => t.due && t.due <= weekAhead);
    const done = ts.filter((t) => t.status === "Done").length;
    const donePct = ts.length ? Math.round(done / ts.length * 100) : 0;
    const scopeNote = mode === "head" ? [
      ...managedDepartments().map((d) => d.name),
      ...managedProjects().map((p) => p.name)
    ].join(" \xB7 ") : "";
    const cards = [];
    if (mode !== "member")
      cards.push([
        "People",
        people.length,
        "\u2659",
        mode === "head" ? scopeNote : "across the club"
      ]);
    cards.push(
      ["Open tasks", open.length, "\u2726", "still moving"],
      ["Due this week", soon.length, "\u25F7", "next 7 days"],
      ["Done", done, "\u2713", `${donePct}% complete`]
    );
    $("stats").classList.toggle("three", cards.length === 3);
    $("stats").innerHTML = cards.map(
      ([label, value, icon, foot]) => `<div class="stat"><div class="stat-label"><span class="stat-ico">${icon}</span>${label}</div><strong>${value}</strong><div class="stat-foot">${esc(foot)}</div></div>`
    ).join("");
    $("homeTasksTitle").textContent = mode === "member" ? "Your tasks" : mode === "head" ? "Coming up in your team" : "Coming up";
    const upcoming = [...ts].filter((t) => t.status !== "Done").sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 5);
    $("homeTasks").innerHTML = upcoming.length ? upcoming.map(
      (t) => `<div class="row"><div class="task-mini"><span class="task-marker ${t.due && t.due < today ? "late" : ""}"></span><div><div class="row-title">${esc(t.title)}</div><div class="row-sub">${esc(mode === "member" ? taskScopeLabel(t) : personName(t.assignee) + " \xB7 " + taskScopeLabel(t))}</div></div></div><div>${badge(t.status)}<div class="row-sub align-right">${t.due ? (/* @__PURE__ */ new Date(t.due + "T00:00:00")).toLocaleDateString(void 0, { month: "short", day: "numeric" }) : "No due date"}</div></div></div>`
    ).join("") : mode === "member" ? '<div class="empty"><strong>Nothing assigned to you yet.</strong>Tasks your department or project head gives you will show up here.</div>' : '<div class="empty"><strong>Your next story starts here.</strong>Assign the first task to bring it to life.</div>';
  }
  function renderMembers() {
    let q = $("memberSearch").value.toLowerCase(), df = $("memberDeptFilter").value, pf = $("memberProjectFilter").value;
    let list = allowedMembers().filter(
      (m) => (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)) && (!df || deptsOf(m).includes(df)) && (!pf || m.projects.includes(pf))
    );
    $("memberList").innerHTML = `<div class="member header"><span>Member</span><span>Departments</span><span>Projects</span><span>Positions</span><span></span></div>` + (list.length ? list.map(
      (m, i) => `<div class="member"><div class="person"><span class="avatar c${i % 4 + 1}${m.avatarPath ? " photo" : ""}"${m.avatarPath ? ` style="background-image:url('${esc(avatarUrl(m.avatarPath))}')"` : ""}>${initials(m.name)}</span><div><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.email || "Club member")}${m.isClubAdmin ? " \xB7 System admin access" : ""}</div></div></div><div>${deptsOf(m).length ? deptsOf(m).map((d) => `<span class="chip">${esc(d)}</span>`).join(" ") : '<span class="quiet">No department</span>'}</div><div class="items">${m.projects.length ? m.projects.map((p) => `<span class="chip">${esc(p)}</span>`).join("") : '<span class="quiet">No project</span>'}</div><div>${memberRoles(
        m
      ).map((r) => `<span class="badge role">${esc(r)}</span>`).join(
        " "
      )}</div><div>${SHARED_WRITES_ENABLED && isAdmin() ? `<button class="btn ghost small" data-action="edit-member" data-id="${m.id}">Edit profile</button><button class="btn ghost small" data-action="toggle-system-access" data-id="${m.id}">${m.isClubAdmin ? "Revoke system access" : "Grant system access"}</button>${m.status === "Pending invitation" ? `<button class="btn ghost small" data-action="resend-invitation" data-id="${m.id}">Send invitation</button>` : ""}${canRemoveMember(m) ? `<button class="btn danger small" data-action="remove-member" data-id="${m.id}">Remove</button>` : ""}` : SHARED_WRITES_ENABLED && canManageMember(m) ? `<button class="btn ghost small" data-action="assign-projects" data-id="${m.id}">Change assignments</button>` : ""}</div></div>`
    ).join("") : '<div class="empty"><strong>No members in this view yet.</strong>Add your team one department at a time.</div>');
  }
  function renderTasks() {
    let q = $("taskSearch").value.toLowerCase(), sf = $("taskStatusFilter").value, pf = $("taskProjectFilter").value, df = $("taskDepartmentFilter").value;
    let list = allowedTasks().filter(
      (t) => (!q || t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) && (!sf || t.status === sf) && (!pf || taskProjects(t).includes(pf)) && (!df || taskDepartments(t).includes(df))
    ).sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
    $("taskList").innerHTML = `<div class="task header"><span>Task</span><span>Assignee</span><span>Projects / departments</span><span>Priority</span><span>Deadline</span><span>Status</span><span></span></div>` + (list.length ? list.map((t) => {
      const canManage = canManageTask(t);
      const canMarkDone = canMarkTaskDone(t);
      const canUpdateProgress = Boolean(
        canManage || t.assignee === authProfile?.id
      );
      const statusChoices = [
        "Pending",
        "In progress",
        "In review",
        ...canMarkDone ? ["Done"] : []
      ];
      const taskTitle = canManage ? `<button type="button" class="task-title-button" data-action="assign-task" data-id="${t.id}">${esc(t.title)}</button>` : esc(t.title);
      const canEditStatus = canUpdateProgress && t.assignee && (canMarkDone || t.status !== "Done");
      return `<div class="task"><div><div class="row-title">${taskTitle}</div><div class="row-sub">${esc(t.description || "")}${t.assigner ? ` \xB7 assigned by ${esc(personName(t.assigner))}` : ""}</div>${t.update ? `<div class="progress-update">\u21B3 ${esc(t.update)}</div>` : ""}</div><div class="person"><span class="avatar c2">${initials(personName(t.assignee))}</span><span>${esc(personName(t.assignee))}</span></div><div>${esc(taskScopeLabel(t))}</div><div><span class="badge ${t.priority === "Urgent" ? "urgent" : t.priority === "High" ? "high" : ""}">${esc(t.priority)}</span></div><div>${t.due ? (/* @__PURE__ */ new Date(t.due + "T00:00:00")).toLocaleDateString(void 0, { month: "short", day: "numeric", year: "numeric" }) : "No deadline"}</div><div>${SHARED_WRITES_ENABLED && canEditStatus ? `<select class="status-select" data-task-status="${t.id}">${options(statusChoices, t.status)}</select>` : badge(t.status)}</div><div>${SHARED_WRITES_ENABLED ? `${canManage ? `<button class="btn ghost small" data-action="assign-task" data-id="${t.id}">${t.assignee ? "Reassign" : "Assign"}</button>` : ""}<button class="btn ghost small" data-action="add-update" data-id="${t.id}">\uFF0B Update</button>${canDeleteTask() ? `<button class="btn danger small" data-action="delete-task" data-id="${t.id}">Delete</button>` : ""}` : ""}</div></div>`;
    }).join("") : '<div class="empty"><strong>Nothing on the board.</strong>Tasks for your role will show up here.</div>');
  }
  function renderCalendar() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    $("calendarMonthLabel").textContent = calendarMonth.toLocaleDateString(
      void 0,
      { month: "long", year: "numeric" }
    );
    const tasks = allowedTasks().filter((task) => {
      if (!task.due) return false;
      const due = /* @__PURE__ */ new Date(`${task.due}T00:00:00`);
      return due.getFullYear() === year && due.getMonth() === month;
    }).sort((a, b) => a.due.localeCompare(b.due));
    $("calendarList").innerHTML = tasks.length ? tasks.map(
      (task) => `<div class="row"><div><div class="row-title">${esc(task.title)}</div><div class="row-sub">${esc(taskScopeLabel(task))} \xB7 ${esc(personName(task.assignee))}</div></div><div>${(/* @__PURE__ */ new Date(`${task.due}T00:00:00`)).toLocaleDateString(void 0, { weekday: "short", month: "short", day: "numeric" })}</div><div>${badge(task.status)}</div></div>`
    ).join("") : '<div class="empty"><strong>No deadlines this month.</strong>Tasks with due dates will appear here.</div>';
  }
  function renderAdministration() {
    if (!isAdmin()) return;
    const pending = db.members.filter(
      (member) => member.status === "Pending invitation"
    );
    $("adminStats").innerHTML = [
      ["Members", db.members.length, "\u2659", "club profiles"],
      ["Pending", pending.length, "\u2709", "invitation setup"],
      ["Departments", db.departments.length, "\u2318", "skill teams"]
    ].map(
      ([label, value, icon, foot]) => `<div class="stat"><div class="stat-label"><span class="stat-ico">${icon}</span>${label}</div><strong>${value}</strong><div class="stat-foot">${foot}</div></div>`
    ).join("");
    $("pendingInvitations").innerHTML = pending.length ? pending.map(
      (member) => `<div class="row"><div><div class="row-title">${esc(member.name)}</div><div class="row-sub">${esc(member.email)}</div></div><span class="badge role">Pending invitation</span></div>`
    ).join("") : '<div class="empty"><strong>Everyone is set up.</strong>New profiles waiting to register will appear here.</div>';
  }
  function exportCalendar() {
    const tasks = allowedTasks().filter((task) => task.due);
    if (!tasks.length) {
      alert("There are no task deadlines to export yet.");
      return;
    }
    const escapeIcs = (value) => String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const events = tasks.map((task) => {
      const start = task.due.replace(/-/g, "");
      const end = new Date(Date.parse(`${task.due}T00:00:00Z`) + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
      const description = [
        task.description,
        `Assignee: ${personName(task.assignee)}`,
        `Status: ${task.status}`,
        `Priority: ${task.priority}`,
        taskScopeLabel(task)
      ].filter(Boolean).join("\n");
      return [
        "BEGIN:VEVENT",
        `UID:${escapeIcs(task.id)}@vines-club-hub`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${escapeIcs(task.title)}`,
        `DESCRIPTION:${escapeIcs(description)}`,
        "END:VEVENT"
      ].join("\r\n");
    }).join("\r\n");
    const content = `BEGIN:VCALENDAR\r
VERSION:2.0\r
PRODID:-//Vines Club Hub//EN\r
CALSCALE:GREGORIAN\r
${events}\r
END:VCALENDAR\r
`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/calendar;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "vines-club-tasks.ics";
    link.click();
    URL.revokeObjectURL(url);
  }
  function renderStructure() {
    $("departmentCard").classList.toggle("hidden", structureMode === "projects");
    $("projectCard").classList.toggle("hidden", structureMode === "departments");
    let dlist = isAdmin() || isExecutive() ? db.departments : db.departments.filter(
      (d) => isHeadRole() ? d.head === scope() : true
    );
    const selectedClass = (kind, name) => structureSelection?.kind === kind && structureSelection.name === name ? " selected" : "";
    $("deptList").innerHTML = dlist.map(
      (d) => `<div class="row clickable${selectedClass("dept", d.name)}" role="button" tabindex="0" data-kind="dept" data-name="${esc(d.name)}"><div><div class="row-title">${esc(d.name)}</div><div class="row-sub">${db.members.filter((m) => deptsOf(m).includes(d.name)).length} people \xB7 Head: ${esc(personName(d.head))}</div></div><span class="row-chevron" aria-hidden="true">\u203A</span></div>`
    ).join("");
    let plist = isAdmin() || isExecutive() ? db.projects : role === "Project lead" ? db.projects.filter((p) => p.lead === scope()) : isHeadRole() ? allowedProjects() : db.projects;
    $("projectList").innerHTML = plist.map(
      (p) => `<div class="row clickable${selectedClass("project", p.name)}" role="button" tabindex="0" data-kind="project" data-name="${esc(p.name)}"><div><div class="row-title">${esc(p.name)}</div><div class="row-sub">${db.members.filter((m) => m.projects.includes(p.name)).length} people \xB7 Lead: ${esc(personName(p.lead))}</div></div><span class="row-chevron" aria-hidden="true">\u203A</span></div>`
    ).join("");
    renderStructureDetail();
  }
  function structureEntity(kind, name) {
    if (kind === "dept") {
      const d = db.departments.find((x) => x.name === name);
      if (!d) return null;
      return {
        title: d.name,
        icon: "\u{1F331}",
        iconClass: "mint",
        leaderLabel: "Head",
        description: d.description || "",
        leader: person(d.head),
        members: db.members.filter((m) => deptsOf(m).includes(d.name))
      };
    }
    const p = db.projects.find((x) => x.name === name);
    if (!p) return null;
    return {
      title: p.name,
      icon: "\u{1F3AC}",
      iconClass: "coral",
      leaderLabel: "Lead",
      description: p.description || "",
      leader: person(p.lead),
      members: db.members.filter((m) => m.projects.includes(p.name))
    };
  }
  function structureDetailHtml(kind, name, withClose) {
    const e = structureEntity(kind, name);
    if (!e) return "";
    const personRow = (m, i) => `<div class="detail-person"><div class="person"><span class="avatar c${i % 4 + 1}">${esc(initials(m.name))}</span><div><div class="row-title">${esc(m.name)}</div><div class="row-sub">${esc(m.email || "Club member")}</div></div></div>${m.id === e.leader?.id ? `<span class="badge role">${e.leaderLabel}</span>` : ""}</div>`;
    const head2 = withClose ? `<div class="detail-head"><div class="card-title"><span class="card-icon ${e.iconClass}">${e.icon}</span><h3>${esc(e.title)}</h3></div><button type="button" class="detail-close" id="structureDetailClose" aria-label="Close details">\xD7</button></div>` : "";
    return `${head2}${e.description ? `<p class="quiet">${esc(e.description)}</p>` : ""}<div class="detail-label">${e.leaderLabel}</div>${e.leader ? personRow(e.leader, 0) : `<div class="quiet">No ${e.leaderLabel.toLowerCase()} assigned yet.</div>`}<div class="detail-label">Members \xB7 ${e.members.length}</div>${e.members.length ? e.members.map(personRow).join("") : '<div class="quiet">No members yet.</div>'}`;
  }
  function renderStructureDetail() {
    const panel = $("structureDetail");
    const sel = structureSelection;
    const fitsMode = !!sel && (structureMode === "departments" && sel.kind === "dept" || structureMode === "projects" && sel.kind === "project");
    const exists = fitsMode && !!structureEntity(sel.kind, sel.name);
    const body = $("structureDetailBody");
    const play = (cls) => {
      body.classList.remove("detail-enter", "detail-leave");
      void body.offsetWidth;
      body.classList.add(cls);
    };
    window.clearTimeout(structureDetailTimer);
    if (!exists) {
      if (sel) structureSelection = null;
      const slideOut = animateStructureClose && !panel.hidden;
      animateStructureClose = false;
      structureDetailKey = "";
      if (slideOut) {
        play("detail-leave");
        structureDetailTimer = window.setTimeout(() => {
          panel.hidden = true;
          body.innerHTML = "";
          body.classList.remove("detail-leave");
        }, 160);
      } else {
        panel.hidden = true;
        body.innerHTML = "";
        body.classList.remove("detail-enter", "detail-leave");
      }
      return;
    }
    const key = `${sel.kind}:${sel.name}`;
    const opening = key !== structureDetailKey || panel.hidden;
    structureDetailKey = key;
    body.innerHTML = structureDetailHtml(sel.kind, sel.name, true);
    panel.hidden = false;
    if (opening) {
      body.querySelectorAll(".detail-person").forEach((row, i) => row.style.setProperty("--i", String(i)));
      play("detail-enter");
    } else {
      body.classList.remove("detail-enter", "detail-leave");
    }
  }
  function selectStructureItem(kind, name) {
    const sideBySide = structureMode !== "structure" && !window.matchMedia("(max-width: 680px)").matches;
    if (!sideBySide) {
      const e = structureEntity(kind, name);
      if (e) openModal(e.title, structureDetailHtml(kind, name, false));
      return;
    }
    const same2 = structureSelection?.kind === kind && structureSelection.name === name;
    structureSelection = same2 ? null : { kind, name };
    animateStructureClose = same2;
    renderStructure();
    const list = $(kind === "dept" ? "deptList" : "projectList");
    [...list.querySelectorAll(".row.clickable")].find((row) => row.dataset.name === name)?.focus();
  }
  function openModal(title, body) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = body;
    $("modal").classList.add("open");
  }
  function closeModal() {
    $("modal").classList.remove("open");
  }
  function peopleOptions(list, selected = "") {
    return list.map(
      (m) => `<option value="${m.id}" ${m.id === selected ? "selected" : ""}>${esc(m.name)} \xB7 ${esc(m.department || "\u2014")}</option>`
    ).join("");
  }
  function projectChecks(chosen = []) {
    return db.projects.map(
      (p) => `<label class="check"><input type="checkbox" name="projects" value="${esc(p.name)}" ${chosen.includes(p.name) ? "checked" : ""}>${esc(p.name)}</label>`
    ).join("");
  }
  function memberForm(m = {
    name: "",
    email: "",
    department: "",
    departments: [],
    clubRole: "Member",
    projects: []
  }) {
    if (!isAdmin()) return;
    let depts = db.departments, projects = db.projects, departments = m.departments || [m.department].filter(Boolean), roleNow = m.clubRole || "Member";
    openModal(
      m.id ? "Edit member" : "Add a member",
      `<form class="form" id="memberForm"><div class="field"><label>Full name</label><input name="name" required value="${esc(m.name)}" placeholder="Member name"></div><div class="field"><label>Email</label><input type="email" name="email" required value="${esc(m.email)}" placeholder="name@university.edu"></div><div class="field full"><label>Position</label><select name="clubRole" id="memberPosition">${options(["Member", "Department Head", "Project Head", "Vice President", "President"], roleNow)}</select><small class="quiet">System access is a separate permission, granted only by the global admin.</small></div><div class="field full hidden" id="extraPositionWrap"><label>Additional position (optional)</label><select name="extraRole" id="extraPosition"><option value="">None</option>${options(["Member", "Department Head", "Project Head"], m.extraRole || "")}</select></div><div class="field full hidden" id="headScopeWrap"><label id="headScopeLabel">Head of</label><select name="headScope" id="headScope"><option value="">Choose one</option></select><small class="quiet">A head role is attached to one department or one project.</small></div><div class="field full hidden" id="memberAssignments"><label>Departments</label><div class="form-checks">${depts.map((d) => `<label class="check"><input type="checkbox" name="departments" value="${esc(d.name)}" ${departments.includes(d.name) ? "checked" : ""}>${esc(d.name)}</label>`).join("")}</div><label>Projects</label><div class="form-checks">${projectChecks(m.projects || [])}</div><small class="quiet">Members can have any number of department and project assignments, or none.</small></div><div class="note field full">Profiles are created by the system admin. Members do not sign themselves up; registration is linked to the email on this profile.</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">${m.id ? "Save member" : "Add member"}</button></div></form>`
    );
    let sync = () => {
      let primary = $("memberPosition").value, secondary = $("extraPosition").value, headRole = ["Department Head", "Project Head"].includes(primary) ? primary : secondary, showExtra = ["President", "Vice President"].includes(primary), isMember = primary === "Member", head2 = $("headScope"), prior = m.headScope || m.department || m.headProject || "";
      $("extraPositionWrap").classList.toggle("hidden", !showExtra);
      $("memberAssignments").classList.toggle(
        "hidden",
        !isMember && !(showExtra && secondary === "Member")
      );
      $("headScopeWrap").classList.toggle("hidden", !headRole);
      $("headScopeLabel").textContent = headRole === "Department Head" ? "Department headed" : "Project headed";
      let opts = headRole === "Department Head" ? depts : projects;
      head2.innerHTML = '<option value="">Choose one</option>' + opts.map(
        (x) => `<option value="${esc(x.name)}" ${x.name === prior ? "selected" : ""}>${esc(x.name)}</option>`
      ).join("");
    };
    $("memberPosition").onchange = sync;
    $("extraPosition").onchange = sync;
    sync();
    $("memberForm").onsubmit = async (e) => {
      e.preventDefault();
      let f = new FormData(e.target), primary = String(f.get("clubRole") || ""), extra = String(f.get("extraRole") || ""), headRole = ["Department Head", "Project Head"].includes(primary) ? primary : extra, scopeValue = String(f.get("headScope") || ""), memberships = [
        ...e.target.querySelectorAll(
          "[name=departments]:checked"
        )
      ].map((x) => x.value), assignedProjects = [
        ...e.target.querySelectorAll(
          "[name=projects]:checked"
        )
      ].map((x) => x.value);
      if (headRole && !scopeValue) {
        alert("Choose the department or project for this head position.");
        return;
      }
      if (m.id && (m.clubRole !== primary || (m.extraRole || "") !== extra || (m.headScope || "") !== scopeValue)) {
        db.departments.forEach((d) => {
          if (d.head === m.id) d.head = "";
        });
        db.projects.forEach((p) => {
          if (p.lead === m.id) p.lead = "";
        });
        m.positionNames = [];
        const oldDepartments = m.departments || [];
        const oldProjects = m.projects || [];
        memberships = memberships.filter(
          (name) => !oldDepartments.includes(name)
        );
        assignedProjects = assignedProjects.filter(
          (name) => !oldProjects.includes(name)
        );
      }
      if (headRole === "Department Head") {
        let d = db.departments.find((x) => x.name === scopeValue);
        if (d) d.head = m.id || "";
        memberships = [.../* @__PURE__ */ new Set([...memberships, scopeValue])];
      }
      if (headRole === "Project Head") {
        let p = db.projects.find((x) => x.name === scopeValue);
        if (p) p.lead = m.id || "";
        assignedProjects = [.../* @__PURE__ */ new Set([...assignedProjects, scopeValue])];
      }
      let data = {
        name: String(f.get("name") || "").trim(),
        email: String(f.get("email") || "").trim(),
        clubRole: primary,
        extraRole: extra,
        departments: memberships,
        department: memberships[0] || "",
        projects: assignedProjects,
        headScope: scopeValue
      };
      const isNewMember = !m.id;
      if (m.id) Object.assign(m, data);
      else db.members.push({ id: uid(), ...data });
      const savedMember = m.id ? m : db.members.at(-1);
      if (headRole === "Department Head") {
        let d = db.departments.find((x) => x.name === scopeValue);
        if (d) d.head = m.id || db.members.at(-1).id;
      }
      if (headRole === "Project Head") {
        let p = db.projects.find((x) => x.name === scopeValue);
        if (p) p.lead = m.id || db.members.at(-1).id;
      }
      closeModal();
      const saved = await save();
      if (!saved) return;
      if (isNewMember) {
        try {
          await sendInvitation(savedMember.email);
          alert(
            `Profile saved and an invitation was sent to ${savedMember.email}.`
          );
        } catch (error) {
          alert(
            `Profile saved as pending. The invitation was not sent: ${error instanceof Error ? error.message : "Check the Supabase email settings."}`
          );
        }
      }
    };
  }
  function taskForm() {
    if (!canCreateTask()) return;
    const globalManager = isAdmin() || isExecutive();
    const projects = globalManager ? db.projects : managedProjects();
    const departments = globalManager ? db.departments : managedDepartments();
    if (!projects.length && !departments.length) return;
    const scopeOptions = (items, name) => items.map(
      (item) => `<label class="check"><input type="checkbox" name="${name}" value="${esc(item.name)}">${esc(item.name)}</label>`
    ).join("");
    openModal(
      "Create a task",
      `<form class="form" id="taskForm"><div class="field full"><label>Task name</label><input name="title" required placeholder="e.g. Cut the opening 20 seconds"></div><div class="field full"><label>Brief</label><textarea name="description" rows="2" placeholder="What should the finished work include?"></textarea></div>${projects.length ? `<div class="field full"><label>Projects</label><div class="form-checks">${scopeOptions(projects, "projects")}</div></div>` : ""}${departments.length ? `<div class="field full"><label>Departments</label><div class="form-checks">${scopeOptions(departments, "departments")}</div>` : ""}<small class="quiet field full">Choose one or more projects and/or departments. New tasks start as Unassigned.</small>${departments.length ? "</div>" : ""}<div class="field"><label>Deadline</label><input type="date" name="due"></div><div class="field"><label>Priority</label><select name="priority">${options(["Medium", "High", "Urgent", "Low"], "Medium")}</select></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Create unassigned task</button></div></form>`
    );
    $("taskForm").onsubmit = (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const selectedProjects = [
        ...e.target.querySelectorAll(
          '[name="projects"]:checked'
        )
      ].map((input) => input.value);
      const selectedDepartments = [
        ...e.target.querySelectorAll(
          '[name="departments"]:checked'
        )
      ].map((input) => input.value);
      if (!selectedProjects.length && !selectedDepartments.length) {
        alert("Choose at least one project or department for this task.");
        return;
      }
      db.tasks.unshift({
        id: uid(),
        title: String(form.get("title") || "").trim(),
        description: String(form.get("description") || "").trim(),
        projects: selectedProjects,
        departments: selectedDepartments,
        project: selectedProjects[0] || "",
        department: selectedDepartments[0] || "",
        assignee: "",
        assigner: authProfile.id,
        status: "Unassigned",
        priority: String(form.get("priority") || "Medium"),
        due: String(form.get("due") || ""),
        update: "",
        updates: []
      });
      closeModal();
      save();
    };
  }
  function assignTask(id) {
    const task = db.tasks.find((item) => item.id === id);
    if (!task || !canManageTask(task)) return;
    const taskProjectNames = taskProjects(task);
    const taskDepartmentNames = taskDepartments(task);
    const eligibleMembers = db.members.filter(
      (member) => member.status === "Active" && (member.projects.some((project) => taskProjectNames.includes(project)) || deptsOf(member).some(
        (department) => taskDepartmentNames.includes(department)
      ))
    );
    openModal(
      task.assignee ? "Assign this task to someone else" : "Assign this task",
      `<form class="form" id="assignTaskForm"><div class="field full"><label>Projects and departments</label><input value="${esc(taskScopeLabel(task))}" disabled></div><div class="field full"><label>Assign to</label><select name="assignee" required><option value="">Choose an active member in these scopes</option>${eligibleMembers.map(
        (member) => `<option value="${member.id}" ${member.id === task.assignee ? "selected" : ""}>${esc(member.name)}</option>`
      ).join(
        ""
      )}</select>${eligibleMembers.length ? "" : '<small class="quiet">Add an active member to at least one selected project or department before assigning this task.</small>'}</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime" ${eligibleMembers.length ? "" : "disabled"}>Assign task</button></div></form>`
    );
    $("assignTaskForm").onsubmit = (event) => {
      event.preventDefault();
      const assignee = String(
        new FormData(event.currentTarget).get("assignee") || ""
      );
      if (!eligibleMembers.some((member) => member.id === assignee)) return;
      task.assignee = assignee;
      task.assigner = authProfile.id;
      task.status = "Pending";
      closeModal();
      save();
    };
  }
  function addUpdate(id) {
    let t = db.tasks.find((t2) => t2.id === id);
    if (!t) return;
    openModal(
      "Share a progress update",
      `<form class="form" id="updateForm"><div class="field full"><label>What changed or what do you need?</label><textarea name="update" rows="4" required placeholder="Add a short note for the team\u2026">${esc(t.update || "")}</textarea></div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save update</button></div></form>`
    );
    $("updateForm").onsubmit = (e) => {
      e.preventDefault();
      let value = String(
        new FormData(e.target).get("update") || ""
      ).trim();
      t.update = value;
      t.updates = [
        ...t.updates || [],
        { text: value, by: scope(), at: (/* @__PURE__ */ new Date()).toISOString() }
      ];
      closeModal();
      save();
    };
  }
  function deleteTask(id) {
    const t = db.tasks.find((task) => task.id === id);
    if (!t || !canDeleteTask()) return;
    openModal(
      "Delete task",
      `<p>Delete <strong>${esc(t.title)}</strong>? Its progress updates are deleted with it. This cannot be undone.</p><div class="form-actions" style="margin-top:16px"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button type="button" class="btn danger" id="confirmDeleteTask">Delete task</button></div>`
    );
    $("confirmDeleteTask").onclick = () => {
      db.tasks = db.tasks.filter((task) => task.id !== id);
      closeModal();
      save();
    };
  }
  function updateTask(id, key, value) {
    let t = db.tasks.find((t2) => t2.id === id);
    if (key === "status" && (!t || !canManageTask(t) && t.assignee !== authProfile?.id || value === "Done" && !canMarkTaskDone(t)))
      return;
    if (t) {
      t[key] = value;
      save();
    }
  }
  function editMember(id) {
    let m = person(id);
    if (m) memberForm(m);
  }
  async function resendMemberInvitation(id) {
    if (!isAdmin()) return;
    const member = person(id);
    if (!member || member.status !== "Pending invitation") return;
    try {
      await sendInvitation(member.email);
      alert(`An invitation was sent to ${member.email}.`);
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Could not send the invitation."
      );
    }
  }
  function editLead(type, n) {
    if (!isAdmin() && !isExecutive()) return;
    let record = type === "department" ? db.departments.find((x) => x.name === n) : db.projects.find((x) => x.name === n);
    if (!record) return;
    openModal(
      type === "department" ? "Choose a department head" : "Choose a project lead",
      `<form class="form" id="leadForm"><div class="field full"><label>${esc(n)}</label><select name="lead"><option value="">No lead assigned</option>${peopleOptions(db.members, record.head || record.lead)}</select></div><div class="form-actions"><button class="btn ghost" type="button" data-close-modal>Cancel</button><button class="btn lime">Save lead</button></div></form>`
    );
    $("leadForm").onsubmit = (e) => {
      e.preventDefault();
      let id = String(
        new FormData(e.target).get("lead") || ""
      );
      if (type === "department") record.head = id;
      else record.lead = id;
      closeModal();
      save();
    };
  }
  function assignProjects(id) {
    let m = person(id);
    if (!m || !canManageMember(m)) return;
    let managedDepts = db.departments.filter((d) => d.head === scope()).map((d) => d.name), managedProjects2 = db.projects.filter((p) => p.lead === scope()).map((p) => p.name), editableDepts = isAdmin() ? db.departments.map((d) => d.name) : managedDepts, editableProjects = isAdmin() || managedDepts.length ? db.projects.map((p) => p.name) : managedProjects2, currentDepts = deptsOf(m), currentProjects = m.projects || [];
    let checks = (items, key, current) => items.map(
      (x) => `<label class="check"><input type="checkbox" name="${key}" value="${esc(x)}" ${current.includes(x) ? "checked" : ""}>${esc(x)}</label>`
    ).join("");
    openModal(
      "Change scoped assignments",
      `<form class="form" id="assignmentForm"><div class="field full"><strong>${esc(m.name)}</strong><p class="quiet">Change only the department or project placements within your leadership scope.</p>${editableDepts.length ? `<label>Departments</label><div class="form-checks">${checks(editableDepts, "departments", currentDepts)}</div>` : ""}${editableProjects.length ? `<label>Projects</label><div class="form-checks">${checks(editableProjects, "projects", currentProjects)}</div>` : ""}</div><div class="form-actions"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button class="btn lime">Save assignments</button></div></form>`
    );
    $("assignmentForm").onsubmit = (e) => {
      e.preventDefault();
      let ds = [
        ...e.target.querySelectorAll(
          "[name=departments]:checked"
        )
      ].map((x) => x.value), ps = [
        ...e.target.querySelectorAll(
          "[name=projects]:checked"
        )
      ].map((x) => x.value);
      m.departments = [
        .../* @__PURE__ */ new Set([
          ...currentDepts.filter((x) => !editableDepts.includes(x)),
          ...ds
        ])
      ];
      m.department = m.departments[0] || "";
      m.projects = [
        .../* @__PURE__ */ new Set([
          ...currentProjects.filter((x) => !editableProjects.includes(x)),
          ...ps
        ])
      ];
      closeModal();
      save();
    };
  }
  function canRemoveMember(m) {
    return SHARED_WRITES_ENABLED && isAdmin() && m.id !== authProfile?.id && !m.isClubAdmin;
  }
  function removeMember(id) {
    const m = person(id);
    if (!m || !canRemoveMember(m)) return;
    const assigned = db.tasks.filter((t) => t.assignee === id).length;
    const headed = db.departments.filter((d) => d.head === id).length + db.projects.filter((p) => p.lead === id).length;
    const items = [
      "Their profile and Supabase login are deleted. They can no longer sign in.",
      "They are taken out of every department and project.",
      assigned ? `${assigned} task${assigned === 1 ? "" : "s"} assigned to them ${assigned === 1 ? "is" : "are"} deleted, with ${assigned === 1 ? "its" : "their"} progress updates.` : "",
      headed ? `${headed} department${headed === 1 ? "" : "s"} or project${headed === 1 ? "" : "s"} they lead will have no head.` : ""
    ].filter(Boolean);
    openModal(
      "Remove member",
      `<p>Remove <strong>${esc(m.name)}</strong> from the club completely?</p><ul style="padding-left:18px;margin:10px 0">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul><p><strong>This cannot be undone.</strong></p><div class="note" id="removeMemberError" role="alert" hidden></div><div class="form-actions" style="margin-top:16px"><button type="button" class="btn ghost" data-close-modal>Cancel</button><button type="button" class="btn danger" id="confirmRemoveMember">Remove member</button></div>`
    );
    const confirm = $("confirmRemoveMember");
    confirm.onclick = async () => {
      const problem = $("removeMemberError");
      confirm.disabled = true;
      confirm.textContent = "Removing\u2026";
      problem.hidden = true;
      let removed = false;
      try {
        await saveQueue;
        const { data } = await supabase.auth.getSession();
        const response = await fetch("/api/remove-member", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + (data.session?.access_token || "")
          },
          body: JSON.stringify({ memberId: id })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok)
          throw new Error(result.error || "Could not remove this member.");
        removed = true;
      } catch (error) {
        problem.textContent = error instanceof Error ? error.message : "Could not remove this member.";
        problem.hidden = false;
        confirm.disabled = false;
        confirm.textContent = "Try again";
      }
      try {
        db = await loadSharedWorkspace();
        syncedDb = structuredClone(db);
        render();
      } catch {
        await supabase?.auth.signOut();
        return;
      }
      if (removed) closeModal();
    };
  }
  function toggleSystemAccess(id) {
    if (!isAdmin()) return;
    let m = person(id);
    if (m) {
      m.isClubAdmin = !m.isClubAdmin;
      save();
    }
  }
  function parseCsv(text) {
    let rows = [], row = [], cell = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      let c = text[i];
      if (c === '"' && quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = !quoted;
      else if (c === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((c === "\n" || c === "\r") && !quoted) {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell);
        if (row.some((v) => v.trim())) rows.push(row);
        row = [];
        cell = "";
      } else cell += c;
    }
    row.push(cell);
    if (row.some((v) => v.trim())) rows.push(row);
    return rows;
  }
  function importMembersCsv(file) {
    if (!file || !isAdmin()) return;
    file.text().then(async (text) => {
      let rows = parseCsv(text);
      if (rows.length < 2)
        throw new Error(
          "The CSV needs a header row and at least one member row."
        );
      let headers = rows.shift().map((x) => x.trim().toLowerCase().replace(/\s+/g, "_")), col = (r, k) => r[headers.indexOf(k)]?.trim() || "", validRoles = [
        "Member",
        "Department Head",
        "Project Head",
        "Vice President",
        "President"
      ], seen = new Set(db.members.map((m) => m.email.toLowerCase())), made = [], errors = [];
      rows.forEach((r, i) => {
        let line = i + 2, name = col(r, "name"), email = col(r, "email").toLowerCase(), position = col(r, "position") || "Member", extra = col(r, "additional_position"), ds = col(r, "departments").split(/[|;]/).map((x) => x.trim()).filter(Boolean), ps = col(r, "projects").split(/[|;]/).map((x) => x.trim()).filter(Boolean), headScope = col(r, "head_scope");
        if (!name || !/^\S+@\S+\.\S+$/.test(email))
          errors.push(`Row ${line}: enter a name and valid email.`);
        if (seen.has(email))
          errors.push(`Row ${line}: duplicate email ${email}.`);
        if (!validRoles.includes(position))
          errors.push(`Row ${line}: unknown position \u201C${position}\u201D.`);
        if (extra && !["Member", "Department Head", "Project Head"].includes(extra))
          errors.push(`Row ${line}: unknown additional position \u201C${extra}\u201D.`);
        if (ds.some(
          (x) => !db.departments.some(
            (d) => d.name.toLowerCase() === x.toLowerCase()
          )
        ))
          errors.push(
            `Row ${line}: department not found. Use exact department names.`
          );
        if (ps.some(
          (x) => !db.projects.some(
            (p) => p.name.toLowerCase() === x.toLowerCase()
          )
        ))
          errors.push(
            `Row ${line}: project not found. Use exact project names.`
          );
        let headRole = ["Department Head", "Project Head"].includes(position) ? position : extra;
        if (headRole && !headScope)
          errors.push(`Row ${line}: a head needs one head_scope.`);
        if (headRole === "Department Head" && !db.departments.some(
          (d) => d.name.toLowerCase() === headScope.toLowerCase()
        ))
          errors.push(`Row ${line}: head_scope must be one department name.`);
        if (headRole === "Project Head" && !db.projects.some(
          (p) => p.name.toLowerCase() === headScope.toLowerCase()
        ))
          errors.push(`Row ${line}: head_scope must be one project name.`);
        if (email) seen.add(email);
        made.push({
          name,
          email,
          clubRole: position,
          extraRole: extra,
          departments: ds,
          department: ds[0] || "",
          projects: ps,
          headScope,
          status: "Pending invitation"
        });
      });
      if (errors.length) {
        alert(
          "Nothing imported. Please fix these issues:\n\n" + errors.slice(0, 12).join("\n") + (errors.length > 12 ? `
\u2026and ${errors.length - 12} more.` : "")
        );
        return;
      }
      made.forEach((m) => {
        m.id = uid();
        let headRole = ["Department Head", "Project Head"].includes(m.clubRole) ? m.clubRole : m.extraRole;
        if (headRole === "Department Head") {
          let d = db.departments.find(
            (x) => x.name.toLowerCase() === m.headScope.toLowerCase()
          );
          d.head = m.id;
          m.departments = [.../* @__PURE__ */ new Set([...m.departments, d.name])];
          m.department = m.departments[0];
        }
        if (headRole === "Project Head") {
          let p = db.projects.find(
            (x) => x.name.toLowerCase() === m.headScope.toLowerCase()
          );
          p.lead = m.id;
          m.projects = [.../* @__PURE__ */ new Set([...m.projects, p.name])];
        }
        db.members.push(m);
      });
      if (!await save()) return;
      let sent = 0, failed = 0;
      for (const member of made) {
        try {
          await sendInvitation(member.email);
          sent++;
        } catch {
          failed++;
        }
      }
      alert(
        `${made.length} profiles saved. ${sent} invitation${sent === 1 ? "" : "s"} sent${failed ? `; ${failed} not sent. Check Supabase email delivery settings and try those again.` : "."}`
      );
    }).catch((e) => alert(e.message || "Could not read the CSV file."));
  }
  document.addEventListener("click", (event) => {
    const target = event.target.closest(
      "[data-action],[data-close-modal]"
    );
    if (!target) return;
    if (target.hasAttribute("data-close-modal")) {
      closeModal();
      return;
    }
    switch (target.dataset.action) {
      case "edit-member":
        editMember(target.dataset.id || "");
        break;
      case "resend-invitation":
        void resendMemberInvitation(target.dataset.id || "");
        break;
      case "remove-member":
        removeMember(target.dataset.id || "");
        break;
      case "toggle-system-access":
        toggleSystemAccess(target.dataset.id || "");
        break;
      case "assign-projects":
        assignProjects(target.dataset.id || "");
        break;
      case "add-update":
        addUpdate(target.dataset.id || "");
        break;
      case "assign-task":
        assignTask(target.dataset.id || "");
        break;
      case "delete-task":
        deleteTask(target.dataset.id || "");
        break;
      case "edit-lead":
        editLead(target.dataset.type || "", target.dataset.name || "");
        break;
    }
  });
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("[data-task-status]"))
      updateTask(target.dataset.taskStatus || "", "status", target.value);
  });
  $("addTaskBtn").onclick = taskForm;
  $("closeModal").onclick = closeModal;
  $("modal").onclick = (e) => {
    if (e.target === $("modal")) closeModal();
  };
  $("memberSearch").oninput = renderMembers;
  $("memberDeptFilter").onchange = renderMembers;
  $("memberProjectFilter").onchange = renderMembers;
  $("taskSearch").oninput = renderTasks;
  $("taskStatusFilter").onchange = renderTasks;
  $("taskProjectFilter").onchange = renderTasks;
  $("taskDepartmentFilter").onchange = renderTasks;
  $("calendarPrev").onclick = () => {
    calendarMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() - 1,
      1
    );
    renderCalendar();
  };
  $("calendarNext").onclick = () => {
    calendarMonth = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth() + 1,
      1
    );
    renderCalendar();
  };
  $("exportCalendar").onclick = exportCalendar;
  $("adminAddMember").onclick = () => {
    if (isAdmin()) {
      show("members");
      memberForm();
    }
  };
  $("addDept").onclick = () => {
    let n = $("deptName").value.trim();
    if (n && !db.departments.some((d) => d.name.toLowerCase() === n.toLowerCase())) {
      db.departments.push({
        id: uid(),
        name: n,
        head: $("deptHead").value || "",
        description: ""
      });
      $("deptName").value = "";
      save();
    }
  };
  $("addProject").onclick = () => {
    let n = $("projectName").value.trim();
    if (n && !db.projects.some((p) => p.name.toLowerCase() === n.toLowerCase())) {
      db.projects.push({
        id: uid(),
        name: n,
        lead: $("projectLead").value || "",
        description: ""
      });
      $("projectName").value = "";
      save();
    }
  };
  for (const listId of ["deptList", "projectList"]) {
    const list = $(listId);
    const pick = (target) => {
      const row = target?.closest(
        ".row.clickable"
      );
      if (row) selectStructureItem(row.dataset.kind, row.dataset.name);
    };
    list.addEventListener("click", (e) => pick(e.target));
    list.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick(e.target);
      }
    });
  }
  $("structureDetail").addEventListener("click", (e) => {
    if (e.target.closest("#structureDetailClose")) {
      structureSelection = null;
      animateStructureClose = true;
      renderStructure();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) window.location.reload();
  });
  void initializeSupabase();
})();
