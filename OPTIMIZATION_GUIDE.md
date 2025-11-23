# Face-API 128D Model - Optimization Guide

## Current Implementation

### Optimizations Applied ✅

1. **Cosine Similarity Matching**

   - Uses L2 normalization of embeddings
   - More suitable for high-dimensional face spaces
   - Threshold reduced from 0.6 to 0.5

2. **Multi-Sample Averaging**

   - Captures 5 photos with 150ms intervals
   - Averages normalized descriptors
   - Reduces noise and pose variations

3. **Second-Best-Match Verification**

   - Compares best vs second-best match distance
   - Prevents ambiguous matches
   - Best match must be 25% better than second-best

4. **Robust Face Tracking**

   - Increased box matching threshold (30%)
   - Position smoothing (30% interpolation)
   - Persistent tracking up to 10 seconds

5. **Cache System**
   - 30-second cache for last identified person
   - Useful for temporary camera occlusions

## Configuration

Edit `apps/web/lib/config.ts` to adjust:

```typescript
export const FACEAPI_OPTIMIZATION = {
  samples: 5, // Photos to capture
  sample_interval_ms: 150, // Time between captures
  similarity_threshold: 0.5, // Matching threshold
  use_cosine_similarity: true, // Use cosine vs euclidean
  second_best_match_ratio: 0.75, // Best vs second-best ratio
  disappear_timeout_ms: 10000, // Rostro persistence time
  cache_timeout_ms: 30000, // Cache duration
  detection_interval_ms: 150, // Detection frequency
};
```

## Advanced Optimizations (To Implement)

### 1. Quality Filtering

Add face quality validation before matching:

```typescript
function validateFaceQuality(
  landmarks: any[],
  descriptorVariance: number
): boolean {
  // Check landmark confidence
  const avgConfidence =
    landmarks.reduce((sum, l) => sum + l.confidence, 0) / landmarks.length;

  // Reject if low confidence or high variance
  return avgConfidence > 0.7 && descriptorVariance < 0.3;
}
```

**Benefits:**

- Rejects blurry or poorly lit faces
- Improves matching precision
- Reduces false positives

### 2. Weighted Averaging

Instead of simple mean, weight by confidence:

```typescript
function weightedAverageDescriptors(
  descriptors: Float32Array[],
  confidenceScores: number[]
): Float32Array {
  const weights = confidenceScores.map((c) => Math.max(0, c - 0.5));
  const sumWeights = weights.reduce((a, b) => a + b, 0);

  // Normalize weights and compute weighted mean
  return descriptors.map((desc, i) =>
    Array.from(desc).map((v) => v * (weights[i] / sumWeights))
  );
}
```

**Benefits:**

- Better samples get higher influence
- Improves robustness against outliers

### 3. Outlier Detection

Remove outlier embeddings before averaging:

```typescript
function removeOutliers(descriptors: Float32Array[]): Float32Array[] {
  if (descriptors.length < 3) return descriptors;

  const mean = computeMean(descriptors);
  const distances = descriptors.map((d) =>
    calculateCosineSimilarity(Array.from(d), Array.from(mean))
  );

  const stdDev = Math.sqrt(
    distances.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      distances.length
  );

  // Keep only descriptors within 2 standard deviations
  return descriptors.filter(
    (_, i) => Math.abs(distances[i] - mean) <= 2 * stdDev
  );
}
```

**Benefits:**

- Handles blinks, expressions, occlusions
- More stable averaged embedding

### 4. Adaptive Thresholding

Dynamic thresholds based on confidence distribution:

```typescript
function getAdaptiveThreshold(
  candidates: Candidate[],
  targetFalsePositiveRate: number = 0.01
): number {
  if (candidates.length < 2) return 0.5;

  const gaps = [];
  for (let i = 0; i < candidates.length - 1; i++) {
    gaps.push(candidates[i].distance - candidates[i + 1].distance);
  }

  const maxGap = Math.max(...gaps);
  const maxGapIndex = gaps.indexOf(maxGap);

  // Threshold is between best and second-best matches
  return (
    (candidates[maxGapIndex].distance + candidates[maxGapIndex + 1].distance) /
    2
  );
}
```

