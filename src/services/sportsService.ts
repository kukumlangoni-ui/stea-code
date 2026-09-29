import axios from 'axios';
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Load Firebase Config once
const CONFIG_PATH = path.resolve('firebase-applet-config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// Initialize Firebase Admin with explicit Project ID from config
let app;
if (!admin.apps.length) {
  console.log(`[SportsSync] Initializing Firebase Admin for Project: ${config.projectId}`);
  app = admin.initializeApp({
    projectId: config.projectId
  });
} else {
  app = admin.app();
}

// Target the specific database instance
const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
  ? config.firestoreDatabaseId 
  : undefined;

console.log(`[SportsSync] Connecting to Firestore Database: ${dbId || "(default)"}`);
const db = getFirestore(app, dbId);

// Sports API Configuration (API-Football)
const SPORTS_API_BASE = 'https://v3.football.api-sports.io';
const getHeaders = () => ({
  'x-rapidapi-key': process.env.SPORTS_API_KEY || '',
  'x-apisports-key': process.env.SPORTS_API_KEY || ''
});

// ... (Existing sports API code)

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export class SportsService {
  /**
   * Syncs matches from API to Firestore
   * @param status 'live', 'upcoming', or 'finished'
   */
  async syncMatches(status: 'live' | 'upcoming' | 'finished') {
    try {
      let endpoint = '';
      let params: any = {};

      if (status === 'live') {
        endpoint = '/fixtures';
        params = { live: 'all' };
      } else if (status === 'upcoming') {
        endpoint = '/fixtures';
        // Get fixtures for today instead of using 'next' (Free plan restriction)
        const today = new Date().toISOString().split('T')[0];
        params = { date: today }; 
      } else if (status === 'finished') {
        endpoint = '/fixtures';
        // Get last 20 fixtures for yesterday
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        params = { date: yesterday };
      }

      console.log(`[SportsSync] Fetching ${status} matches from ${SPORTS_API_BASE}${endpoint} with params:`, params);
      const apiKey = process.env.SPORTS_API_KEY;
      if (!apiKey) {
        console.warn(`[SportsSync] WARNING: SPORTS_API_KEY is missing!`);
      } else {
        console.log(`[SportsSync] Using API Key: ${apiKey.substring(0, 5)}...`);
      }

      const response = await axios.get(`${SPORTS_API_BASE}${endpoint}`, {
        headers: getHeaders(),
        params
      });

      console.log(`[SportsSync] API Response Status: ${response.status}`);
      if (response.data && response.data.errors && Object.keys(response.data.errors).length > 0) {
        const errorDetails = JSON.stringify(response.data.errors);
        console.error(`[SportsSync] API Errors (JSON):`, errorDetails);
        
        // Handle specific rate limit errors gracefully instead of throwing
        if (response.data.errors.requests?.includes('request limit')) {
           console.warn(`[SportsSync] Daily request limit reached for API-Football. Halting sync gracefully.`);
           return;
        }

        // If there are errors but no response data, we should stop here
        if (!response.data.response || response.data.response.length === 0) {
          throw new Error(`Sports API returned errors: ${errorDetails}`);
        }
      }

      if (!response.data || !response.data.response) {
        console.error(`[SportsSync] Null or undefined response body:`, response.data);
        throw new Error('Invalid response structure from Sports API');
      }

      const matches = response.data.response;
      if (matches.length === 0) {
        console.log(`[SportsSync] No ${status} matches found in API.`);
        return;
      }

      console.log(`[SportsSync] Found ${matches.length} matches. Syncing to DB...`);

      const batch = db.batch();
      const matchesCollection = db.collection('sports_matches');

      for (const m of matches) {
        const matchData = this.normalizeMatch(m);
        const matchRef = matchesCollection.doc(String(matchData.provider_match_id));
        batch.set(matchRef, matchData, { merge: true });
      }

      await batch.commit();
      console.log(`[SportsSync] Successfully synced ${status} matches.`);

      // If upcoming, generate insights for top matches
      if (status === 'upcoming') {
        await this.generateBatchInsights(matches.slice(0, 5));
      }
    } catch (error: any) {
      console.error(`[SportsSync] Error syncing ${status} matches:`, error.message);
      
      // Log sync failure to Firestore for admin visibility
      try {
        await db.collection('site_logs').add({
          type: 'sports_sync_error',
          status,
          message: error.message,
          timestamp: FieldValue.serverTimestamp()
        });
      } catch (logErr) {
        // Ignore logging errors
      }

      if (error.message.includes('PERMISSION_DENIED')) {
        console.error(`[SportsSync] CRITICAL: Permission Denied. Check Firestore Rules and Service Account roles for DB: ${config.firestoreDatabaseId}`);
      }
    }
  }

  private normalizeMatch(m: any) {
    const fixture = m.fixture;
    const league = m.league;
    const teams = m.teams;
    const goals = m.goals;
    const status = fixture.status.short;

    let mappedStatus: 'live' | 'upcoming' | 'finished' = 'upcoming';
    if (['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT'].includes(status)) {
      mappedStatus = 'live';
    } else if (['FT', 'AET', 'PEN'].includes(status)) {
      mappedStatus = 'finished';
    }

    return {
      provider_match_id: fixture.id,
      league_name: league.name,
      league_logo: league.logo,
      season: league.season,
      home_team: teams.home.name,
      home_logo: teams.home.logo,
      away_team: teams.away.name,
      away_logo: teams.away.logo,
      kickoff_time: fixture.date,
      status: mappedStatus,
      home_score: goals.home ?? 0,
      away_score: goals.away ?? 0,
      minute: fixture.status.elapsed ?? null,
      stats: m.statistics || {},
      updatedAt: FieldValue.serverTimestamp()
    };
  }

  async generateBatchInsights(matches: any[]) {
    for (const m of matches) {
      await this.generateMatchInsight(m);
    }
  }

  async generateMatchInsight(m: any) {
    try {
      const matchId = String(m.fixture.id);
      const predictionRef = db.collection('sports_predictions').doc(matchId);
      
      const existing = await predictionRef.get();
      if (existing.exists) return;

      const ai = getAI();
      if (!ai) {
        console.warn("[SportsSync] AI not configured for insights.");
        return;
      }

      const prompt = `
        As a pro football analyst for STEA (Swahilitech Elite Academy), analyze this match and provide betting insights.
        Match: ${m.teams.home.name} vs ${m.teams.away.name}
        League: ${m.league.name}
        
        Provide the response in JSON format:
        {
          "home_win_probability": number,
          "draw_probability": number,
          "away_win_probability": number,
          "over25_probability": number,
          "btts_probability": number,
          "stea_pick": "string",
          "confidence_level": "Low" | "Medium" | "High" | "Lock",
          "reasoning": "string"
        }
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are a pro football analyst for STEA."
        }
      });
      
      const responseText = result.text;
      const cleanedJson = responseText.replace(/```json|```/g, '').trim();
      const insights = JSON.parse(cleanedJson);

      await predictionRef.set({
        matchId,
        matchTitle: `${m.teams.home.name} vs ${m.teams.away.name}`,
        league: m.league.name,
        ...insights,
        isTopPick: ["High", "Lock"].includes(insights.confidence_level),
        createdAt: FieldValue.serverTimestamp()
      });
    } catch (error: any) {
      console.error(`[SportsSync] Error generating insight:`, error.message);
      
      // Check for rate limits
      if (error?.status === 429 || (error?.message && error.message.includes("429"))) {
        console.warn("[SportsSync] AI limit reached. Please try again later.");
      }
    }
  }
}
