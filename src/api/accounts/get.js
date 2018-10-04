import { DDB, Log, decrypt } from "utils-common";

export async function getAccountById(user, id) {
  Log("fn.getAccountById", id);
  if (!id) {
    Log("fn.getAccountById.success", "no primary account");
    return false;
  }
  const params = {
    TableName: "prod-accounts",
    Key: {
      _id: id,
      _user: user
    }
  };
  try {
    const result = await DDB.get(params).promise();
    if (result.Item) {
      Log("fn.getAccountById.success", id);
      const item = result.Item;
      return {
        _id: item._id,
        _connection: item._connection,
        name: decrypt(item.name, "KEY_ACCOUNTS")
      };
    }
    return false;
  } catch (error) {
    Log("fn.getAccountById.error", error);
    throw error;
  }
}
