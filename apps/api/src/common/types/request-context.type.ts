export type RequestContext = {
  userId: string;
  email: string;
  organisationId?: string;
  role?: string;
  membershipId?: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      ctx?: RequestContext;
      requestId?: string;
    }
  }
}
