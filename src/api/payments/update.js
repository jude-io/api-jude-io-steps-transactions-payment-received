import { Log, DDB } from "utils-common";
import { getPaymentById } from "./get";

export async function markPaymentAsReceived(id, _trans, _user) {
  Log("fn.markAsReceived", id);
  try {
    const params = {
      TableName: "prod-payments",
      Key: {
        _id: id
      },
      UpdateExpression: "SET #R = :r, #UPDATED = :updated, #S = :s, #T = list_append(if_not_exists(#T, :empty), :t), #TL = list_append(if_not_exists(#TL, :empty), :tl)",
      ExpressionAttributeNames: {
        "#R": "received_at",
        "#S": "status",
        "#T": "transactions",
        "#UPDATED": "updated_at",
        "#TL": "timeline"
      },
      ExpressionAttributeValues: {
        ":updated": new Date().toISOString(),
        ":r": new Date().toISOString(),
        ":t": [ { _trans, _user } ],
        ":s": "COMPLETE",
        ":tl": [ { status: "RECEIVED", time: new Date().toISOString() } ],
        ":empty": []
      }
    };
    const payment = await getPaymentById(id);
    if (payment && !payment.received_at) {
      const result = await DDB.update(params).promise();
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
