
import { randomUUID } from 'crypto';
import { storage } from './storage';
import { sendEmail } from './email';

export interface CSATSurvey {
  id: string;
  ticketId: string;
  requesterId: string;
  score?: number; // 1-5
  comment?: string;
  token: string; // For anonymous access
  sentAt: Date;
  respondedAt?: Date;
  createdAt: Date;
}

export interface CSATMetrics {
  totalSurveys: number;
  totalResponses: number;
  responseRate: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
}

class CSATService {
  private surveys: CSATSurvey[] = [];

  async createSurvey(ticketId: string, requesterId: string): Promise<CSATSurvey> {
    const survey: CSATSurvey = {
      id: randomUUID(),
      ticketId,
      requesterId,
      token: randomUUID(),
      sentAt: new Date(),
      createdAt: new Date(),
    };

    this.surveys.push(survey);

    // Send CSAT survey email
    await this.sendCSATEmail(survey);

    return survey;
  }

  async getSurvey(id: string): Promise<CSATSurvey | undefined> {
    return this.surveys.find(s => s.id === id);
  }

  async getSurveyByToken(token: string): Promise<CSATSurvey | undefined> {
    return this.surveys.find(s => s.token === token);
  }

  async submitResponse(token: string, score: number, comment?: string): Promise<CSATSurvey> {
    const survey = this.surveys.find(s => s.token === token);
    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.respondedAt) {
      throw new Error('Survey already responded');
    }

    if (score < 1 || score > 5) {
      throw new Error('Score must be between 1 and 5');
    }

    survey.score = score;
    survey.comment = comment;
    survey.respondedAt = new Date();

    return survey;
  }

  async getCSATMetrics(orgId: string, period?: { from: Date; to: Date }): Promise<CSATMetrics> {
    // Filter surveys by organization (through ticket)
    const orgSurveys = [];
    for (const survey of this.surveys) {
      const ticket = await storage.getTicket(survey.ticketId);
      if (ticket?.orgId === orgId) {
        if (!period || (survey.createdAt >= period.from && survey.createdAt <= period.to)) {
          orgSurveys.push(survey);
        }
      }
    }

    const totalSurveys = orgSurveys.length;
    const responses = orgSurveys.filter(s => s.score !== undefined);
    const totalResponses = responses.length;
    const responseRate = totalSurveys > 0 ? (totalResponses / totalSurveys) * 100 : 0;

    const scores = responses.map(s => s.score!);
    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const scoreDistribution = {
      '1': scores.filter(s => s === 1).length,
      '2': scores.filter(s => s === 2).length,
      '3': scores.filter(s => s === 3).length,
      '4': scores.filter(s => s === 4).length,
      '5': scores.filter(s => s === 5).length,
    };

    return {
      totalSurveys,
      totalResponses,
      responseRate,
      averageScore,
      scoreDistribution,
    };
  }

  private async sendCSATEmail(survey: CSATSurvey): Promise<void> {
    try {
      const ticket = await storage.getTicket(survey.ticketId);
      const requester = await storage.getUser(survey.requesterId);

      if (!ticket || !requester) {
        throw new Error('Ticket or requester not found');
      }

      const surveyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/csat/${survey.token}`;

      await sendEmail({
        to: requester.email,
        subject: `Como foi nosso atendimento? - Chamado ${ticket.code}`,
        html: this.generateCSATEmailTemplate(ticket, surveyUrl),
      });

    } catch (error) {
      console.error('Failed to send CSAT email:', error);
    }
  }

  private generateCSATEmailTemplate(ticket: any, surveyUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Como foi nosso atendimento?</h2>
        
        <p>Olá!</p>
        
        <p>Gostaríamos de saber sua opinião sobre o atendimento do chamado:</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Chamado:</strong> ${ticket.code}</p>
          <p><strong>Assunto:</strong> ${ticket.subject}</p>
        </div>
        
        <p>Sua avaliação é muito importante para melhorarmos nossos serviços.</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="${surveyUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Avaliar Atendimento
          </a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="word-break: break-all; color: #2563eb;">${surveyUrl}</p>
        
        <hr style="margin: 24px 0;">
        <p style="color: #64748b; font-size: 14px;">
          Esta pesquisa expira em 30 dias. Obrigado pela sua colaboração!
        </p>
      </div>
    `;
  }
}

export const csatService = new CSATService();
