import {
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiUseTags,
  ApiBearerAuth,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiImplicitQuery,
  ApiImplicitParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedResponse } from '../util/unauthorized.response';
import { UsersService } from '../users/users.service';
import { MatchesService } from '../matches/matches.service';

@ApiUseTags('Competitions')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('competitions')
export class CompetitionsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly matchesService: MatchesService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ title: 'Get All Competitions that the curretn user follows' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponse,
  })
  @ApiOkResponse({ description: 'Ok' })
  @Get('following')
  async allFollowing(@Request() req) {
    return await this.usersService.findUserAndCompetitionsById(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ title: 'Get All Competitions' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponse,
  })
  @ApiOkResponse({ description: 'Ok' })
  @Get()
  async all(@Request() req) {
    return await this.usersService.allCompetitionsWithFollows(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ title: 'Get matches in a competition' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
    type: UnauthorizedResponse,
  })
  @ApiOkResponse({ description: 'Ok' })
  @ApiImplicitQuery({ name: 'limit', type: String, required: false })
  @ApiImplicitQuery({ name: 'page', type: String, required: false })
  @ApiImplicitParam({ name: 'competition_id', type: String })
  @Get(':competition_id/matches')
  async allMatches(@Request() req, @Param('competition_id') competitionId) {
    return {
      matches: await this.matchesService.findByCompetitionId(competitionId),
    };
  }
}
