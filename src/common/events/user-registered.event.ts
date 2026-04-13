export class UserRegisteredEvent {
  constructor(
    public readonly email: string,
    public readonly firstName: string,
    public readonly password: string,
    public readonly verificationToken: string,
    public readonly tenantId: string,
  ) {}
}
