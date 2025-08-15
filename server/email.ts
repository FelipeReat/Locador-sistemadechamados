import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, html, attachments } = options;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'servicedesk@acme.com',
    to,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export const emailTemplates = {
  ticketCreated: (ticket: any, requester: any) => ({
    subject: `[ServiceDesk] Chamado ${ticket.code} criado: ${ticket.subject}`,
    html: `
      <h2>Novo chamado criado</h2>
      <p><strong>Código:</strong> ${ticket.code}</p>
      <p><strong>Assunto:</strong> ${ticket.subject}</p>
      <p><strong>Prioridade:</strong> ${ticket.priority}</p>
      <p><strong>Solicitante:</strong> ${requester.name} (${requester.email})</p>
      <p><strong>Descrição:</strong></p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
        ${ticket.description}
      </div>
      <hr>
      <p>Acesse o sistema para mais detalhes.</p>
    `,
  }),

  ticketAssigned: (ticket: any, assignee: any) => ({
    subject: `[ServiceDesk] Chamado ${ticket.code} atribuído para você`,
    html: `
      <h2>Chamado atribuído</h2>
      <p>Olá ${assignee.name},</p>
      <p>O chamado <strong>${ticket.code} - ${ticket.subject}</strong> foi atribuído para você.</p>
      <p><strong>Prioridade:</strong> ${ticket.priority}</p>
      <p><strong>Status:</strong> ${ticket.status}</p>
      <p>Por favor, acesse o sistema para dar andamento.</p>
    `,
  }),

  ticketUpdated: (ticket: any, user: any) => ({
    subject: `[ServiceDesk] Chamado ${ticket.code} atualizado`,
    html: `
      <h2>Chamado atualizado</h2>
      <p>O chamado <strong>${ticket.code} - ${ticket.subject}</strong> foi atualizado.</p>
      <p><strong>Status atual:</strong> ${ticket.status}</p>
      <p><strong>Prioridade:</strong> ${ticket.priority}</p>
      <p>Acesse o sistema para ver os detalhes completos.</p>
    `,
  }),

  ticketResolved: (ticket: any, requester: any) => ({
    subject: `[ServiceDesk] Chamado ${ticket.code} resolvido`,
    html: `
      <h2>Chamado resolvido</h2>
      <p>Olá ${requester.name},</p>
      <p>Seu chamado <strong>${ticket.code} - ${ticket.subject}</strong> foi resolvido.</p>
      <p>Se você não está satisfeito com a solução, pode reabrir o chamado respondendo a este email.</p>
      <p>Caso contrário, o chamado será fechado automaticamente em 3 dias.</p>
      <p>Obrigado por usar nossos serviços!</p>
    `,
  }),
};
