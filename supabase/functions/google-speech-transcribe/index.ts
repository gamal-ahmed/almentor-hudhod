
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    const prompt = formData.get('prompt') as string || ''

    if (!audioFile) {
      throw new Error('No audio file provided')
    }

    console.log(`Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`)

    // Convert file to base64
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Configure Google Speech-to-Text API request
    const apiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY')
    
    if (!apiKey) {
      throw new Error('Google Cloud API key not configured')
    }

    // Make API request to Google Speech-to-Text
    const response = await fetch(`https://speech.googleapis.com/v1p1beta1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'MP3',
          sampleRateHertz: 44100,
          languageCode: 'ar-SA',
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          model: 'default',
          useEnhanced: true,
        },
        audio: {
          content: base64Audio
        }
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Google Speech API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    
    // Process the transcription results
    if (!data.results || data.results.length === 0) {
      throw new Error('No transcription results returned')
    }

    // Generate VTT content from Google's response
    let vttContent = 'WEBVTT\n\n'
    let currentStartTime = 0
    
    data.results.forEach((result: any) => {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0]
        const transcript = alternative.transcript || ''
        
        // If we have word timings, use them
        if (alternative.words && alternative.words.length > 0) {
          let segmentText = ''
          let startTime = parseFloat(alternative.words[0].startTime.replace('s', ''))
          let endTime = 0
          
          alternative.words.forEach((word: any, index: number) => {
            const wordEndTime = parseFloat(word.endTime.replace('s', ''))
            segmentText += word.word + ' '
            
            // Create a new segment every few words or on punctuation
            if ((index + 1) % 10 === 0 || 
                word.word.endsWith('.') || 
                word.word.endsWith('?') || 
                word.word.endsWith('!')) {
              endTime = wordEndTime
              
              vttContent += `${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}\n`
              vttContent += segmentText.trim() + '\n\n'
              
              // Reset for next segment
              segmentText = ''
              startTime = endTime
            }
          })
          
          // Add any remaining text
          if (segmentText.trim().length > 0) {
            endTime = parseFloat(alternative.words[alternative.words.length - 1].endTime.replace('s', ''))
            vttContent += `${formatVTTTime(startTime)} --> ${formatVTTTime(endTime)}\n`
            vttContent += segmentText.trim() + '\n\n'
          }
        } else {
          // If no word timing, create a simple segment
          const segmentDuration = 5 // seconds per segment without timing
          const endTime = currentStartTime + segmentDuration
          
          vttContent += `${formatVTTTime(currentStartTime)} --> ${formatVTTTime(endTime)}\n`
          vttContent += transcript.trim() + '\n\n'
          
          currentStartTime = endTime
        }
      }
    })

    return new Response(
      JSON.stringify({ 
        vttContent,
        model: 'google-speech-to-text'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error processing audio:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Helper function to format time for VTT
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}
