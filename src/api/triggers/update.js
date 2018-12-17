import { Log, JudeUsers } from "utils-common";

export async function setTriggerStatus(user, id, status) {
  Log("fn.setTriggerStatus", user, id, status);
  try {
    const result = await JudeUsers.update(user, id, {
      updated_at: new Date().toISOString(),
      status
    });
    Log("fn.setTriggerStatus.success");
    return true;
  } catch (error) {
    Log("fn.setTriggerStatus.error", error);
    throw error;
  }
}
