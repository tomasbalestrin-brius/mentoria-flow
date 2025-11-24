import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEventRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  formData?: {
    nicho?: string;
    cargo?: string;
    faturamento?: string;
    dificuldade?: string;
    investimento?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientName, clientEmail, clientPhone, date, time, formData }: CalendarEventRequest = await req.json();
    
    const serviceAccountKey = Deno.env.get('GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY');
    if (!serviceAccountKey) {
      throw new Error('GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY not configured');
    }

    const credentials = JSON.parse(serviceAccountKey);
    
    // Criar JWT para autenticação
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const now = Math.floor(Date.now() / 1000);
    const jwtClaim = btoa(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    }));

    const jwtData = `${jwtHeader}.${jwtClaim}`;
    
    // Importar chave privada
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = credentials.private_key
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(jwtData)
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    const jwt = `${jwtData}.${signatureBase64}`;

    // Obter access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const { access_token } = await tokenResponse.json();

    // Criar evento no Google Calendar
    const [hours, minutes] = time.split(':');
    const startDateTime = new Date(`${date}T${hours}:${minutes}:00-03:00`); // Fuso horário Brasil
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hora de duração

    // Formatar descrição com dados do formulário
    let description = `Agendamento de Mentoria\n\n`;
    description += `Cliente: ${clientName}\n`;
    description += `Email: ${clientEmail}\n`;
    description += `Telefone: ${clientPhone}\n\n`;
    
    if (formData) {
      if (formData.nicho) description += `Nicho: ${formData.nicho}\n`;
      if (formData.cargo) description += `Cargo: ${formData.cargo}\n`;
      if (formData.faturamento) description += `Faturamento: ${formData.faturamento}\n`;
      if (formData.dificuldade) description += `Maior Dificuldade: ${formData.dificuldade}\n`;
      if (formData.investimento) description += `Investimento: ${formData.investimento}\n`;
    }

    const event = {
      summary: `Mentoria - ${clientName}`,
      description: description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 dia antes
          { method: 'popup', minutes: 60 }, // 1 hora antes
        ],
      },
      conferenceData: {
        createRequest: {
          requestId: `mentoria-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    // Criar evento no calendário - Service Accounts não podem adicionar participantes sem Domain-Wide Delegation
    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    const result = await calendarResponse.json();
    
    if (!calendarResponse.ok) {
      console.error('Google Calendar API error:', result);
      throw new Error(result.error?.message || 'Failed to create calendar event');
    }
    
    console.log('Google Calendar event created:', result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: result.id,
        htmlLink: result.htmlLink,
        hangoutLink: result.hangoutLink
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const error = err as Error;
    console.error('Error in create-calendar-event function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
