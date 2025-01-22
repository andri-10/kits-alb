// StripeHandler.js
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

      this.stripe = Stripe(this.publishableKey);
      this.elements = this.stripe.elements();
      console.log('Stripe Elements initialized successfully');
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      throw error;
    }
  }

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

  createCardElement(elementId) {
    const style = {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    };

    this.card = this.elements.create('card', { style });
    this.card.mount(`#${elementId}`);
    console.log('Card Element mounted:', this.card);

    // Add event listener for card errors
    this.card.addEventListener('change', (event) => {
      const displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
    });

    return this.card;
  }

  async createPaymentIntent(amount) {
    try {
      console.log('Sending amount to backend:', amount);
  
      const response = await fetch('backend/create-payment-intent.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount }),
        credentials: 'same-origin'
      });
  
      const data = await response.json();
      console.log('Payment intent response:', data);
  
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment intent creation failed');
      }
  
      // Return the client secret from the response
      return data.clientSecret;
    } catch (error) {
      console.error('Payment intent error:', error);
      throw error;
    }
  }
  
  async processPayment(clientSecret) {
    try {
      if (!clientSecret) {
        throw new Error('Missing client secret for payment processing');
      }
  
      console.log('Processing payment with clientSecret:', clientSecret);
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: this.card }
      });
  
      if (result.error) {
        console.error('Payment failed:', result.error);
        throw new Error(result.error.message);
      }
  
      console.log('Payment successful:', result.paymentIntent);
      return result.paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

export default StripeHandler;