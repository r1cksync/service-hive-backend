import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, TokenPayload } from './jwt';

export function withAuth(
  handler: (request: NextRequest, user: TokenPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid token.' },
        { status: 401 }
      );
    }

    return handler(request, user);
  };
}
