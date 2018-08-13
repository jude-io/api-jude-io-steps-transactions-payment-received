import { Log, DDB } from "utils-common";

export async function setTriggerStatus(user, id, status) {
  Log("fn.setTriggerStatus", user, id, status);
  const params = {
    TableName: "prod-triggers",
    Key: {
      _id: id,
      _user: user
    },
    UpdateExpression: "SET #U = :u, #S = :s",
    ExpressionAttributeNames: {
      "#U": "updated_at",
      "#S": "status"
    },
    ExpressionAttributeValues: {
      ":u": new Date().toISOString(),
      ":s": status
    }
  };
  try {
    const result = await DDB.update(params).promise();
    Log("fn.setTriggerStatus.success");
    return true;
  } catch (error) {
    Log("fn.setTriggerStatus.error", error);
    throw error;
  }
}
