import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../current-user.decorator';
import { User, AuthResponse } from './user.model';

@Resolver()
export class UserResolver {
  constructor(private userService: UserService) {}

  @Mutation(() => User)
  async register(
    @Args('email') email: string,
    @Args('password') password: string,
    @Args('biometricKey', { nullable: true }) biometricKey?: string,
  ): Promise<User> {
    return this.userService.register(email, password, biometricKey);
  }

  @Mutation(() => AuthResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthResponse> {
    return this.userService.login(email, password);
  }

  @Mutation(() => AuthResponse)
  async biometricLogin(
    @Args('biometricKey') biometricKey: string,
  ): Promise<AuthResponse> {
    return this.userService.biometricLogin(biometricKey);
  }

  @Query(() => User)
  @UseGuards(AuthGuard('jwt'))
  async me(
    @CurrentUser() user: { userId: string; email: string },
  ): Promise<User> {
    const foundUser = await this.userService.findById(user.userId);
    if (!foundUser) {
      throw new NotFoundException(`User with ID ${user.userId} not found`);
    }
    return foundUser;
  }
}
