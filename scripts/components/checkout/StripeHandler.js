export class StripeHandler {
  constructor(publishableKey) {
    this.stripe = null;
    this.elements = null;
    this.publishableKey = publishableKey;
    this.card = null;
  }

  async initialize() {
    try {
      console.log('Loading Stripe script...');
      await this.loadStripeScript();
      console.log('Stripe script loaded successfully!');
      
      // Initialize Stripe with the public key
      this.stripe = Stripe(this.publishableKey);
      this.elements = this.stripe.elements();
      console.log('Stripe Elements initialized successfully');
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }

  // Function to load the Stripe script asynchronously
  async loadStripeScript() {
    return new Promise((resolve, reject) => {
      if (window.Stripe) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load Stripe script'));
      document.head.appendChild(script);
    });
  }

  // Create and mount the Stripe card element
  createCardElement(elementId) {
    const style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    };

    console.log(`Mounting card element on elementId: ${elementId}`);
    this.card = this.elements.create('card', { style });
    this.card.mount(`#${elementId}`);

    // Log card instance to ensure it's mounted
    console.log('Card Element mounted:', this.card);

    return this.card;
  }

  // Function to create a PaymentIntent on the backend
  async createPaymentIntent(amount) {
    try {
      console.log("Amount sent to backend:", amount);  // Debug log showing amount to be charged
      const response = await fetch('/backend/create-payment-intent.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }) // Send the calculated amount to the backend
      });

      // Check for a successful response from the backend
      if (!response.ok) {
        console.log(`This is response ${response}`)
        console.error('Error: Backend failed to create PaymentIntent', response);
        throw new Error('Failed to create payment intent');
      }

      // Parse the JSON response from the backend
      const data = await response.json();
      console.log("Backend response:", data);  // Log the response from backend

      if (data.error) {
        console.error('Backend error:', data.error);  // Log if there's an error in the backend response
        throw new Error(data.error);
      }

      return data;  // Return the successful response (including clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Function to process the payment after creating the PaymentIntent
  async processPayment(clientSecret) {
    try {
      console.log('Processing payment with clientSecret:', clientSecret);  // Log the client secret being used
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: this.card }
      });

      if (result.error) {
        console.error('Payment failed with error:', result.error.message);  // Log error if payment fails
        throw new Error(result.error.message);
      }

      console.log('Payment successfully processed:', result.paymentIntent);  // Log the successful paymentIntent
      return result.paymentIntent;  // Return the successful payment intent
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

export default StripeHandler;
