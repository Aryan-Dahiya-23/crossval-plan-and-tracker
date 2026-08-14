import { z } from 'zod';

export const MAX_MONEY_MINOR_STRING = '99999999999999';
export const MAX_MONEY_MINOR_BIGINT = 99_999_999_999_999n;

export const moneyMinorStringRegex = /^\d+$/;

export const moneyMinorStringSchema = z
  .string()
  .regex(moneyMinorStringRegex, 'Money minor value must be a non-negative integer string.')
  .refine(
    (value) => {
      if (value.length > MAX_MONEY_MINOR_STRING.length) {
        return false;
      }
      if (value.length === MAX_MONEY_MINOR_STRING.length) {
        return value <= MAX_MONEY_MINOR_STRING;
      }
      return true;
    },
    {
      message: `Amount exceeds the maximum allowed value (${MAX_MONEY_MINOR_STRING} minor units).`,
    },
  )
  .brand<'MoneyMinorString'>();

export type MoneyMinorString = z.infer<typeof moneyMinorStringSchema>;

export const signedMoneyMinorStringRegex = /^-?\d+$/;

export const signedMoneyMinorStringSchema = z
  .string()
  .regex(signedMoneyMinorStringRegex, 'Signed money minor value must be an integer string.')
  .brand<'SignedMoneyMinorString'>();

export type SignedMoneyMinorString = z.infer<typeof signedMoneyMinorStringSchema>;

export const moneyInputRegex = /^\s*\$?\s*(\d+)(?:\.(\d{1,2}))?\s*$/;

export const moneyInputSchema = z
  .string()
  .trim()
  .regex(
    moneyInputRegex,
    'Amount must be a valid positive currency amount with at most two decimal places.',
  );

export type MoneyInput = z.infer<typeof moneyInputSchema>;
