import { Log, DDB, decrypt } from "utils-common";

export async function getTriggerById(user, id) {
  Log("fn.getTriggerById", user, id);
  const params = {
    TableName: "prod-triggers",
    Key: {
      _id: id,
      _user: user
    }
  };
  try {
    const result = await DDB.get(params).promise();
    Log("fn.getTriggerById.success");
    const trigger = result.Item;
    trigger.name = decrypt(trigger.name, "KEY_TRIGGERS");
    trigger.meta = JSON.parse(decrypt(trigger.meta, "KEY_TRIGGERS"));
    return trigger;
  } catch (error) {
    Log("fn.getTriggerById.error", error);
    throw error;
  }
}
