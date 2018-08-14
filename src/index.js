import { Log, init, decrypt, notifySlack } from "utils-common";
import { markPaymentAsReceived } from "./api/payments/update";
import { markTransferAsReceived } from "./api/transfers/update";
import { getTriggerById } from "./api/triggers/get";
import { setTriggerStatus } from "./api/triggers/update";
import moment from "moment";

exports.handler = async (event, context, callback) => {
  console.log("E", JSON.stringify(event));
  try {
    await init(event, context);
    const items = event.payload.filter(item => {
      return item._jude && item.tmp.newlyReceived;
    });
    for (let trans of items) {
      // Mark the payment/transfer as received
      let result;
      if (trans._jude.startsWith("transfer_")) {
        Log("handler", "transaction is a jude transfer");
        result = await markTransferAsReceived(trans._jude);
      } else if (trans._jude.startsWith("payment_")) {
        Log("handler", "transaction is a jude payment");
        result = await markPaymentAsReceived(trans._jude);
      } else {
        Log("handler.warning", "unknown transaction._jude type", trans._jude);
      }
      if (result.alreadyMarked) {
        // Has already been updated - don't do the rest of the stuff or we might eg. send duplicate notifications
        Log("handler", "transfer/payment is already marked as received", trans._jude);
        continue;
      }

      // Slack us
      if (trans._jude.startsWith("payment_")) {
        const timeTaken = moment(result.lastUpdated).fromNow(true);
        const timeTakenTotal = moment(result.created).fromNow(true);
        const slack = await notifySlack({ uri: process.env.SLACK_WEBHOOK, message: {
          channel: "#payments",
          attachments: [
            {
              fallback: `Payment received: ${trans._jude}`,
              title: trans._jude,
              text: `RECEIVED\nThis payment took ${timeTaken} since it was last updated (when it was marked as` +
                ` complete), and ${timeTakenTotal} since it was created.`,
              color: "good"
            }
          ]
        } });
      } else {
        const timeTaken = moment(result.lastUpdated).fromNow(true);
        const timeTakenTotal = moment(result.created).fromNow(true);
        const slack = await notifySlack({ uri: process.env.SLACK_WEBHOOK, message: {
          channel: "#transfers",
          attachments: [
            {
              fallback: `Transfer received: ${trans._jude}`,
              title: trans._jude,
              text: `RECEIVED\nThis transfer took ${timeTaken} since it was last updated (when it was marked as` +
                ` complete), and ${timeTakenTotal} since it was created.`,
              color: "good"
            }
          ]
        } });
      }
      Log("handler", "Sent a slack notification");

      // If this is part of a trigger, and the trigger is awaiting a payment confirmation, set it back to active
      if (trans._trigger) {
        const trigger = await getTriggerById(trans._user, trans._trigger);
        if (trigger.status === "AWAITING_PAYMENT") {
          await setTriggerStatus(trans._user, trans._trigger, "ACTIVE");
          Log("handler", "reset trigger");
        }
      }
    }
    Log("fn.handler.success");
    return callback(null, event);
  } catch (error) {
    Log("fn.handler.error", error);
    return callback(error);
  }
};
