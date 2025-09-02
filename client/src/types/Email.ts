export interface Email {
    _id: string;
    messageId: string;
    sender: string;
    subject: string;
    receivedAt: string;
    rawHeaders: Record<string, any>;
    receivingChain: string[];
    espType: string;
    espDetails: string;
    processed: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface EmailStats {
    total: number;
    today: number;
    espBreakdown: Record<string, number>;
    hourlyDistribution: Record<string, number>;
}