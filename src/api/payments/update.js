import { Log, DDB } from "utils-common";
import { getPaymentById } from "./get";

export async function markPaymentAsReceived(id) {
  Log("fn.markAsReceived", id);
  try {
    const params = {
      TableName: "prod-payments",
      Key: {
        _id: id
      },
      UpdateExpression: "SET #R = :r, #UPDATED = :updated",
      ExpressionAttributeNames: {
        "#R": "received_at",
        "#UPDATED": "updated_at"
      },
      ExpressionAttributeValues: {
        ":updated": new Date().toISOString(),
        ":r": new Date().toISOString()
      }
    };
    const payment = await getPaymentById(id);
    if (payment && !payment.posted_at) {
      const result = await DDB.update(params).promise();
      Log("fn.markAsReceived.success", id);
      return { alreadyMarked: false, lastUpdated: payment.updated_at, created: payment.created_at };
    }
    Log("fn.markAsReceived.info", "already marked");
    return { alreadyMarked: true };
  } catch (error) {
    Log("fn.markAsReceived.error", error);
    throw error;
  }
}
