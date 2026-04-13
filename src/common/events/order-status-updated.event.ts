export class OrderStatusUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerEmail: string | undefined, // Not all orders might have a direct user associated yet
    public readonly customerName: string,
    public readonly oldStatus: string | undefined,
    public readonly newStatus: string,
    public readonly tenantId: string,
		public readonly agentEmail?: string,
  ) {}
}
