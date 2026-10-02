import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class ChatTurnDto {
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @IsString()
  @MaxLength(4000)
  text!: string;
}

export class AiChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  /**
   * Prior turns of the current conversation, kept in the client for v1.
   * Ordered oldest -> newest. Used to give Gemini conversational context.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history?: ChatTurnDto[];
}
