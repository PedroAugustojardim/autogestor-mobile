import * as Keychain from 'react-native-keychain';

// accessToken e refreshToken (7 dias de validade) ficam no Keychain/Keystore nativo,
// não em AsyncStorage — não são legíveis em backup do Android nem com acesso root.
const ACCESS_TOKEN_SERVICE = 'autogestor.accessToken';
const REFRESH_TOKEN_SERVICE = 'autogestor.refreshToken';

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    Keychain.setGenericPassword('token', accessToken, { service: ACCESS_TOKEN_SERVICE }),
    Keychain.setGenericPassword('token', refreshToken, { service: REFRESH_TOKEN_SERVICE }),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: ACCESS_TOKEN_SERVICE });
  return result ? result.password : null;
}

export async function getRefreshToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword({ service: REFRESH_TOKEN_SERVICE });
  return result ? result.password : null;
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    Keychain.resetGenericPassword({ service: ACCESS_TOKEN_SERVICE }),
    Keychain.resetGenericPassword({ service: REFRESH_TOKEN_SERVICE }),
  ]);
}
