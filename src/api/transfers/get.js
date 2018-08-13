import { Log, DDB } from "utils-common";

export async function getTransferById(id) {
  Log("fn.getTransferById", id);
  try {
    const params = {
      TableName: "prod-transfers",
      Key: {
        _id: id
      }
    };
    const result = await DDB.get(params).promise();
    Log("fn.getTransferById.success", id);
    return result.Item;
  } catch (error) {
    Log("fn.getTransferById.error", error);
    throw error;
  }
}
