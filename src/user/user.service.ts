import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { UserRegisterInput } from 'src/graphql';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  findById(id: number, relations: string[] = []): Promise<User> {
    return this.userRepository.findOne(id, {
      relations: relations,
    });
  }

  findByName(name: string, relations: string[] = []): Promise<User> {
    return this.userRepository.findOne({
      where: {
        name: name,
      },
      relations: relations,
    });
  }

  async create(user: UserRegisterInput): Promise<InsertResult> {
    const existingUser = await this.userRepository.findOne({
      where: [{ name: user.name }, { email: user.email.toLowerCase() }],
    });

    if (existingUser) {
      if (
        user.name === existingUser.name &&
        user.email.toLowerCase() === existingUser.email
      ) {
        throw new Error('Email and name already exist');
      } else if (user.name === existingUser.name) {
        throw new Error('Name already exist');
      }

      throw new Error('Email already exist');
    }

    const newUser = this.userRepository.create();
    newUser.name = user.name;
    newUser.avatarUrl = '/avatar.png';
    newUser.email = user.email.toLowerCase();

    await newUser.setPassword(user.password);

    return this.userRepository.insert(newUser);
  }
}
