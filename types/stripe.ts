export type StripeCustomer = {
    id: string;
    object: 'customer';
    address: null;
    balance: number;
    created: number;
    currency: null;
    default_source: null;
    delinquent: boolean;
    description: null;
    discount: null;
    email: string;
    invoice_prefix: string;
    invoice_settings: {
      custom_fields: null;
      default_payment_method: null;
      footer: null;
      rendering_options: null;
    };
    livemode: boolean;
    metadata: {};
    name: string;
    next_invoice_sequence: number;
    phone: null;
    preferred_locales: [];
    shipping: null;
    tax_exempt: 'none';
    test_clock: null;
  };