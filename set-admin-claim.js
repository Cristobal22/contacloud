// set-admin-claim.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Make sure the path is correct

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get the UID of the user you want to make an admin from the Firebase Console's Authentication page
const uid = 'JWlGZr8zqqVxCDOnRrN05gTYce32';

admin.auth().setCustomUserClaims(uid, { role: 'Admin' })
  .then(() => {
    console.log(`Success! Custom claim set for user ${uid}. They are now an Admin.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  });
