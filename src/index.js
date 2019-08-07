import { Log, init, decrypt, notifySlack, sendPushNotification, sentrify, JudeUsers, getFromS3 } from "utils-common";
import { markPaymentAsReceived } from "./api/payments/update";
import { markTransferAsReceived } from "./api/transfers/update";
import { setTriggerStatus } from "./api/triggers/update";
import moment from "moment";
import numeral from "numeral";

exports.handler = sentrify(async (event, context, callback) => {
  console.log("E", JSON.stringify(event));
  try {
    await init(event, context);
    const data = JSON.parse((await getFromS3("jude-io-transactions", event.key)).Body.toString());
    Log("handler.init.info", data);
    const items = data.items.filter(item => {
      return item._jude && item.tmp.newlyReceived;
    });
    for (let trans of items) {
      // Mark the payment/transfer as received
      let result;
      if (trans._jude.startsWith("transfer_")) {
        Log("handler", "transaction is a jude transfer");
        result = await markTransferAsReceived(trans._jude, trans._id, trans._user);
      } else if (trans._jude.startsWith("payment_")) {
        Log("handler", "transaction is a jude payment");
        result = await markPaymentAsReceived(trans.tmp.jude, trans._id, trans._user);
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
        const trigger = await JudeUsers.get(trans._user, trans._trigger);
        if (trigger.status === "AWAITING_PAYMENT") {
          await setTriggerStatus(trans._user, trans._trigger, "ACTIVE");
          Log("handler", "reset trigger");
        }
      }

      // Send a notification
      if (trans.notify && result.payee) {
        const user = await JudeUsers.getUser(result.payee);
        const device = await JudeUsers.get(user._id, user._device);
        if (device.push_token) {
          let message;
          if (trans._jude.startsWith("payment_")) {
            const payer = JudeUsers.getUser(result.payer);
            const to = JudeUsers.get(user._id, result.to);
            message = `Payment of ${numeral(trans.amount).format("$0,000.00")} from ${payer.first_name} has arrived ` +
              `in your ${to.name} account`;
          } else {
            const to = JudeUsers.getAccount(user._id, result.to);
            message = `Transfer of ${numeral(trans.amount).format("$0,000.00")} has arrived in your ` +
              `${to.name} account`;
          }
          await sendPushNotification(user._id, device, null, message, trans._jude);
        }
      }
    }
    Log("fn.handler.success");
    return callback(null, event);
  } catch (error) {
    Log("fn.handler.error", error);
    return callback(error);
  }
});
