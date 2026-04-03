import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrustedContact {
    name: string
    phone_number: string
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_id, lat, lng, request_id, contacts = [] } = await req.json() as {
            user_id: string
            lat: number
            lng: number
            request_id?: string
            contacts: TrustedContact[]
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // 1. Get user info
        const { data: user } = await supabase
            .from('users')
            .select('name, phone')
            .eq('id', user_id)
            .single()

        // 2. Mark panic in active_sessions if in a request
        if (request_id) {
            await supabase
                .from('active_sessions')
                .update({ panic_triggered: true })
                .eq('request_id', request_id)
        }

        // 3. Insert initial panic session point
        await supabase.from('panic_sessions').insert({
            user_id,
            request_id: request_id ?? null,
            lat,
            lng,
        })

        // 4. Build Google Maps link
        const mapsLink = `https://maps.google.com/?q=${lat},${lng}`
        const userName = user?.name || 'Someone'
        const smsBody = `🆘 PANIC ALERT: ${userName} needs urgent help!\n📍 Location: ${mapsLink}\n\nThis is an automated alert from HelpNear.`

        console.log(`🆘 PANIC from ${userName} at ${lat},${lng}`)
        console.log(`Contacts to notify: ${contacts.length}`)

        // 5. Send SMS to each trusted contact via Twilio
        const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
        const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
        const TWILIO_FROM = Deno.env.get('TWILIO_FROM_NUMBER')

        if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM && contacts.length > 0) {
            const smsPromises = contacts.map((contact) =>
                fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        From: TWILIO_FROM,
                        To: contact.phone_number,
                        Body: smsBody,
                    }),
                })
                    .then((r) => r.json())
                    .catch((e) => console.error(`SMS to ${contact.phone_number} failed:`, e))
            )
            await Promise.allSettled(smsPromises)
            console.log(`SMS sent to ${contacts.length} contacts`)
        } else {
            console.log('Twilio not configured — SMS skipped. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER.')
        }

        // 6. Log analytics event
        await supabase.from('analytics_events').insert({
            event_type: 'panic_triggered',
            user_id,
            payload: { lat, lng, contacts_notified: contacts.length, request_id },
        })

        return new Response(
            JSON.stringify({ success: true, contacts_notified: contacts.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Panic alert error:', error)
        return new Response(
            JSON.stringify({ error: 'Failed to send panic alert' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
