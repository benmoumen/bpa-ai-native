import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionResponseDto,
} from './dto/institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all active institutions
   */
  async findAll(includeInactive = false): Promise<InstitutionResponseDto[]> {
    const institutions = await this.prisma.institution.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });

    return institutions.map((i) => this.toDto(i));
  }

  /**
   * Find institution by ID
   */
  async findOne(id: string): Promise<InstitutionResponseDto> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution ${id} not found`);
    }

    return this.toDto(institution);
  }

  /**
   * Create a new institution
   */
  async create(dto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    // Check for duplicate code
    const existing = await this.prisma.institution.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Institution with code ${dto.code} already exists`,
      );
    }

    const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        code: dto.code,
        country: dto.country,
      },
    });

    return this.toDto(institution);
  }

  /**
   * Update an institution
   */
  async update(
    id: string,
    dto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException(`Institution ${id} not found`);
    }

    const updated = await this.prisma.institution.update({
      where: { id },
      data: {
        name: dto.name ?? institution.name,
        country: dto.country ?? institution.country,
        isActive: dto.isActive ?? institution.isActive,
      },
    });

    return this.toDto(updated);
  }

  /**
   * Seed demo institutions
   */
  async seedDemoInstitutions(): Promise<InstitutionResponseDto[]> {
    const demoInstitutions = [
      { code: 'MOC', name: 'Ministry of Commerce', country: 'GN' },
      { code: 'MOF', name: 'Ministry of Finance', country: 'GN' },
      { code: 'CUS', name: 'Customs Authority', country: 'GN' },
      { code: 'ENV', name: 'Environmental Agency', country: 'GN' },
      { code: 'TAX', name: 'Tax Authority', country: 'GN' },
    ];

    const results: InstitutionResponseDto[] = [];

    for (const inst of demoInstitutions) {
      const existing = await this.prisma.institution.findUnique({
        where: { code: inst.code },
      });

      if (!existing) {
        const created = await this.prisma.institution.create({
          data: inst,
        });
        results.push(this.toDto(created));
      } else {
        results.push(this.toDto(existing));
      }
    }

    return results;
  }

  private toDto(institution: {
    id: string;
    name: string;
    code: string;
    country: string | null;
    isActive: boolean;
    createdAt: Date;
  }): InstitutionResponseDto {
    return {
      id: institution.id,
      name: institution.name,
      code: institution.code,
      country: institution.country ?? undefined,
      isActive: institution.isActive,
      createdAt: institution.createdAt.toISOString(),
    };
  }
}
