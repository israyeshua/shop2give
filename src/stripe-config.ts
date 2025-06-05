export const products = {
  'donation': {
    priceId: 'price_1RUZi7R19bsejBdlukMGNHJc',
    name: 'Donation',
    description: 'Make a donation to support this cause',
    mode: 'payment',
  },
} as const;

export type ProductId = keyof typeof products;