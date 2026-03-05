import { initializeApp } from 'firebase/app';

import { getDatabase, ref, set, update, onChildAdded, startAfter, query } from 'firebase/database';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyC9LZLAp6yIIXdWBl7L7U6Ub4HGsJyvUZI",
    authDomain: "astrokoolam-cd0dd.firebaseapp.com",
    databaseURL: "https://astrokoolam-cd0dd-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "astrokoolam-cd0dd",
    storageBucket: "astrokoolam-cd0dd.appspot.com",
    messagingSenderId: "356466483583",
    appId: "1:356466483583:web:02a08d3710dd4658f2fa4a"
};


const app = initializeApp(firebaseConfig);
const _db = getDatabase(app);

export default {
    app, _db, db: {
        ref, set, update, onChildAdded, startAfter, query
    }
}

