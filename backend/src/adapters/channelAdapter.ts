import { IncomingMessage } from "../types/index.js";

export interface QuickReply {
  title: string;
  payload: string;
}

export interface ChannelAdapter {
  channel: "messenger" | "instagram";
  parseEntry(entry: any): IncomingMessage[];
  sendMessage(
    pageAccessToken: string,
    recipientId: string,
    text: string,
    quickReplies?: QuickReply[],
  ): Promise<void>;
}
