/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { reportClientError } from './src/services/errorReporter';

// Erro JS não capturado fora de render (handler de evento, timer, promise) — o
// ErrorBoundary de App.tsx só pega erro de render. Reporta e DELEGA pro handler
// padrão do RN (mantém crash/red screen como antes; só acrescenta o relatório).
// Pra erro fatal, dá até 2s pro POST sair antes de deixar o app morrer — sem isso
// o crash mais importante seria justamente o que nunca chega.
const defaultHandler = global.ErrorUtils && global.ErrorUtils.getGlobalHandler();
if (global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    const report = reportClientError(error, isFatal ? 'fatal' : 'non-fatal');
    if (isFatal) {
      const timeout = new Promise((resolve) => setTimeout(resolve, 2000));
      Promise.race([report, timeout]).finally(() => defaultHandler && defaultHandler(error, isFatal));
    } else {
      if (defaultHandler) defaultHandler(error, isFatal);
    }
  });
}

AppRegistry.registerComponent(appName, () => App);
