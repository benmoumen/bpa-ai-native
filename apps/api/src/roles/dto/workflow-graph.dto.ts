import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Node data for React Flow diagram
 */
export class WorkflowNodeDataDto {
  @ApiProperty({ description: 'Role name' })
  name!: string;

  @ApiProperty({ enum: ['USER', 'BOT'], description: 'Role type' })
  roleType!: 'USER' | 'BOT';

  @ApiProperty({
    enum: ['APPLICANT', 'OPERATOR', 'SYSTEM'],
    description: 'Actor type',
  })
  actorType!: 'APPLICANT' | 'OPERATOR' | 'SYSTEM';

  @ApiPropertyOptional({ description: 'Assigned form name' })
  formName?: string;

  @ApiProperty({
    description: 'Available status outcomes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        code: { type: 'string' },
        name: { type: 'string' },
      },
    },
  })
  statuses!: { id: string; code: string; name: string }[];

  @ApiProperty({ description: 'Whether this is the start role' })
  isStartRole!: boolean;
}

/**
 * Node for React Flow diagram
 */
export class WorkflowNodeDto {
  @ApiProperty({ description: 'Role ID' })
  id!: string;

  @ApiProperty({ default: 'roleNode', description: 'Node type' })
  type!: string;

  @ApiProperty({ type: WorkflowNodeDataDto })
  data!: WorkflowNodeDataDto;

  @ApiProperty({
    description: 'Node position',
    type: 'object',
    properties: {
      x: { type: 'number' },
      y: { type: 'number' },
    },
  })
  position!: { x: number; y: number };
}

/**
 * Edge data for React Flow diagram
 */
export class WorkflowEdgeDataDto {
  @ApiProperty({
    enum: ['PASSED', 'RETURNED', 'REJECTED'],
    description: 'Status code',
  })
  statusCode!: 'PASSED' | 'RETURNED' | 'REJECTED';

  @ApiPropertyOptional({ description: 'Summary of transition conditions' })
  conditionSummary?: string;
}

/**
 * Edge for React Flow diagram
 */
export class WorkflowEdgeDto {
  @ApiProperty({ description: 'Transition ID' })
  id!: string;

  @ApiProperty({ description: 'Source role ID' })
  source!: string;

  @ApiProperty({ description: 'Target role ID' })
  target!: string;

  @ApiProperty({ description: 'Edge label (status code)' })
  label!: string;

  @ApiProperty({ type: WorkflowEdgeDataDto })
  data!: WorkflowEdgeDataDto;
}

/**
 * Complete workflow graph response for React Flow
 */
export class WorkflowGraphDto {
  @ApiProperty({ type: [WorkflowNodeDto], description: 'Graph nodes (roles)' })
  nodes!: WorkflowNodeDto[];

  @ApiProperty({
    type: [WorkflowEdgeDto],
    description: 'Graph edges (transitions)',
  })
  edges!: WorkflowEdgeDto[];
}
