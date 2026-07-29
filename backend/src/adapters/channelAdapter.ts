import { IncomingMessage } from "../types";

export interface ChannelAdapter {
  channel: "messenger" | "instagram";
  parseEntry(entry: any): IncomingMessage[];
  sendMessage(
    pageAccessToken: string,
    recipientId: string,
    text: string,
  ): Promise<void>;
}
