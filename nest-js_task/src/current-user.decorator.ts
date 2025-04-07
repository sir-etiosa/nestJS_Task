import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

interface JwtPayload {
  userId: string;
  email: string;
}

interface RequestWithUser {
  user: JwtPayload;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtPayload => {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext() as { req: RequestWithUser };
    return req.user;
  },
);
