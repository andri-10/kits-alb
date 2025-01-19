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
        // Include credentials for session cookie
        credentials: 'same-origin'
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Server response:', responseText);
        throw new Error('Invalid server response');
      }

      // Handle authentication errors
      if (response.status === 401) {
        // Redirect to login page
        window.location.href = 'login.php';
        throw new Error('Please log in to continue');
      }

      if (response.status === 403) {
        throw new Error('Access denied');
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Payment intent creation failed');
      }

      return data;

    } catch (error) {
      console.error('Payment intent error:', error);
      throw error;
    }
  }

  async processPayment(clientSecret) {
    try {
      console.log('Processing payment with clientSecret:', clientSecret);
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: this.card },
      });

      if (result.error) {
        console.error('Payment failed with error:', result.error.message);
        throw new Error(result.error.message);
      }

      console.log('Payment successfully processed:', result.paymentIntent);
      return result.paymentIntent;
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }
}

export default StripeHandler;