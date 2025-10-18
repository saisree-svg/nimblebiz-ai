import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inventoryData, salesData } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an AI assistant helping a shopkeeper manage inventory. Analyze this data and provide restock suggestions:

Inventory Items:
${inventoryData.map((item: any) => 
  `- ${item.name}: Current stock ${item.stock} ${item.unit}, Min stock ${item.minimum_stock}, Price ₹${item.price}`
).join('\n')}

Recent Sales (Last 7 days):
${salesData.map((sale: any) => 
  `- ${sale.name}: Sold ${sale.total_sold} ${sale.unit}`
).join('\n')}

Provide 5-7 actionable restock suggestions with:
1. Item name
2. Current stock vs recommended stock
3. Priority level (High/Medium/Low)
4. Reason for restocking
5. Estimated order quantity

Format your response as a JSON array with this structure:
[
  {
    "item": "Product Name",
    "currentStock": "10 units",
    "recommendedStock": "50 units",
    "priority": "High",
    "reason": "Fast-moving item, selling 20 units daily",
    "orderQuantity": "40 units"
  }
]`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert inventory management AI. Provide practical, data-driven restock suggestions in JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    let suggestions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI suggestions');
    }

    return new Response(
      JSON.stringify({ suggestions }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in ai-restock-suggestions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
