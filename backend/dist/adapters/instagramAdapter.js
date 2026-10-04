const GRAPH_API_URL = "https://graph.facebook.com/v25.0/me/messages";
export const instagramAdapter = {
    channel: "instagram",
    parseEntry(entry) {
        const messages = [];
        const pageId = entry.id;
        for (const event of entry.messaging || []) {
            if (!event.message || event.message.is_echo)
                continue;
            messages.push({
                channel: "instagram",
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
            throw new Error(`Instagram send failed: ${response.status} ${errorBody}`);
        }
    },
};
