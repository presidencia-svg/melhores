import {
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export async function loadLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1,
    });
  })();
  return landmarkerPromise;
}

export type Detection = {
  hasFace: boolean;
  smile: number;
  blink: number;
  yaw: number;
};

export function parseDetection(result: FaceLandmarkerResult): Detection {
  const faces = result.faceLandmarks ?? [];
  if (faces.length === 0 || !faces[0]) {
    return { hasFace: false, smile: 0, blink: 0, yaw: 0 };
  }

  const blends = result.faceBlendshapes?.[0]?.categories ?? [];
  const get = (name: string) =>
    blends.find((b) => b.categoryName === name)?.score ?? 0;

  const smile = Math.max(get("mouthSmileLeft"), get("mouthSmileRight"));
  const blink = Math.max(get("eyeBlinkLeft"), get("eyeBlinkRight"));

  const lm = faces[0];
  const nose = lm[1];
  const leftCheek = lm[234];
  const rightCheek = lm[454];

  let yaw = 0;
  if (nose && leftCheek && rightCheek) {
    const faceWidth = rightCheek.x - leftCheek.x;
    if (faceWidth > 0.01) {
      const noseRel = (nose.x - leftCheek.x) / faceWidth - 0.5;
      yaw = noseRel * 2;
    }
  }

  return { hasFace: true, smile, blink, yaw };
}

export type ChallengeKey = "smile" | "blink" | "turnLeft" | "turnRight";

export const CHALLENGES: Record<
  ChallengeKey,
  { label: string; emoji: string; check: (d: Detection) => boolean }
> = {
  smile: {
    label: "Sorria para a câmera",
    emoji: "😊",
    check: (d) => d.smile > 0.2,
  },
  blink: {
    label: "Pisque os dois olhos",
    emoji: "👀",
    check: (d) => d.blink > 0.35,
  },
  turnLeft: {
    label: "Vire o rosto para a esquerda",
    emoji: "⬅️",
    check: (d) => d.yaw < -0.18,
  },
  turnRight: {
    label: "Vire o rosto para a direita",
    emoji: "➡️",
    check: (d) => d.yaw > 0.18,
  },
};

export function pickChallenges(n: number): ChallengeKey[] {
  const all: ChallengeKey[] = ["smile", "blink", "turnLeft", "turnRight"];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j]!, all[i]!];
  }
  return all.slice(0, n);
}
