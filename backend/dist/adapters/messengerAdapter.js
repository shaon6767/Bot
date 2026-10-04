const GRAPH_API_URL = "https://graph.facebook.com/v25.0/me/messages";
export const messengerAdapter = {
    channel: "messenger",
    parseEntry(entry) {
        const messages = [];
        const pageId = entry.id;
        for (const event of entry.messaging || []) {
            if (!event.message || event.message.is_echo)
                continue;
            messages.push({
                channel: "messenger",
                senderId: event.sender.id,
                pageId,
                text: event.message.text ?? "",
                metaMessageId: event.message.mid,
                timestamp: event.timestamp,
            });
        }
        return messages;
    },
    async sendMessage(pageAccessToken, recipientId, text) {
        const response = await fetch(`${GRAPH_API_URL}?access_token=${pageAccessToken}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
            }),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Messenger send failed: ${response.status} ${errorBody}`);
        }
    },
};
