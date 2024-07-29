export function getConversationId(senderId: string, recipientId: string) {
  return senderId < recipientId
    ? `${senderId}-${recipientId}`
    : `${recipientId}-${senderId}`
}