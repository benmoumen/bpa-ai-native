import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RoleInstitutionResponseDto,
  InstitutionForAssignmentDto,
} from './dto/role-institution.dto';

@Injectable()
export class RoleInstitutionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all institutions with their assignment status for a role
   */
  async getInstitutionsForRole(
    serviceId: string,
    roleId: string,
  ): Promise<InstitutionForAssignmentDto[]> {
    // Verify role exists and belongs to service
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    // Get all active institutions
    const institutions = await this.prisma.institution.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Get existing assignments for this role
    const assignments = await this.prisma.roleInstitution.findMany({
      where: { roleId },
    });

    const assignmentMap = new Map(assignments.map((a) => [a.institutionId, a]));

    return institutions.map((inst) => {
      const assignment = assignmentMap.get(inst.id);
      return {
        id: inst.id,
        name: inst.name,
        code: inst.code,
        country: inst.country ?? undefined,
        isAssigned: !!assignment,
        assignmentId: assignment?.id,
      };
    });
  }

  /**
   * Get assignments for a role
   */
  async getAssignmentsForRole(
    serviceId: string,
    roleId: string,
  ): Promise<RoleInstitutionResponseDto[]> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    const assignments = await this.prisma.roleInstitution.findMany({
      where: { roleId },
      include: {
        institution: {
          select: { name: true, code: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      roleId: a.roleId,
      institutionId: a.institutionId,
      institutionName: a.institution.name,
      institutionCode: a.institution.code,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * Assign an institution to a role
   */
  async assignInstitution(
    serviceId: string,
    roleId: string,
    institutionId: string,
  ): Promise<RoleInstitutionResponseDto> {
    // Verify role exists and belongs to service
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    // Verify institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      throw new NotFoundException(`Institution ${institutionId} not found`);
    }

    // Check if assignment already exists
    const existing = await this.prisma.roleInstitution.findUnique({
      where: {
        roleId_institutionId: { roleId, institutionId },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Institution ${institutionId} is already assigned to role ${roleId}`,
      );
    }

    const assignment = await this.prisma.roleInstitution.create({
      data: {
        roleId,
        institutionId,
      },
      include: {
        institution: {
          select: { name: true, code: true },
        },
      },
    });

    return {
      id: assignment.id,
      roleId: assignment.roleId,
      institutionId: assignment.institutionId,
      institutionName: assignment.institution.name,
      institutionCode: assignment.institution.code,
      createdAt: assignment.createdAt.toISOString(),
    };
  }

  /**
   * Unassign an institution from a role
   */
  async unassignInstitution(
    serviceId: string,
    roleId: string,
    institutionId: string,
  ): Promise<void> {
    // Verify role exists and belongs to service
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    const assignment = await this.prisma.roleInstitution.findUnique({
      where: {
        roleId_institutionId: { roleId, institutionId },
      },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment not found for institution ${institutionId} and role ${roleId}`,
      );
    }

    await this.prisma.roleInstitution.delete({
      where: { id: assignment.id },
    });
  }
}
