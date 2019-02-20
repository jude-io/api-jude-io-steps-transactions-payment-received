import { Log, JudeUsers } from "utils-common";

export async function markTransferAsReceived(id, _trans, _user) {
  Log("fn.markAsReceived", id);
  try {
    const transfer = await JudeUsers.get(_user, id);
    const params = {
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "COMPLETE",
      transactions: [...(transfer.transactions || []), { _trans, _user } ]
    };
    if (transfer && !transfer.received_at) {
      const result = await JudeUsers.update(transfer._user, id, params);
      Log("fn.markAsReceived.success", id);
      return {
        alreadyMarked: false,
        lastUpdated: transfer.updated_at,
        created: transfer.created_at,
        payee: transfer._user,
        to: transfer._to
      };
    }
    Log("fn.markAsReceived.info", "already marked");
    return { alreadyMarked: true };
  } catch (error) {
    Log("fn.markAsReceived.error", error);
    throw error;
  }
}
