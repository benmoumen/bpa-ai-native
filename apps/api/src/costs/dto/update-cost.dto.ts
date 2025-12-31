import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsInt,
  ValidateIf,
  IsBoolean,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CostTypeEnum, VALID_CURRENCY_CODES } from './create-cost.dto';

/**
 * DTO for updating a cost
 */
export class UpdateCostDto {
  @ApiPropertyOptional({
    description: 'Updated display name',
    example: 'Updated Registration Fee',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated cost type',
    enum: CostTypeEnum,
    example: CostTypeEnum.FIXED,
  })
  @IsOptional()
  @IsEnum(CostTypeEnum)
  type?: CostTypeEnum;

  @ApiPropertyOptional({
    description: 'Updated fixed amount',
    example: 150.0,
  })
  @ValidateIf((o: UpdateCostDto) => o.type === CostTypeEnum.FIXED)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  fixedAmount?: number;

  @ApiPropertyOptional({
    description: 'Updated JSONata formula expression',
    example: '$sum(items.price) * 1.2',
  })
  @ValidateIf((o: UpdateCostDto) => o.type === CostTypeEnum.FORMULA)
  @IsString()
  formula?: string;

  @ApiPropertyOptional({
    description: 'Updated ISO 4217 currency code',
    example: 'EUR',
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_CURRENCY_CODES, {
    message: 'currency must be a valid ISO 4217 currency code',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Updated display order',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the cost is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
