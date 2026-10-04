import { CourseCluster } from '@/types';

/**
 * Parses a Markdown table pasted from NotebookLM into structured CourseClusters.
 * Standard expected Markdown columns:
 * | Cluster Number | Cluster Title | Primary EISA Focus Area | Mapped IAC / AAC Assessment Criteria | Weighting & Assessment Focus |
 */
export function parseMasterMappingToClusters(courseId: string, markdownText: string): CourseCluster[] {
  if (!markdownText || !markdownText.trim()) return [];

  const lines = markdownText.split('\n');
  const clusters: CourseCluster[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    // Must be a table row containing pipes
    if (!line.startsWith('|') || !line.endsWith('|')) continue;

    // Split columns by '|'
    const cols = line
      .split('|')
      .slice(1, -1)
      .map(c => c.trim());

    // Needs at least 3 columns to be meaningful
    if (cols.length < 3) continue;

    const col0 = cols[0].replace(/\*\*/g, '').replace(/`/g, '').trim();
    // Skip header or divider rows
    if (
      col0.toLowerCase().includes('cluster number') || 
      col0.includes('---') || 
      col0.toLowerCase() === 'cluster'
    ) {
      continue;
    }

    // Extract cluster number: e.g. "Cluster 1.1" -> "1.1", "1.2" -> "1.2", "Cluster 2" -> "2"
    const numMatch = col0.match(/(\d+(\.\d+)?)/);
    if (!numMatch) continue;
    const clusterNumber = numMatch[1];

    // Col 1: Cluster Title
    const rawTitle = cols[1] ? cols[1].replace(/\*\*/g, '').replace(/`/g, '').trim() : '';
    // Strip leading "Cluster X.Y:" or similar if duplicated
    const cleanTitle = rawTitle.replace(/^Cluster\s*\d+(\.\d+)?[:\s-]*/i, '').trim();

    // Col 2: Primary EISA Focus Area
    const rawEisa = cols[2] ? cols[2].replace(/\*\*/g, '').replace(/`/g, '').trim() : '';
    
    // Col 3: Mapped IAC / AAC Assessment Criteria
    const rawIacs = cols[3] 
      ? cols[3]
          .replace(/<br\s*\/?>/gi, ', ')
          .replace(/•/g, '')
          .replace(/`/g, '')
          .replace(/\s+/g, ' ')
          .trim() 
      : '';

    // Col 4: Weighting & Assessment Focus
    const rawWeighting = cols[4] 
      ? cols[4]
          .replace(/<br\s*\/?>/gi, ' — ')
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      : '';

    // Calculate weighting percentage
    let weighting = 25; // default medium
    const combinedText = `${rawEisa} ${rawWeighting}`.toLowerCase();

    if (combinedText.includes('50%') || rawEisa.toLowerCase().includes('50%')) {
      weighting = 50;
    } else if (combinedText.includes('foundational') || combinedText.includes('enabling')) {
      weighting = 15;
    } else if (combinedText.includes('housekeeping') || combinedText.includes('safety')) {
      weighting = 10;
    } else {
      const matchPct = combinedText.match(/(\d+)%/);
      if (matchPct) {
        const parsed = parseInt(matchPct[1], 10);
        // If it's a module level (e.g. 100% of KM-01 which is 4 credits), don't treat as 100% of overall course
        if (parsed === 100 && (combinedText.includes('km-') || combinedText.includes('pm-'))) {
          weighting = 15;
        } else if (parsed >= 45) {
          weighting = 50;
        } else {
          weighting = parsed;
        }
      }
    }

    // Recommended question count for collaborative group quizzes (8 minimum to 15 maximum):
    // >= 45% (High-stakes EISA core focus, e.g. 50% Receiving or Dispatch): 15 questions (~36-45 mins)
    // 20% - 44% (Core operational cluster, e.g. Recording or Packaging): 10 to 12 questions (~28-34 mins)
    // < 20% (Foundational / Housekeeping enabling): 8 questions minimum (~20-25 mins)
    let recommendedCount = 10;
    if (weighting >= 45) {
      recommendedCount = 15;
    } else if (weighting >= 30) {
      recommendedCount = 12;
    } else if (weighting >= 20) {
      recommendedCount = 10;
    } else {
      recommendedCount = 8;
    }

    // Build description from weighting / focus if available
    const description = rawWeighting 
      ? rawWeighting.replace(/^[^—]+—\s*/, '') 
      : `${rawEisa}${rawIacs ? ` • ${rawIacs}` : ''}`.trim();

    clusters.push({
      id: `cluster-${clusterNumber.replace('.', '-')}-${Math.random().toString(36).substring(2, 7)}`,
      course_id: courseId,
      cluster_number: clusterNumber,
      title: cleanTitle || `Cluster ${clusterNumber}`,
      description: description || `Operational outcomes and assessment criteria for Cluster ${clusterNumber}`,
      eisa_focus_area: rawEisa || undefined,
      mapped_iacs: rawIacs || undefined,
      weighting_percentage: weighting,
      recommended_question_count: recommendedCount,
      created_at: new Date().toISOString(),
    });
  }

  // Sort clusters numerically (1.1, 1.2, 1.3, 2.1...)
  clusters.sort((a, b) => a.cluster_number.localeCompare(b.cluster_number, undefined, { numeric: true }));

  return clusters;
}
