import {
  LUPA_MEETING_SERVICE_FEE_PERCENTAGE,
  LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE,
} from '../../api/env';

export const calculateLupaMeetingServiceFee = (price: number) => {
  return price * (LUPA_MEETING_SERVICE_FEE_PERCENTAGE / 100);
};

export const calculateTotalMeetingServiceFee = (price: number) => {
  return calculateLupaMeetingServiceFee(price) + price;
};

export const calculateLupaProgramServiceFee = (price: number) => {
  return price * (LUPA_PROGRAM_SERVICE_FEE_PERCENTAGE / 100);
};

export const calculateTotalProgramServiceFee = (
  price: number,
  serviceFee: number,
) => {
  const totalPrice = price + serviceFee / 100;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price + calculateLupaProgramServiceFee(price));
};
