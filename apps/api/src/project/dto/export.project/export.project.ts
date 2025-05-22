import { IsEnum, IsOptional, IsString } from 'class-validator'
import { ExportFormat } from '@prisma/client'

/**
 * DTO for exporting a project's configuration
 * @property format - The format to export the project configuration in (JSON, YAML, or ENV)
 * @property privateKey - Optional private key to encrypt sensitive data in the export
 */
export class ExportProject {
  @IsEnum(ExportFormat)
  format: ExportFormat

  @IsString()
  @IsOptional()
  privateKey?: string
}
