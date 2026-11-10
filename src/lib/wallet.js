import { PRICE_PER_APPOINTMENT } from '../data/constants';

// Negocio propio (tiene wallet) o negocio público (la vista expone solo "available").
export const canAfford = (business) =>
  business.wallet ? business.wallet.balance >= PRICE_PER_APPOINTMENT : !!business.available;

export const appointmentsLeft = (balance) => Math.floor(balance / PRICE_PER_APPOINTMENT + 1e-9);
