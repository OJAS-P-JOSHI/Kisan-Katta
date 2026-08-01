declare module 'react-native-razorpay' {
  type RazorpaySuccess = {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    razorpay_subscription_id?: string;
    razorpay_signature: string;
  };

  type RazorpayError = {
    code: number | string;
    description?: string;
  };

  class RazorpayCheckout {
    static open(
      options: Record<string, unknown>,
      successCallback?: (data: RazorpaySuccess) => void,
      errorCallback?: (error: RazorpayError) => void,
    ): Promise<RazorpaySuccess>;
  }

  export default RazorpayCheckout;
}
