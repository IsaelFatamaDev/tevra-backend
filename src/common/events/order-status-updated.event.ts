export class OrderStatusUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly orderNumber: string,
    public readonly customerEmail: string | undefined,
    public readonly customerName: string,
    public readonly oldStatus: string | undefined,
    public readonly newStatus: string,
    public readonly tenantId: string,
    public readonly agentEmail?: string,
    public readonly customerWhatsapp?: string,
    public readonly agentWhatsapp?: string,
  ) { }
}
