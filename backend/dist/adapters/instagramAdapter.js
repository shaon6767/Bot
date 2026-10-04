const GRAPH_API_URL = "https://graph.facebook.com/v25.0/me/messages";
export const instagramAdapter = {
    channel: "instagram",
    parseEntry(entry) {
        const messages = [];
        const pageId = entry.id;
        for (const event of entry.messaging || []) {
            const isPostback = Boolean(event.postback);
            const quickReply = event.message?.quick_reply;
            const text = event.message?.text ?? event.postback?.title ?? quickReply?.title ?? "";
            if (!event.message && !isPostback)
                continue;
            if (event.message?.is_echo)
                continue;
            const payload = event.postback?.payload ?? quickReply?.payload ?? undefined;
            const messageId = event.message?.mid ??
                `${event.sender?.id ?? "unknown"}-${event.timestamp ?? Date.now()}-${payload ?? "manual"}`;
            messages.push({
                channel: "instagram",
                senderId: event.sender.id,
                pageId,
                text,
                payload,
                metaMessageId: messageId,
                timestamp: event.timestamp ?? Date.now(),
            });
        }
        return messages;
    },
    async sendMessage(pageAccessToken, recipientId, text, quickReplies) {
        const response = await fetch(GRAPH_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${pageAccessToken}`,
            },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: {
                    text,
                    ...(quickReplies && quickReplies.length > 0
                        ? {
                            quick_replies: quickReplies.map((reply) => ({
                                content_type: "text",
                                title: reply.title,
                                payload: reply.payload,
                            })),
                        }
                        : {}),
                },
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Instagram send failed: ${response.status} ${errorBody}`);
        }
    },
};
