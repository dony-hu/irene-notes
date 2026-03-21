import {
  appendAuthError,
  clearOauthStateCookie,
  clearUserSessionCookie,
  createUserSession,
  exchangeCodeForAccessToken,
  fetchCurrentFeishuUser,
  getFeishuAuthConfig,
  isTenantAllowed,
  jsonResponse,
  readOauthState,
  redirectResponse,
} from '../../../_lib/feishu-auth.js';

export async function onRequestGet(context) {
  const config = getFeishuAuthConfig(context.request, context.env);
  if (!config.enabled) {
    return jsonResponse(
      {
        enabled: false,
        authenticated: false,
        error: 'feishu_auth_not_configured',
      },
      503,
    );
  }

  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const authError = url.searchParams.get('error');
  const oauthState = await readOauthState(context.request, context.env);
  const returnTo = oauthState?.returnTo || '/';
  const cleanupHeaders = [
    ['Set-Cookie', clearOauthStateCookie(context.request)],
  ];

  if (authError) {
    return redirectResponse(appendAuthError(returnTo, authError), cleanupHeaders);
  }

  if (!oauthState || !code || !state || oauthState.nonce !== state) {
    return redirectResponse(appendAuthError('/', 'invalid_state'), [
      ...cleanupHeaders,
      ['Set-Cookie', clearUserSessionCookie(context.request)],
    ]);
  }

  let tokenPayload;
  try {
    tokenPayload = await exchangeCodeForAccessToken(context.request, context.env, code);
  } catch (error) {
    return redirectResponse(appendAuthError(
      returnTo,
      'login_token_exchange_failed',
      error?.message || 'failed_to_exchange_token',
    ), [
      ...cleanupHeaders,
      ['Set-Cookie', clearUserSessionCookie(context.request)],
    ]);
  }

  let userInfo;
  try {
    userInfo = await fetchCurrentFeishuUser(tokenPayload.access_token);
  } catch (error) {
    return redirectResponse(appendAuthError(
      returnTo,
      'login_user_info_failed',
      error?.message || 'failed_to_fetch_user',
    ), [
      ...cleanupHeaders,
      ['Set-Cookie', clearUserSessionCookie(context.request)],
    ]);
  }

  if (!isTenantAllowed(context.request, context.env, userInfo.tenant_key || '')) {
    return redirectResponse(appendAuthError(returnTo, 'tenant_not_allowed'), [
      ...cleanupHeaders,
      ['Set-Cookie', clearUserSessionCookie(context.request)],
    ]);
  }

  const session = await createUserSession(
    context.request,
    context.env,
    userInfo,
    tokenPayload.expires_in,
  );

  return redirectResponse(returnTo, [
    ...cleanupHeaders,
    ['Set-Cookie', session.cookie],
  ]);
}
