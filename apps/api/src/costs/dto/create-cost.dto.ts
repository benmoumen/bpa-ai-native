import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  ValidateIf,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Complete ISO 4217 currency codes
 * Full list of active currency codes as defined by the ISO 4217 standard
 * Source: https://www.iso.org/iso-4217-currency-codes.html
 */
export const VALID_CURRENCY_CODES = [
  // A
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  // B
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BOV',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BZD',
  // C
  'CAD',
  'CDF',
  'CHE',
  'CHF',
  'CHW',
  'CLF',
  'CLP',
  'CNY',
  'COP',
  'COU',
  'CRC',
  'CUC',
  'CUP',
  'CVE',
  'CZK',
  // D
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  // E
  'EGP',
  'ERN',
  'ETB',
  'EUR',
  // F
  'FJD',
  'FKP',
  // G
  'GBP',
  'GEL',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  // H
  'HKD',
  'HNL',
  'HTG',
  'HUF',
  // I
  'IDR',
  'ILS',
  'INR',
  'IQD',
  'IRR',
  'ISK',
  // J
  'JMD',
  'JOD',
  'JPY',
  // K
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KPW',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  // L
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'LYD',
  // M
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRU',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MXV',
  'MYR',
  'MZN',
  // N
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  // O
  'OMR',
  // P
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  // Q
  'QAR',
  // R
  'RON',
  'RSD',
  'RUB',
  'RWF',
  // S
  'SAR',
  'SBD',
  'SCR',
  'SDG',
  'SEK',
  'SGD',
  'SHP',
  'SLE',
  'SLL',
  'SOS',
  'SRD',
  'SSP',
  'STN',
  'SVC',
  'SYP',
  'SZL',
  // T
  'THB',
  'TJS',
  'TMT',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  // U
  'UAH',
  'UGX',
  'USD',
  'USN',
  'UYI',
  'UYU',
  'UYW',
  'UZS',
  // V
  'VED',
  'VES',
  'VND',
  'VUV',
  // W
  'WST',
  // X - Special currencies
  'XAF',
  'XAG',
  'XAU',
  'XBA',
  'XBB',
  'XBC',
  'XBD',
  'XCD',
  'XDR',
  'XOF',
  'XPD',
  'XPF',
  'XPT',
  'XSU',
  'XTS',
  'XUA',
  'XXX',
  // Y
  'YER',
  // Z
  'ZAR',
  'ZMW',
  'ZWL',
] as const;

/**
 * Cost type enum matching database
 */
export enum CostTypeEnum {
  FIXED = 'FIXED',
  FORMULA = 'FORMULA',
}

/**
 * DTO for creating a cost associated with a registration
 */
export class CreateCostDto {
  @ApiProperty({
    description: 'Display name for the cost',
    example: 'Registration Fee',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Cost type: FIXED for direct amount, FORMULA for calculated',
    enum: CostTypeEnum,
    example: CostTypeEnum.FIXED,
  })
  @IsEnum(CostTypeEnum)
  type!: CostTypeEnum;

  @ApiPropertyOptional({
    description: 'Fixed amount (required when type is FIXED)',
    example: 100.0,
  })
  @ValidateIf((o: CreateCostDto) => o.type === CostTypeEnum.FIXED)
  @IsNotEmpty({ message: 'fixedAmount is required when type is FIXED' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  fixedAmount?: number;

  @ApiPropertyOptional({
    description: 'JSONata formula expression (required when type is FORMULA)',
    example: '$sum(items.price) * 1.1',
  })
  @ValidateIf((o: CreateCostDto) => o.type === CostTypeEnum.FORMULA)
  @IsNotEmpty({ message: 'formula is required when type is FORMULA' })
  @IsString()
  formula?: string;

  @ApiPropertyOptional({
    description: 'ISO 4217 currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_CURRENCY_CODES, {
    message: 'currency must be a valid ISO 4217 currency code',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Display order within the registration',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
