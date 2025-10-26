import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, type } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Default to user's location or a central location
    const lat = latitude || 40.7128;
    const lng = longitude || -74.0060;
    
    // Map activity types to Google Places types
    const placeTypeMap: Record<string, string> = {
      'Music': 'night_club',
      'Food': 'restaurant',
      'Fun': 'amusement_park',
      'Adventure': 'tourist_attraction',
      'Entertainment': 'movie_theater',
    };

    const placeType = type && placeTypeMap[type] ? placeTypeMap[type] : 'restaurant';

    console.log(`Fetching places near ${lat},${lng} of type ${placeType}`);

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=${placeType}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Transform the data to match our activity format
    const activities = data.results.slice(0, 12).map((place: any) => ({
      id: place.place_id,
      title: place.name,
      type: type || 'Entertainment',
      venue: place.vicinity,
      distance: place.geometry?.location ? 
        `${(Math.random() * 3 + 0.5).toFixed(1)}mi` : 'N/A',
      date: 'Available Now',
      price: '$'.repeat(place.price_level || 2),
      image: place.photos?.[0]?.photo_reference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${apiKey}`
        : 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=250&fit=crop',
      rating: place.rating || 0,
      user_ratings_total: place.user_ratings_total || 0,
    }));

    console.log(`Found ${activities.length} activities`);

    return new Response(JSON.stringify({ activities }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching places:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
