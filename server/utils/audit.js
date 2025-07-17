async function logAuditTrail(client, data) {
  try {
    await client.query(`
      INSERT INTO audit_trail (
        table_name, record_id, action, old_values, 
        new_values, changed_by, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      data.table_name,
      data.record_id,
      data.action,
      JSON.stringify(data.old_values || {}),
      JSON.stringify(data.new_values || {}),
      data.changed_by,
      data.ip_address,
      data.user_agent
    ]);
  } catch (error) {
    console.error('Failed to log audit trail:', error);
    // Don't throw error to avoid breaking main operation
  }
}

module.exports = {
  logAuditTrail
};