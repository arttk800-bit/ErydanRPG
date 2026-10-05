// ============================================================================
// FEEDBACK SERVER TRANSPORT
// Reserved boundary for future server/email/GitHub-backed delivery.
// ============================================================================
export const FeedbackServerTransport={
 available:false,
 async send(){throw new Error('Server feedback transport is not configured')}
};
