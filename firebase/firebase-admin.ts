import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_JSON?.toString().replace(/\\n/g, '\n') || "{}");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


