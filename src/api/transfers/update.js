import { Log, DDB } from "utils-common";
import { getTransferById } from "./get";

export async function markTransferAsReceived(id, _trans) {
  Log("fn.markAsReceived", id);
  try {
    const params = {
      TableName: "prod-transfers",
      Key: {
        _id: id
      },
      UpdateExpression: "SET #R = :r, #UPDATED = :updated, #S = :s, #T = :t",
      ExpressionAttributeNames: {
        "#R": "received_at",
        "#S": "status",
        "#T": "_transaction",
        "#UPDATED": "updated_at"
      },
      ExpressionAttributeValues: {
        ":updated": new Date().toISOString(),
        ":r": new Date().toISOString(),
        ":t": _trans,
        ":s": "COMPLETE"
      }
    };
    const transfer = await getTransferById(id);
    if (transfer && !transfer.posted_at) {
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
