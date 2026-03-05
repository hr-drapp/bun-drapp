import wassenger from "src/utils/Was";
import Wati from "src/utils/Wati";
const wati = new Wati();
const was = new wassenger();
// was.sendMessage({ phone: "917976619389", message: "Test Message" });
// was.groupSessionMessage({
//   name: "test56",
//   participants: [
//     {
//       phone: "+919982615247",
//       admin: true,
//     },
//     {
//       phone: "+917976619389",
//       admin: false,
//     },
//   ],
// });
await was.groupUpdateMessage({
  name: "test wassanger",
  description: "this is description",
  waId: "120363416727473946@g.us",
});
// wati.sendSessionMessage({ phone: "919983396152", message: "TEST MESSAGE" })
