import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for role-institution assignment
 */
export class RoleInstitutionResponseDto {
  @ApiProperty({ description: 'Unique identifier for the assignment' })
  id!: string;

  @ApiProperty({ description: 'Role ID' })
  roleId!: string;

  @ApiProperty({ description: 'Institution ID' })
  institutionId!: string;

  @ApiProperty({ description: 'Institution name' })
  institutionName!: string;

  @ApiProperty({ description: 'Institution code' })
  institutionCode!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}

/**
 * Response DTO for listing available institutions for assignment
 */
export class InstitutionForAssignmentDto {
  @ApiProperty({ description: 'Institution ID' })
  id!: string;

  @ApiProperty({ description: 'Institution name' })
  name!: string;

  @ApiProperty({ description: 'Institution code' })
  code!: string;

  @ApiPropertyOptional({ description: 'Country code' })
  country?: string;

  @ApiProperty({
    description: 'Whether this institution is assigned to the role',
  })
  isAssigned!: boolean;

  @ApiPropertyOptional({
    description: 'Assignment ID if assigned',
  })
  assignmentId?: string;
}
