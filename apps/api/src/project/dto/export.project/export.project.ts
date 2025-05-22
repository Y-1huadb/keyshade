import { IsOptional, IsString } from 'class-validator'

export class ExportProject {
  @IsString()
  format

  @IsString()
  @IsOptional()
  privateKey?: string
}
