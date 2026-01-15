import { Platform } from 'react-native';

const webMonoStack =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const fontMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: webMonoStack,
  default: 'monospace',
});

// On iOS, bold monospace is often a distinct face name.
export const fontMonoBold = Platform.select({
  ios: 'Menlo-Bold',
  android: 'monospace',
  web: webMonoStack,
  default: 'monospace',
});



