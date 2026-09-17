import { ReviewRecord, PersonalPrinciple, AIAnalysisResult } from '../types';

const API_BASE = '/api';

export async function checkServerHealth(): Promise<{ status: string; geminiAvailable: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Server response not ok');
    return await res.json();
  } catch (err) {
    console.warn('Backend server unreachable, operating with local sync cache', err);
    return { status: 'offline', geminiAvailable: false };
  }
}

// Fetch all reviews
export async function fetchReviews(): Promise<ReviewRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/reviews`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      // cache locally for offline support
      localStorage.setItem('principles_reviews_cache', JSON.stringify(json.data));
      return json.data;
    }
  } catch (err) {
    console.warn('Using local cache for reviews', err);
    const cached = localStorage.getItem('principles_reviews_cache');
    if (cached) return JSON.parse(cached);
  }
  return [];
}

// Save or create a review
export async function saveReview(review: Partial<ReviewRecord>): Promise<ReviewRecord> {
  const isUpdate = !!review.id;
  const url = isUpdate ? `${API_BASE}/reviews/${review.id}` : `${API_BASE}/reviews`;
  const method = isUpdate ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
    if (!res.ok) throw new Error('Failed to save review to server');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Failed to save review to server, updating local cache', err);
    const cached = localStorage.getItem('principles_reviews_cache');
    let list: ReviewRecord[] = cached ? JSON.parse(cached) : [];
    let saved: ReviewRecord;
    if (isUpdate) {
      list = list.map((r) => (r.id === review.id ? ({ ...r, ...review, updatedAt: new Date().toISOString() } as ReviewRecord) : r));
      saved = list.find((r) => r.id === review.id)!;
    } else {
      saved = {
        ...(review as ReviewRecord),
        id: `local-rev-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      list.unshift(saved);
    }
    localStorage.setItem('principles_reviews_cache', JSON.stringify(list));
    return saved;
  }
}

// Delete review
export async function deleteReview(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/reviews/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    return true;
  } catch (err) {
    console.warn('Local delete fallback', err);
    const cached = localStorage.getItem('principles_reviews_cache');
    if (cached) {
      const list: ReviewRecord[] = JSON.parse(cached);
      localStorage.setItem('principles_reviews_cache', JSON.stringify(list.filter((r) => r.id !== id)));
    }
    return true;
  }
}

// Fetch principles
export async function fetchPrinciples(): Promise<PersonalPrinciple[]> {
  try {
    const res = await fetch(`${API_BASE}/principles`);
    if (!res.ok) throw new Error('Failed to fetch principles');
    const json = await res.json();
    if (json.data && Array.isArray(json.data)) {
      localStorage.setItem('principles_rules_cache', JSON.stringify(json.data));
      return json.data;
    }
  } catch (err) {
    console.warn('Using local cache for principles', err);
    const cached = localStorage.getItem('principles_rules_cache');
    if (cached) return JSON.parse(cached);
  }
  return [];
}

// Save principle
export async function savePrinciple(principle: Partial<PersonalPrinciple>): Promise<PersonalPrinciple> {
  const isUpdate = !!principle.id;
  const url = isUpdate ? `${API_BASE}/principles/${principle.id}` : `${API_BASE}/principles`;
  const method = isUpdate ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(principle),
    });
    if (!res.ok) throw new Error('Failed to save principle');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.warn('Saving principle locally', err);
    const cached = localStorage.getItem('principles_rules_cache');
    let list: PersonalPrinciple[] = cached ? JSON.parse(cached) : [];
    let saved: PersonalPrinciple;
    if (isUpdate) {
      list = list.map((p) => (p.id === principle.id ? ({ ...p, ...principle } as PersonalPrinciple) : p));
      saved = list.find((p) => p.id === principle.id)!;
    } else {
      saved = {
        ...(principle as PersonalPrinciple),
        id: `local-p-${Date.now()}`,
        code: `${list.length + 1}.0`,
        createdAt: new Date().toISOString(),
        applicationCount: 1,
      };
      list.unshift(saved);
    }
    localStorage.setItem('principles_rules_cache', JSON.stringify(list));
    return saved;
  }
}

// Delete principle
export async function deletePrinciple(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/principles/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete principle failed');
    return true;
  } catch (err) {
    console.warn('Local delete principle fallback', err);
    const cached = localStorage.getItem('principles_rules_cache');
    if (cached) {
      const list: PersonalPrinciple[] = JSON.parse(cached);
      localStorage.setItem('principles_rules_cache', JSON.stringify(list.filter((p) => p.id !== id)));
    }
    return true;
  }
}

// Ask AI to challenge / mentor a step in review
export async function requestStepChallenge(payload: {
  stepNumber: number;
  stepData: any;
  fullReview?: any;
}): Promise<{
  criticalQuestion: string;
  dalioQuote: string;
  suggestion: string;
  deepDiagnosisAdvice?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/ai/step-challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('AI request failed');
    const json = await res.json();
    return json.feedback || json.fallback;
  } catch (err) {
    console.warn('Using local fallback mentor', err);
    return {
      criticalQuestion: '达利欧核心追问：你在此处是否把“直接诱因”当成了“根本原因”？有没有真正触碰机器的运转缺陷？',
      dalioQuote: '“不要把成功的装饰误认为是成功本身；直面惨淡的真相，是进化的起点。” —— 瑞·达利欧',
      suggestion: '继续问自己5个为什么，把自尊心与防御心理剥离出来，找出可量化防错的系统机制。',
      deepDiagnosisAdvice: '警惕自负障碍（Ego Barrier），不要害怕承认自己的失误与无知。',
    };
  }
}

// Request AI comprehensive pattern analysis across all reviews
export async function analyzeLongTermPatterns(): Promise<AIAnalysisResult> {
  const res = await fetch(`${API_BASE}/ai/analyze-patterns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || '分析失败');
  }
  const json = await res.json();
  const data = json.data;
  if (json.keyNotice && data) {
    data.keyNotice = json.keyNotice;
  }
  if (json.source && data) {
    data.source = json.source;
  }
  return data;
}

// Check backend health
export async function checkHealth(): Promise<boolean> {
  const res = await checkServerHealth();
  return res.status === 'ok';
}

// Update task done status in review
export async function updateReviewTaskStatus(reviewId: string, taskId: string, done: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/reviews/${reviewId}/task`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, done }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Fallback local task toggle', err);
    return true;
  }
}

// Fetch latest AI analysis from server cache
export async function getLatestAIAnalysis(): Promise<AIAnalysisResult | null> {
  try {
    const res = await fetch(`${API_BASE}/ai/latest-analysis`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

// Aliases for consistent naming
export const deleteReviewApi = deleteReview;
export const savePrincipleApi = savePrinciple;
export const updatePrincipleApi = (id: string, p: Partial<PersonalPrinciple>) => savePrinciple({ ...p, id });
export const deletePrincipleApi = deletePrinciple;

// Request Future Decision Pre-Mortem Simulation
export async function simulateFutureDecision(payload: {
  decisionTitle: string;
  context: string;
  options: string[];
  timeframe: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/ai/future-decision-simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || '决策推演失败');
  }
  const json = await res.json();
  const sim = json.simulation || {};
  if (json.keyNotice) {
    sim.keyNotice = json.keyNotice;
  }
  if (json.source) {
    sim.source = json.source;
  }
  return sim;
}


