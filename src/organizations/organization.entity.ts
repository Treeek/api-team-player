import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Competition } from '../competitions/competition.entity';
import { Event } from '../events/event.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ nullable: true })
  public image: string;

  @OneToMany(type => Competition, competition => competition.organization, {
    cascade: true,
  })
  public competitions: Competition[];

  @OneToMany(type => Event, event => event.organization)
  public events: Event[];

  @Column()
  public name: string;
}
