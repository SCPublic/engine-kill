import { Alert, Platform } from 'react-native';

/**
 * Show an alert that works on web and native.
 * On web, React Native's Alert.alert is typically a no-op; we use window.alert.
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    const text = message ? `${title}\n\n${message}` : title;
    globalThis.alert(text);
  } else {
    Alert.alert(title, message ?? '');
  }
}
