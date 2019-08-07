import { Log, JudeUsers } from "utils-common";
import { markRequestAsReceived } from "../requests/update";

export async function markPaymentAsReceived(sid, _trans, _user) {
  Log("fn.markAsReceived", sid);
  try {
    const payment = await JudeUsers.getPaymentBySid(sid);
    const params = {
      received_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "COMPLETE",
      transactions: [...(payment.transactions || []), { _trans, _user } ]
    };
    if (payment && !payment.received_at) {
      const result = await JudeUsers.update(payment._user, payment._id, params);
      if (payment._request) {
        await markRequestAsReceived(payment._request, _trans, payment._payee, _user);
      }
      Log("fn.markAsReceived.success", payment._id);
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
