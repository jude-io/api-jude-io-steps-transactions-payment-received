import { Log, DDB, decrypt } from "utils-common";

export async function getUserById(id) {
  Log("fn.getUserById", id);
  const params = {
    TableName: "prod-users",
    Key: {
      _id: id
    }
  };
  try {
    const result = await DDB.get(params).promise();
    if (!result.Item) {
      Log("fn.getUserById.404", id);
      return false;
    }
    Log("fn.getUserById.success", id);
    const item = result.Item;
    return {
      _id: item._id,
      _device: item._device,
      avatar_url: item.avatar_url,
      created_at: item.created_at,
      updated_at: item.updated_at,
      first_name: decrypt(item.first_name, process.env.KEY_USERS),
      last_name: decrypt(item.last_name, process.env.KEY_USERS)
    };
  } catch (error) {
    Log("fn.getUserById.error", error);
    throw error;
  }
}
