async function logWebhookCall(client, data) {
  try {
    await client.query(`
      INSERT INTO webhook_logs (
        cell_captive_id, endpoint, method, headers, payload,
        response_status, response_body, processing_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      data.cell_captive_id,
      data.endpoint,
      data.method,
      JSON.stringify(data.headers || {}),
      JSON.stringify(data.payload || {}),
      data.response_status,
      data.response_body,
      data.processing_time_ms
    ]);
  } catch (error) {
    console.error('Failed to log webhook call:', error);
    // Don't throw error to avoid breaking main operation
  }
}

module.exports = {
  logWebhookCall
};