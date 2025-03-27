import { collection, doc, getDoc, getDocs } from "@firebase/firestore";
import { auth, db } from ".";

// TODO: Move server side to cloud functions
// const admin = require('firebase-admin')
// 'users', 'programs', 'trainer_metadata'
// async function verifyCollectionsExist(collectionNames: Array<string>) {
//     try {
//       const db = admin.firestore();
  
//       const promises = collectionNames.map(async (collectionName) => {
//         const collectionRef = db.collection(collectionName);
//         const snapshot = await collectionRef.limit(1).get();
//         return snapshot.empty ? null : collectionName;
//       });
  
//       const existingCollections = await Promise.all(promises);
//       const filteredCollections = existingCollections.filter((collection) => collection !== null);
  
//       if (filteredCollections.length === collectionNames.length) {
//         console.log('All specified collections exist in Firestore.');
//       } else {
//         const missingCollections = collectionNames.filter(
//           (collection) => !filteredCollections.includes(collection)
//         );
//         console.log('The following collections do not exist in Firestore:', missingCollections);
//       }
//     } catch (error) {
//       console.error('Error verifying collections:', error);
//     }
//   }

const { signOut, onAuthStateChanged } = auth

export { signOut, onAuthStateChanged }