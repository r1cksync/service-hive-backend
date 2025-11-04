import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface SlotSuggestion {
  targetSlotId: string;
  mySlotId: string;
  reason: string;
  compatibilityScore: number;
}

export async function getSwapSuggestions(
  mySlots: any[],
  availableSlots: any[]
): Promise<SlotSuggestion[]> {
  try {
    const prompt = `You are an intelligent scheduling assistant. Analyze these time slots and suggest optimal swaps.

My Available Slots for Swapping:
${mySlots.map((s, i) => `${i + 1}. ${s.title} (${new Date(s.startTime).toLocaleString()} - ${new Date(s.endTime).toLocaleString()})`).join('\n')}

Other Users' Available Slots:
${availableSlots.map((s, i) => `${i + 1}. ID: ${s.id}, ${s.title} by ${s.owner.name} (${new Date(s.startTime).toLocaleString()} - ${new Date(s.endTime).toLocaleString()})`).join('\n')}

Suggest up to 3 best swap matches considering:
1. Similar time duration
2. Time of day compatibility
3. Weekday vs weekend patterns
4. Meeting type compatibility

Return ONLY a JSON array with this exact format (no other text):
[{"targetSlotId": "slot_id", "mySlotId": "my_slot_id", "reason": "brief reason", "compatibilityScore": 0.85}]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Groq API error:', error);
    return [];
  }
}

export async function detectScheduleConflicts(events: any[]): Promise<string[]> {
  try {
    const prompt = `Analyze this schedule for potential conflicts or issues:

Events:
${events.map((e, i) => `${i + 1}. ${e.title} (${new Date(e.startTime).toLocaleString()} - ${new Date(e.endTime).toLocaleString()}) [${e.status}]`).join('\n')}

Identify:
1. Overlapping events
2. Back-to-back meetings without breaks
3. Events outside typical work hours
4. Long duration events that might need splitting

Return a JSON array of warning strings: ["warning 1", "warning 2"]`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content || '[]';
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [];
  } catch (error) {
    console.error('Groq API error:', error);
    return [];
  }
}

export async function generateSmartEventTitle(startTime: Date, endTime: Date, context?: string): Promise<string> {
  try {
    const prompt = `Generate a concise, professional event title for a calendar slot:
Time: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}
${context ? `Context: ${context}` : ''}

Return ONLY the title (max 50 characters), no quotes or extra text.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 50,
    });

    return completion.choices[0]?.message?.content?.trim() || 'New Event';
  } catch (error) {
    console.error('Groq API error:', error);
    return 'New Event';
  }
}
