import { fetchUpdatedPaymentIntent } from "../../api/payments";

const waitForCharge = async (
    paymentIntentId: string,
    maxAttempts = 10,
    delayMs = 2000,
  ) => {
    for (let i = 0; i < maxAttempts; i++) {
      const updatedPaymentIntent = await fetchUpdatedPaymentIntent(
        paymentIntentId,
      );

      if (
        updatedPaymentIntent.status === 'succeeded' &&
        updatedPaymentIntent.latest_charge
      ) {
        return updatedPaymentIntent.latest_charge;
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    throw new Error('Charge not created within the expected timeframe');
  };

  export {waitForCharge}