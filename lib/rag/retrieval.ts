import { createClient } from '@supabase/supabase-js';
import { JurisdictionInfo, getRAGPath } from '../jurisdiction/validator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface RAGChunk {
  id: string;
  source_id: string;
  content: string;
  metadata: any;
  embedding?: number[];
  similarity?: number;
}

export interface RAGSource {
  id: string;
  name: string;
  type: string;
  jurisdiction_country: string;
  jurisdiction_state?: string;
  status: string;
}

export interface RetrievalResult {
  chunks: RAGChunk[];
  sources: RAGSource[];
  citations: string[];
}

export async function retrieveRelevantChunks(
  query: string,
  jurisdiction: JurisdictionInfo,
  topK: number = 5,
  tenantId: string
): Promise<RetrievalResult> {
  try {
    const { data: sources, error: sourcesError } = await supabase
      .from('rag_sources')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('jurisdiction_country', jurisdiction.country)
      .eq('status', 'approved');

    if (sourcesError) throw sourcesError;

    if (!sources || sources.length === 0) {
      return {
        chunks: [],
        sources: [],
        citations: [],
      };
    }

    const sourceIds = sources.map((s: any) => s.id);

    const { data: chunks, error: chunksError } = await supabase
      .from('rag_chunks')
      .select('*')
      .in('source_id', sourceIds)
      .limit(topK);

    if (chunksError) throw chunksError;

    const typedChunks = (chunks || []) as RAGChunk[];
    const citations = sources.map(
      (s: any) => `${s.name} (${s.type}) - ${s.jurisdiction_country}${s.jurisdiction_state ? `, ${s.jurisdiction_state}` : ''}`
    );

    return {
      chunks: typedChunks,
      sources: sources as RAGSource[],
      citations,
    };
  } catch (error) {
    console.error('RAG retrieval error:', error);
    return {
      chunks: [],
      sources: [],
      citations: [],
    };
  }
}

export async function addCitation(
  taskId: string,
  sourceId: string,
  chunkId: string | null,
  citation: string,
  tenantId: string
): Promise<void> {
  await supabase.from('citations').insert({
    task_id: taskId,
    source_id: sourceId,
    chunk_id: chunkId,
    citation_text: citation,
    tenant_id: tenantId,
  });
}

export async function getTaskCitations(taskId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('citations')
    .select(
      `
      *,
      rag_sources (
        name,
        type,
        jurisdiction_country,
        jurisdiction_state
      )
    `
    )
    .eq('task_id', taskId);

  if (error) throw error;
  return data || [];
}

export function buildContextFromChunks(chunks: RAGChunk[]): string {
  if (chunks.length === 0) {
    return 'No relevant legal sources found for this jurisdiction.';
  }

  return chunks
    .map(
      (chunk, idx) =>
        `[Source ${idx + 1}] ${chunk.content}\n`
    )
    .join('\n');
}

export function extractCitationsFromResponse(
  response: string,
  sources: RAGSource[]
): string[] {
  const citations: string[] = [];

  sources.forEach((source) => {
    if (response.toLowerCase().includes(source.name.toLowerCase())) {
      citations.push(
        `${source.name} (${source.type}) - ${source.jurisdiction_country}${source.jurisdiction_state ? `, ${source.jurisdiction_state}` : ''}`
      );
    }
  });

  return citations.length > 0 ? citations : sources.slice(0, 3).map(s =>
    `${s.name} (${s.type}) - ${s.jurisdiction_country}${s.jurisdiction_state ? `, ${s.jurisdiction_state}` : ''}`
  );
}
