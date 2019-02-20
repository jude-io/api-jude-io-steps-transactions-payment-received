import { Log, JudeUsers } from "utils-common";

export async function markRequestAsReceived(id, _trans, _user, _user2) {
  Log("fn.markAsReceived", id);
  try {
    const req = await JudeUsers.get(_user, id);
    const params = {
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "COMPLETE",
      transactions: [...(req.transactions || []), { _trans, _user: _user2 } ]
    };
    if (req && !req.received_at) {
      const result = await JudeUsers.update(req._user, id, params);
      Log("fn.markAsReceived.success", id);
      return true;
    }
    Log("fn.markAsReceived.info", "already marked");
    return { alreadyMarked: true };
  } catch (error) {
    Log("fn.markAsReceived.error", error);
    throw error;
  }
}
