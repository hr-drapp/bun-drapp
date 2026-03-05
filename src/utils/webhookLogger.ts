import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const logFilePath = path.join("./temp/webhook.log");

if (!fs.existsSync(path.dirname(logFilePath))) {
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

export function WebhookLogger(text: any) {
  const time = new Date().toLocaleString();

  fs.appendFileSync(logFilePath, text);
}
