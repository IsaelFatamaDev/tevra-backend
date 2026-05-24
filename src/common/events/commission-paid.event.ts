export class CommissionPaidEvent {
  constructor(
    public readonly agentEmail: string,
    public readonly agentName: string,
    public readonly amount: number,
    public readonly orderNumber?: string,
  ) {}
}
