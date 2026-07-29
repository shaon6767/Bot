export type Channel = "messenger" | "instagram";

export interface IncomingMessage {
  channel: Channel;
  senderId: string;
  pageId: string;
  text: string;
  metaMessageId: string;
  timestamp: number;
}
