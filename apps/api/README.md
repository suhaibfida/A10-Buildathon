# api

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

## Face API setup

Student face registration and face attendance run `face-api.js` locally in the backend.
There is no API key or external billing service.

Download the model files from:

```text
https://github.com/justadudewhohacks/face-api.js-models
```

Put the model manifest and shard files in:

```text
apps/api/models
```

Required model groups:

- `ssd_mobilenetv1`
- `face_landmark_68`
- `face_recognition`

At minimum, this folder must include:

- `ssd_mobilenetv1_model-weights_manifest.json`
- `face_landmark_68_model-weights_manifest.json`
- `face_recognition_model-weights_manifest.json`

Keep each manifest's shard files in the same folder too.

Optional env values:

- `FACE_API_MODEL_DIR`: model directory. Defaults to `./models`.
- `FACE_DETECTION_MIN_CONFIDENCE`: detector threshold. Defaults to `0.5`.
- `EMBEDDING_VECTOR_SIZE`: expected descriptor length. Defaults to `128`.

The backend still accepts a direct `embedding: number[]` in requests for testing. Camera `frames` require the local model files to be present.

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
