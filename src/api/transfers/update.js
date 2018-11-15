import { Log, DDB } from "utils-common";
import { getTransferById } from "./get";

export async function markTransferAsReceived(id, _trans, _user) {
  Log("fn.markAsReceived", id);
  try {
    const params = {
      TableName: "prod-transfers",
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
        ":t": { _trans, _user },
        ":s": "COMPLETE",
        ":tl": [ { status: "RECEIVED", time: new Date().toISOString() } ],
        ":empty": []
      }
    };
    const transfer = await getTransferById(id);
    if (transfer && !transfer.received_at) {
      const result = await DDB.update(params).promise();
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
