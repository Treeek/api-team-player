import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Organization } from './organization.entity';
import { Repository } from 'typeorm';
import { CreateEventDTO } from './createEventDTO';
import { Event } from '../events/event.entity';
import { Match } from '../matches/match.entity';
import { Competition } from '../competitions/competition.entity';
import { CreateCompetitionDTO } from './createCompetitionDTO';
import { CreateMatchDTO } from './createMatchDTO';
import { ImageUploadService } from '../image-upload/image-upload.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(Competition)
    private readonly competitionRepository: Repository<Competition>,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  async findAllEvents(organizationId: any, page: number, take: number) {
    const skip = (page - 1) * take;
    return this.eventsRepository.findAndCount({
      where: { organization: { id: organizationId } },
      relations: ['organization'],
      take,
      skip,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllMatches(organizationId: any, page: number, take: number) {
    const skip = (page - 1) * take;

    return this.matchesRepository.findAndCount({
      where: { competition: { organization: { id: organizationId } } },
      relations: [
        'competition',
        'competition.event',
        'competition.organization',
      ],
      take,
      skip,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAllCompetitions(organizationId: any, page: number, take: number) {
    const skip = (page - 1) * take;
    return this.competitionRepository.findAndCount({
      where: [{ organization: { id: organizationId } }],
      relations: ['organization', 'event'],
      take,
      skip,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async addCompetition(
    createCompetitionDTO: CreateCompetitionDTO,
    organizationId: string,
  ) {
    const competition = this.competitionRepository.create(createCompetitionDTO);

    if (createCompetitionDTO.eventId) {
      const res = await this.eventsRepository.findOne({
        where: {
          id: createCompetitionDTO.eventId,
          organization: { id: organizationId },
        },
      });
      if (!res) {
        throw new NotFoundException('Event not found');
      }
      const event = this.eventsRepository.create({
        id: createCompetitionDTO.eventId,
      });
      competition.event = event;
    }

    if (createCompetitionDTO.image) {
      const res = await this.imageUploadService.uploadImage(
        createCompetitionDTO.image,
      );
      const resjson = await res.json();
      if (resjson.data && resjson.success && resjson.status === 200) {
        competition.image = resjson.data.link;
      }
    }

    const organization = this.organizationRepository.create({
      id: organizationId,
    });
    competition.organization = organization;

    return this.competitionRepository.save(competition, {
      reload: true,
    });
  }

  async addEvent(createEventDTO: CreateEventDTO, organizationId: string) {
    const event = this.eventsRepository.create(createEventDTO);
    const organization = new Organization();
    organization.id = organizationId;
    event.organization = organization;

    if (createEventDTO.image) {
      const res = await this.imageUploadService.uploadImage(
        createEventDTO.image,
      );
      const resjson = await res.json();
      if (resjson.data && resjson.success && resjson.status === 200) {
        event.image = resjson.data.link;
      }
    }

    await this.eventsRepository.save(event);
    return this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['events', 'events.organization'],
    });
  }

  async addMatch(createMatchDTO: CreateMatchDTO, competitionId: string) {
    const match = this.matchesRepository.create(createMatchDTO);
    const competition = await this.competitionRepository.findOne({
      where: { id: competitionId },
    });
    if (!competition) {
      throw new NotFoundException('Competition not found');
    }
    const [resImagePrincipal, resImageVisitor] = await Promise.all([
      this.imageUploadService.uploadImage(createMatchDTO.imagePrincipal),
      this.imageUploadService.uploadImage(createMatchDTO.imageVisitor),
    ]);

    const [jsonPrincipal, jsonVisitor] = await Promise.all([
      resImagePrincipal.json(),
      resImageVisitor.json(),
    ]);

    if (
      jsonPrincipal.data &&
      jsonPrincipal.success &&
      jsonPrincipal.status === 200
    ) {
      match.imagePrincipal = jsonPrincipal.data.link;
    }

    if (jsonVisitor.data && jsonVisitor.success && jsonVisitor.status === 200) {
      match.imageVisitor = jsonVisitor.data.link;
    }

    match.competition = competition;
    return this.matchesRepository.save(match);
  }
}
