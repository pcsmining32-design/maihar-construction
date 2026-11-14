# Firebase setup (do later, when ready)
1. Create project: https://console.firebase.google.com  (Spark / free plan)
2. Build > Authentication > Get started > Sign-in method > enable Email/Password
   Add users: Authentication > Users > Add user (your email + each staff email)
3. Build > Firestore Database > Create database (production mode)
4. Firestore > Rules tab: paste the contents of firestore.rules, Publish
5. Firestore > Data > Start collection `userRoles`; document ID = email in lowercase
   Superadmin doc:  superadmin (boolean) = true
   Staff doc:       projects (map)  e.g. flyash = "operator", hopper63 = "admin"
6. Project settings (gear) > Your apps > Web (</>) > copy the config into shell/firebase-config.js
Roles: admin or operator only. Anything else is ignored.
