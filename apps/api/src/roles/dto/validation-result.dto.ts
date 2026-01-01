import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Validation issue severity levels
 */
export enum ValidationSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
}

/**
 * Validation issue codes for workflow validation
 */
export enum ValidationIssueCode {
  NO_START_ROLE = 'NO_START_ROLE',
  MULTIPLE_START_ROLES = 'MULTIPLE_START_ROLES',
  NO_END_ROLE = 'NO_END_ROLE',
  ORPHAN_ROLE = 'ORPHAN_ROLE',
  UNREACHABLE_ROLE = 'UNREACHABLE_ROLE',
  NO_TRANSITIONS = 'NO_TRANSITIONS',
  NO_ROLES = 'NO_ROLES',
  UNBOUND_REGISTRATION = 'UNBOUND_REGISTRATION',
  UNASSIGNED_INSTITUTION = 'UNASSIGNED_INSTITUTION',
}

/**
 * Individual validation issue
 */
export class ValidationIssueDto {
  @ApiProperty({
    enum: ValidationIssueCode,
    description: 'Issue code for programmatic handling',
  })
  code!: ValidationIssueCode;

  @ApiProperty({
    enum: ValidationSeverity,
    description: 'Issue severity level',
  })
  severity!: ValidationSeverity;

  @ApiProperty({ description: 'Human-readable description of the issue' })
  message!: string;

  @ApiPropertyOptional({
    description: 'ID of the affected role, if applicable',
  })
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Name of the affected role, if applicable',
  })
  roleName?: string;

  @ApiPropertyOptional({
    description: 'ID of the affected registration, if applicable',
  })
  registrationId?: string;

  @ApiPropertyOptional({
    description: 'Name of the affected registration, if applicable',
  })
  registrationName?: string;
}

/**
 * Workflow validation result
 */
export class ValidationResultDto {
  @ApiProperty({ description: 'Whether the workflow is valid' })
  isValid!: boolean;

  @ApiProperty({
    type: [ValidationIssueDto],
    description: 'List of validation issues found',
  })
  issues!: ValidationIssueDto[];

  @ApiProperty({ description: 'ISO timestamp when validation was performed' })
  validatedAt!: string;

  @ApiProperty({ description: 'Number of errors found' })
  errorCount!: number;

  @ApiProperty({ description: 'Number of warnings found' })
  warningCount!: number;

  /**
   * Create a validation result from issues
   */
  static fromIssues(issues: ValidationIssueDto[]): ValidationResultDto {
    const result = new ValidationResultDto();
    result.issues = issues;
    result.errorCount = issues.filter(
      (i) => i.severity === ValidationSeverity.ERROR,
    ).length;
    result.warningCount = issues.filter(
      (i) => i.severity === ValidationSeverity.WARNING,
    ).length;
    result.isValid = result.errorCount === 0;
    result.validatedAt = new Date().toISOString();
    return result;
  }
}
