export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface JwtRequest {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}
