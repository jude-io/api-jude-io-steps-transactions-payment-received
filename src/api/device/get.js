import { DDB, Log, decrypt } from "utils-common";

export async function getDeviceById(id) {
  Log("fn.getDeviceById", id);
  const params = {
    TableName: "prod-devices",
    AttributesToGet: ["_id", "_user", "push_token", "status", "platform"],
    Key: {
      _id: id
    }
  };
  try {
    const result = await DDB.get(params).promise();
    if (result.Item) {
      Log("fn.getDeviceById.success", id);
      const item = result.Item;
      return {
        _id: item._id,
        _user: item._user,
        push_token: item.push_token ? decrypt(item.push_token, "KEY_DEVICES") : false,
        status: item.status,
        platform: item.platform
      };
    }
    return false;
  } catch (error) {
    Log("fn.getDeviceById.error", error);
    throw error;
  }
}
