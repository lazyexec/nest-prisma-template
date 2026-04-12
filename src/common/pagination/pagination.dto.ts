import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationBaseDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Cursor token from previous response for cursor pagination',
    example: 'clx123abc',
  })
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({
    description: 'Page number (offset pagination)',
    example: 1,
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(150)
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  limit?: number = 10;
}

export class PaginationMetaDto {
  @ApiProperty()
  mode!: 'offset' | 'cursor';

  @ApiProperty({ required: false })
  total?: number;

  @ApiProperty({ required: false })
  page?: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty({ required: false })
  totalPages?: number;

  @ApiProperty()
  hasNext!: boolean;

  @ApiProperty({ required: false })
  hasPrev?: boolean;

  @ApiProperty({ required: false, nullable: true })
  cursor?: string | null;

  @ApiProperty({ required: false, nullable: true })
  nextCursor?: string | null;
}
