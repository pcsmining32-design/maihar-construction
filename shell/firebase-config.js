// Replace with the real values from Firebase Console > Project settings > Your apps > Web app.
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  appId: 'PASTE_APP_ID',
};
export const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith('PASTE_'));
