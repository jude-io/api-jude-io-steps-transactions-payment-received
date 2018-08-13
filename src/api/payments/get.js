import { Log, DDB } from "utils-common";

export async function getPaymentById(id) {
  Log("fn.getPaymentById", id);
  try {
    const params = {
      TableName: "prod-payments",
      Key: {
        _id: id
      }
    };
    const result = await DDB.get(params).promise();
    Log("fn.getPaymentById.success", id);
    return result.Item;
  } catch (error) {
    Log("fn.getPaymentById.error", error);
    throw error;
  }
}
