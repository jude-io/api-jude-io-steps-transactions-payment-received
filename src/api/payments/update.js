import { Log, JudeUsers } from "utils-common";

export async function markPaymentAsReceived(id, _trans, _user) {
  Log("fn.markAsReceived", id);
  try {
    const payment = await JudeUsers.getPaymentById(_user, id);
    const params = {
      update: "SET #R = :r, #UPDATED = :updated, #S = :s, #S3 = :s3, " +
      "#T = list_append(if_not_exists(#T, :empty), :t), #TL = list_append(if_not_exists(#TL, :empty), :tl)",
      names: {
        "#R": "received_at",
        "#S": "status",
        "#T": "transactions",
        "#UPDATED": "updated_at",
        "#TL": "timeline",
        "#S3": "sort_3"
      },
      values: {
        ":updated": new Date().toISOString(),
        ":r": new Date().toISOString(),
        ":t": [ { _trans, _user } ],
        ":s": "COMPLETE",
        ":tl": [ { status: "TRANSACTION_RECEIVED", time: new Date().toISOString() } ],
        ":empty": [],
        ":s3": `COMPLETE_${payment._to}`
      }
    };
    if (payment && !payment.received_at) {
      const result = await JudeUsers.raw.updateRaw(payment._user, id, params);
      Log("fn.markAsReceived.success", id);
      return {
        alreadyMarked: false,
        lastUpdated: payment.updated_at,
        created: payment.created_at,
        payee: payment._payee,
        payer: payment._user,
        to: payment._to
      };
    }
    Log("fn.markAsReceived.info", "already marked");
    return { alreadyMarked: true };
  } catch (error) {
    Log("fn.markAsReceived.error", error);
    throw error;
  }
}
