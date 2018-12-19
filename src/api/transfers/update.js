import { Log, JudeUsers } from "utils-common";

export async function markTransferAsReceived(id, _trans, _user) {
  Log("fn.markAsReceived", id);
  try {
    const transfer = await JudeUsers.get(_user, id);
    const params = {
      update: "SET #R = :r, #UPDATED = :updated, #S = :s, #S2 = :s2, " +
      "#T = list_append(if_not_exists(#T, :empty), :t), #TL = list_append(if_not_exists(#TL, :empty), :tl)",
      names: {
        "#R": "received_at",
        "#S": "status",
        "#T": "transactions",
        "#UPDATED": "updated_at",
        "#TL": "timeline",
        "#S2": "sort_2"
      },
      values: {
        ":updated": new Date().toISOString(),
        ":r": new Date().toISOString(),
        ":t": [ { _trans, _user } ],
        ":s": "COMPLETE",
        ":tl": [ { status: "TRANSACTION_RECEIVED", time: new Date().toISOString() } ],
        ":empty": [],
        ":s2": `COMPLETE_${transfer._to}`
      }
    };
    if (transfer && !transfer.received_at) {
      const result = await JudeUsers.raw.updateRaw(transfer._user, id, params);
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
