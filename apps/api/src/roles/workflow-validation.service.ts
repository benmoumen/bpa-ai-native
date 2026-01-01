import { Injectable } from '@nestjs/common';
import { RoleStatusCode } from '@bpa/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  ValidationResultDto,
  ValidationIssueDto,
  ValidationIssueCode,
  ValidationSeverity,
} from './dto/validation-result.dto';

interface RoleWithTransitions {
  id: string;
  name: string;
  isStartRole: boolean;
  statuses: {
    id: string;
    code: RoleStatusCode;
    transitions: {
      toRoleId: string;
    }[];
  }[];
}

@Injectable()
export class WorkflowValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate workflow configuration for a service
   * Checks for: start role, end role, reachability, orphans
   */
  async validateWorkflow(serviceId: string): Promise<ValidationResultDto> {
    const issues: ValidationIssueDto[] = [];

    // Fetch all roles with their statuses and transitions
    const roles = await this.prisma.role.findMany({
      where: { serviceId, isActive: true },
      include: {
        statuses: {
          include: {
            transitions: {
              select: { toRoleId: true },
            },
          },
        },
      },
    });

    // Check if there are any roles
    if (roles.length === 0) {
      issues.push({
        code: ValidationIssueCode.NO_ROLES,
        severity: ValidationSeverity.ERROR,
        message:
          'No workflow roles defined. Add at least one role to create a workflow.',
      });
      return ValidationResultDto.fromIssues(issues);
    }

    // Check for start role
    const startRoles = roles.filter((r) => r.isStartRole);
    if (startRoles.length === 0) {
      issues.push({
        code: ValidationIssueCode.NO_START_ROLE,
        severity: ValidationSeverity.ERROR,
        message: 'No start role defined. Mark one role as the start role.',
      });
    } else if (startRoles.length > 1) {
      issues.push({
        code: ValidationIssueCode.MULTIPLE_START_ROLES,
        severity: ValidationSeverity.ERROR,
        message: `Multiple start roles found: ${startRoles.map((r) => r.name).join(', ')}. Only one start role is allowed.`,
      });
    }

    // Build transition map
    const outgoingTransitions = new Map<string, Set<string>>();
    const incomingTransitions = new Map<string, Set<string>>();

    for (const role of roles) {
      outgoingTransitions.set(role.id, new Set());
      incomingTransitions.set(role.id, new Set());
    }

    for (const role of roles) {
      for (const status of role.statuses) {
        // Skip PENDING status as it doesn't create outgoing transitions
        if (status.code === RoleStatusCode.PENDING) continue;

        for (const transition of status.transitions) {
          outgoingTransitions.get(role.id)?.add(transition.toRoleId);
          incomingTransitions.get(transition.toRoleId)?.add(role.id);
        }
      }
    }

    // Check for end roles (roles with no outgoing transitions from PASSED/REJECTED)
    const endRoles = roles.filter((r) => {
      const outgoing = outgoingTransitions.get(r.id);
      return !outgoing || outgoing.size === 0;
    });

    // Check if any transitions exist
    const hasAnyTransitions = roles.some((r) => {
      const outgoing = outgoingTransitions.get(r.id);
      return outgoing && outgoing.size > 0;
    });

    if (!hasAnyTransitions && roles.length > 1) {
      issues.push({
        code: ValidationIssueCode.NO_TRANSITIONS,
        severity: ValidationSeverity.WARNING,
        message:
          'No transitions defined between roles. Configure transitions to create the workflow flow.',
      });
    }

    // If transitions exist but no end roles, workflow might be circular-only
    if (hasAnyTransitions && endRoles.length === 0) {
      issues.push({
        code: ValidationIssueCode.NO_END_ROLE,
        severity: ValidationSeverity.WARNING,
        message:
          'No terminal roles found. Ensure at least one role has no outgoing transitions.',
      });
    }

    // Check reachability from start role using BFS
    if (startRoles.length === 1) {
      const reachable = this.findReachableRoles(
        startRoles[0].id,
        roles as RoleWithTransitions[],
      );

      for (const role of roles) {
        if (!reachable.has(role.id)) {
          issues.push({
            code: ValidationIssueCode.UNREACHABLE_ROLE,
            severity: ValidationSeverity.ERROR,
            message: `Role "${role.name}" is not reachable from the start role.`,
            roleId: role.id,
            roleName: role.name,
          });
        }
      }
    }

    // Check for orphan roles (no incoming and not start)
    for (const role of roles) {
      const incoming = incomingTransitions.get(role.id);
      if ((!incoming || incoming.size === 0) && !role.isStartRole) {
        // Only flag as orphan if there are other roles with transitions
        if (hasAnyTransitions) {
          issues.push({
            code: ValidationIssueCode.ORPHAN_ROLE,
            severity: ValidationSeverity.WARNING,
            message: `Role "${role.name}" has no incoming transitions and is not the start role.`,
            roleId: role.id,
            roleName: role.name,
          });
        }
      }
    }

    // Check for unbound registrations (registrations with no roles bound)
    const unboundIssues = await this.checkUnboundRegistrations(serviceId);
    issues.push(...unboundIssues);

    // Check for UserRoles without institution assignments
    const unassignedIssues = await this.checkUnassignedInstitutions(serviceId);
    issues.push(...unassignedIssues);

    return ValidationResultDto.fromIssues(issues);
  }

  /**
   * Check for registrations that have no roles bound to them
   */
  private async checkUnboundRegistrations(
    serviceId: string,
  ): Promise<ValidationIssueDto[]> {
    const issues: ValidationIssueDto[] = [];

    // Get all registrations in the service
    const registrations = await this.prisma.registration.findMany({
      where: { serviceId },
      include: {
        roles: {
          select: { id: true },
        },
      },
    });

    for (const registration of registrations) {
      if (registration.roles.length === 0) {
        issues.push({
          code: ValidationIssueCode.UNBOUND_REGISTRATION,
          severity: ValidationSeverity.WARNING,
          message: `Registration "${registration.name}" has no processing roles.`,
          registrationId: registration.id,
          registrationName: registration.name,
        });
      }
    }

    return issues;
  }

  /**
   * Check for UserRoles that have no institutions assigned
   * (BotRoles don't need institution assignments)
   */
  private async checkUnassignedInstitutions(
    serviceId: string,
  ): Promise<ValidationIssueDto[]> {
    const issues: ValidationIssueDto[] = [];

    // Get all USER roles in the service (BOT roles don't need institutions)
    const userRoles = await this.prisma.role.findMany({
      where: { serviceId, isActive: true, roleType: 'USER' },
      include: {
        institutions: {
          select: { id: true },
        },
      },
    });

    for (const role of userRoles) {
      if (role.institutions.length === 0) {
        issues.push({
          code: ValidationIssueCode.UNASSIGNED_INSTITUTION,
          severity: ValidationSeverity.ERROR,
          message: `Role "${role.name}" requires institution assignment for publishing.`,
          roleId: role.id,
          roleName: role.name,
        });
      }
    }

    return issues;
  }

  /**
   * Find all roles reachable from a start role using BFS
   */
  private findReachableRoles(
    startRoleId: string,
    roles: RoleWithTransitions[],
  ): Set<string> {
    const reachable = new Set<string>();
    const queue = [startRoleId];

    // Build a map for quick lookup
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    while (queue.length > 0) {
      const roleId = queue.shift()!;
      if (reachable.has(roleId)) continue;
      reachable.add(roleId);

      const role = roleMap.get(roleId);
      if (!role) continue;

      // Follow all outgoing transitions
      for (const status of role.statuses) {
        for (const transition of status.transitions) {
          if (!reachable.has(transition.toRoleId)) {
            queue.push(transition.toRoleId);
          }
        }
      }
    }

    return reachable;
  }
}