**Benefits:**

- Automatically finds optimal separation
- Adapts to database characteristics

### 5. Hard Negative Mining

Identify and learn from challenging cases:

```typescript
function identifyHardNegatives(
  candidates: Candidate[],
  threshold: number
): Candidate[] {
  return candidates.filter(
    (c) => c.distance < threshold * 1.5 && c.distance > threshold
  );
}
```

**Benefits:**

- Focuses on boundary cases
- Improves model robustness

### 6. Ensemble Methods

Combine Face-API with other detectors:

```typescript
async function ensembleMatch(
  faceapiDescriptor: number[],
  candidates: Candidate[]
): Promise<EnsembleResult> {
  // Run multiple matchers
  const faceapiResult = await matchFaceAPI(faceapiDescriptor, candidates);
  const deepfaceResult = await matchDeepFace(image, candidates);

  // Combine results with voting
  return combineResults([faceapiResult, deepfaceResult]);
}
```

**Benefits:**

- More robust results
- Reduces method-specific biases

## Performance Tuning

### For Speed:

- Reduce `samples` to 3 (0.3s total vs 0.6s)
- Increase `sample_interval_ms` to 200ms
- Increase `detection_interval_ms` to 200ms

### For Precision:

- Increase `samples` to 7-10
- Decrease `sample_interval_ms` to 100ms
- Decrease `similarity_threshold` to 0.45
- Increase `second_best_match_ratio` to 0.8

### Balanced:

```typescript
const BALANCED = {
  samples: 5,
  sample_interval_ms: 150,
  similarity_threshold: 0.5,
  second_best_match_ratio: 0.75,
};
```

## Testing & Validation

### Metrics to Track:

- True Positive Rate (TPR)
- False Positive Rate (FPR)
- False Negative Rate (FNR)
- Average match time

### Validation Dataset:

```bash
# Create test set with known identities
test_set/
├── person_1/
│   ├── photo_1.jpg (frontal)
│   ├── photo_2.jpg (angled)
│   ├── photo_3.jpg (varied lighting)
│   └── photo_4.jpg (different pose)
├── person_2/
│   └── ...
└── impostor/
    └── ... (photos of people not in database)
```

### Evaluate:

```typescript
async function evaluateModel() {
  let tp = 0,
    fp = 0,
    fn = 0;

  for (const person of testSet) {
    for (const photo of person.photos) {
      const result = await matchFace(photo);

      if (result.match_found === person.expectedMatch) {
        if (result.match_found) tp++;
      } else {
        if (result.match_found) fp++;
        else fn++;
      }
    }
  }

  const precision = tp / (tp + fp);
  const recall = tp / (tp + fn);
  const f1 = (2 * (precision * recall)) / (precision + recall);

  console.log(`Precision: ${precision}, Recall: ${recall}, F1: ${f1}`);
}
```

## Deployment Checklist

- [ ] Test with actual database size (>100 people)
- [ ] Benchmark latency with heavy load
- [ ] Validate with diverse faces (age, gender, ethnicity)
- [ ] Test under different lighting conditions
- [ ] Monitor for false positives in production
- [ ] Set up alerts for anomaly detection
- [ ] Document custom thresholds used
- [ ] Prepare rollback plan

## Monitoring

Add logging to track:

```typescript
interface MatchMetrics {
  timestamp: number;
  num_candidates: number;
  best_distance: number;
  second_best_distance: number;
  ratio: number;
  matched: boolean;
  confidence: string;
  processing_time_ms: number;
}
```

Track metrics over time to detect:

- Performance degradation
- System drift
- New matching patterns

## References

- Face.js paper: [University of Toronto DNN Face Recognition]
- Cosine Similarity for Embeddings: [Google Research]
- Face Verification Metrics: [NIST FRVT]
