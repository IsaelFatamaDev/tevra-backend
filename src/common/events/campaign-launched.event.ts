export class CampaignLaunchedEvent {
  constructor(
    public readonly campaignId: string,
    public readonly tenantId: string,
    public readonly subject: string,
    public readonly content: string,
    public readonly targetAudienceEmails: string[],
    public readonly targetAudiencePhones: string[],
  ) {}
}
