export const MOCK_SPORTS_MATCHES = [
  { id: 'm1', homeTeam: 'Arsenal', awayTeam: 'Man City', homeScore: 2, awayScore: 1, status: 'live', minute: 75, league: 'Premier League', startTime: new Date().toISOString() },
  { id: 'm2', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: 0, awayScore: 0, status: 'live', minute: 12, league: 'La Liga', startTime: new Date().toISOString() },
  { id: 'm3', homeTeam: 'Liverpool', awayTeam: 'Chelsea', homeScore: 0, awayScore: 0, status: 'upcoming', league: 'Premier League', startTime: new Date(Date.now() + 3600000).toISOString() },
  { id: 'm4', homeTeam: 'PSG', awayTeam: 'Marseille', homeScore: 3, awayScore: 0, status: 'finished', league: 'Ligue 1', startTime: new Date(Date.now() - 7200000).toISOString() },
  { id: 'm5', homeTeam: 'Yanga SC', awayTeam: 'Azam FC', homeScore: 1, awayScore: 1, status: 'live', minute: 88, league: 'NBC Premier League', startTime: new Date().toISOString() },
  { id: 'm6', homeTeam: 'Simba SC', awayTeam: 'Singida', homeScore: 0, awayScore: 0, status: 'upcoming', league: 'NBC Premier League', startTime: new Date(Date.now() + 7200000).toISOString() },
];

export const MOCK_SPORTS_PREDICTIONS = [
  { 
    id: 'p1', 
    matchTitle: 'Arsenal vs Man City', 
    league: 'Premier League',
    confidence: 'High', 
    pick: 'Arsenal to Win or Draw',
    homeWinProb: 45, drawProb: 30, awayWinProb: 25,
    over25Prob: 65, bttsProb: 70,
    isTopPick: true,
    reasoning: 'Arsenal strong home form and key injuries for City midfield.',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'p2', 
    matchTitle: 'Yanga SC vs Azam FC', 
    league: 'NBC Premier League',
    confidence: 'Lock', 
    pick: 'Over 1.5 Goals',
    homeWinProb: 50, drawProb: 25, awayWinProb: 25,
    over25Prob: 40, bttsProb: 55,
    isTopPick: true,
    reasoning: 'Both teams have scoring streaks in their last 5 head-to-head encounters.',
    createdAt: new Date().toISOString()
  },
  { 
    id: 'p3', 
    matchTitle: 'Liverpool vs Chelsea', 
    league: 'Premier League',
    confidence: 'Medium', 
    pick: 'BTTS - Yes',
    homeWinProb: 40, drawProb: 20, awayWinProb: 40,
    over25Prob: 75, bttsProb: 80,
    isTopPick: false,
    reasoning: 'High attacking output from both sides recently.',
    createdAt: new Date().toISOString()
  }
];

export const MOCK_BETTING_ITEMS = [
  { id: 'b1', title: 'Gal Sport Betting', category: 'Best Betting Websites', description: 'Fastest payouts and high odds for Tanzanian markets.', url: 'https://gsb.co.tz' },
  { id: 'b2', title: 'Betway TZ', category: 'Best Betting Websites', description: 'Comprehensive live betting and great mobile experience.', url: 'https://betway.co.tz' },
  { id: 'b3', title: 'Home Win Accumulator', category: 'Accumulator Picks', description: 'Combine Arsenal and Yanga SC for a 2.45x return.', url: '#' },
];

export const MOCK_SPORTS_GUIDES = [
  { id: 'g1', title: 'How Odds Work', content: 'Decimal odds (e.g. 1.50) represent the total return for every 1 unit staked. 1.50 means 0.50 profit.' },
  { id: 'g2', title: '1X2 Explained', content: '1 = Home Win, X = Draw, 2 = Away Win. Simple match outcome betting.' },
  { id: 'g3', title: 'Bankroll Management', content: 'Never bet more than 5% of your total balance on a single match to ensure long-term sustainability.' },
];
