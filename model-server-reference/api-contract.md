# VisionTwin Model Server API Contract

The VisionTwin computer vision model server is hosted as a FastAPI service on `http://127.0.0.1:8000`.

## Endpoints

### 1. Health Check
- **Method:** `GET`
- **Path:** `/api/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "models_loaded": true,
    "api": "VisionTwin"
  }
  ```

### 2. Video Analysis Request
- **Method:** `POST`
- **Path:** `/api/analyze`
- **Content-Type:** `multipart/form-data`
- **Form Field:** `video` (File upload: `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm`, max 500MB)
- **Status Code:** `202 Accepted`
- **Response:**
  ```json
  {
    "job_id": "278a53570ee5",
    "status": "queued",
    "status_url": "/api/jobs/278a53570ee5",
    "summary_url": "/api/jobs/278a53570ee5/summary",
    "predictions_url": "/api/jobs/278a53570ee5/predictions"
  }
  ```

### 3. Job Status Check
- **Method:** `GET`
- **Path:** `/api/jobs/{job_id}`
- **Responses:**
  - When Queued / Processing:
    ```json
    {
      "job_id": "278a53570ee5",
      "status": "processing",
      "filename": "278a53570ee5_room.mp4",
      "created_at": "2026-10-15T11:18:15"
    }
    ```
  - When Completed:
    ```json
    {
      "job_id": "278a53570ee5",
      "status": "completed",
      "filename": "278a53570ee5_room.mp4",
      "created_at": "2026-10-15T11:18:15",
      "video": {
        "filename": "room.mp4",
        "duration_seconds": 12.4,
        "source_fps": 30.0,
        "sampled_frames": 12,
        "processed_at": "2026-10-15T11:18:25"
      }
    }
    ```
  - When Failed:
    ```json
    {
      "job_id": "278a53570ee5",
      "status": "failed",
      "filename": "278a53570ee5_room.mp4",
      "created_at": "2026-10-15T11:18:15",
      "error": "Detailed error message"
    }
    ```

### 4. Job Summary
- **Method:** `GET`
- **Path:** `/api/jobs/{job_id}/summary`
- **Responses:**
  - Status 202 if still running:
    ```json
    { "job_id": "...", "status": "processing" }
    ```
  - Status 200 when complete:
    ```json
    {
      "total_unique_appliances_and_devices": 3,
      "appliance_counts_by_class": {
        "ceiling fan": 1,
        "television": 1,
        "laptop": 1
      },
      "total_unique_switches": 2,
      "total_unique_sockets": 2,
      "switch_status": {
        "on": 0,
        "off": 0,
        "unknown": 2
      },
      "appliances_and_devices": [
        {
          "class_name": "ceiling fan",
          "confidence": 0.89,
          "bbox_xyxy": [120.5, 34.2, 380.0, 240.1],
          "timestamp_seconds": 1.0
        }
      ],
      "switches": [
        {
          "class_name": "switch",
          "confidence": 0.78,
          "bbox_xyxy": [45.0, 180.0, 75.0, 210.0],
          "timestamp_seconds": 2.0,
          "category": "switch"
        }
      ],
      "sockets": [
        {
          "class_name": "socket",
          "confidence": 0.82,
          "bbox_xyxy": [50.0, 320.0, 85.0, 360.0],
          "timestamp_seconds": 2.0,
          "category": "socket"
        }
      ],
      "limitations": [
        "Unique-object counts use approximate IoU deduplication, not object tracking.",
        "Switch state is unknown unless the model class explicitly indicates ON or OFF.",
        "Visual detection does not measure actual electricity consumption."
      ]
    }
    ```

### 5. Detailed Predictions
- **Method:** `GET`
- **Path:** `/api/jobs/{job_id}/predictions`
- Returns frame-by-frame detections with timestamps and coordinates.
