// Public Firebase web config (safe to commit — these are not secrets).
// Firebase Console > Project settings > Your apps > Web app.
export const firebaseConfig = {
  apiKey: 'AIzaSyCo9RDSzWMHuk6SPxrI2nQbSbcxnF2R_3c',
  authDomain: 'maihar-construction-46d92.firebaseapp.com',
  projectId: 'maihar-construction-46d92',
  appId: '1:499582667382:web:51fcc76ad94e16b972ed57',
};

export const isConfigured = !Object.values(firebaseConfig).some(v => String(v).startsWith('PASTE_'));
