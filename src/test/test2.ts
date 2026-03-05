

import { startAfter } from "firebase/database";
import moment from "moment";
import firebase from "src/utils/firebase";

// let string = message.errors
// 	.map(
// 		(err) =>
// 			`${err.path.replace("/", "").replace("_", " ").toUpperCase()} ${
// 				err.message
// 			}`,
// 	)
// 	.join("\n");
// console.log(string);

var prefix = `new_order/v1/661a372260c7c8421db45b31`;
const timeStamp = moment().unix();

const ref = firebase.db.ref(firebase._db, prefix)

firebase.db.onChildAdded(firebase.db.query(ref, startAfter(timeStamp)), (snapshot) => {
	console.log("New data recieved")

})



