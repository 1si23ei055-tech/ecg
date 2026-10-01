# ECG Wearable Patch - Dashboard Developer Work

## Main Objective

Develop a web-based ECG monitoring dashboard that receives data from our ESP32-C3-based ECG patch through BLE, displays the ECG in real time, shows detected rhythm-change events, stores relevant data, and allows the doctor/user to review previous ECG recordings and events.

The dashboard should visualize and manage the output from the edge-processing algorithm. ECG filtering, R-peak detection, and change-point detection will be handled separately on the ESP32.

---

## 1. Frontend Development

### A. Login Page

Develop a basic login system for the doctor/user.

- Login
- Logout
- Session management
- Protected dashboard pages



B. Main Dashboard

After login, show key patient and device metrics:

Patient ID

Device ID

Device connection status

Battery percentage

Last data received

Number of detected events

Recent rhythm-change events



#### Example View

```text
Patient: P001 | Device: ECG_001 | BLE Status: Connected | ECG Status: Receiving |
Battery: 78%
15:04:21 - Rhythm Change Detected
```

---



## 2. Live ECG Monitoring Page

Create a page where the doctor can see the ECG waveform in real time. The graph must update without requiring a manual page refresh.

### Required Features

- **Real-time ECG graph:** Amplitude vs. Time
- **Playback Controls:** Start/Stop, Pause/Resume
- **Navigation:** Zoom, Scroll, Select time window
- **Information Display:** Sampling rate and device status

---



## 3. Rhythm-Change Event Notification

When the ESP32 detects a change point, the backend should receive an event and immediately update the dashboard.

### Notification Details

- **Warning:** Rhythm Change Event Detected
- **Patient:** P001
- **Device:** ECG_001
- **Time:** 14:32:17
- **Change-Point Score:** 0.82
- **Signal Quality:** GOOD
- **Action:** [View ECG]

> **Important:** The dashboard should refer to this as a "Rhythm Change Event" or similar, specifically avoiding any confirmed medical diagnosis.

---



## 4. Pre-Event and Post-Event ECG

Upon a rhythm-change event, the ESP32 identifies an ECG window around the event for specialized review.

### Visualization Requirements

- Display a continuous segment:
`PRE-EVENT | EVENT | POST-EVENT`
- Clear identification of the Change-Point location.
- Window size: Approximately 10 seconds before and 10 seconds after (to be finalized by the algorithm team).
- Interactive tools: Zoom, scroll, and waveform inspection.

---



## 5. Event History

An Event History page will provide a log of all detected incidents.


| Time     | Event         | Score | Signal Quality | Action |
| -------- | ------------- | ----- | -------------- | ------ |
| 14:32:17 | Rhythm Change | 0.82  | Good           | View   |
| 15:04:21 | Rhythm Change | 0.76  | Good           | View   |


Clicking **View** will open the corresponding high-resolution ECG segment.

---



## 6. Historical ECG Data

The interface must allow doctors to query historical data by:

- Patient, Date, and Time
- Duration
- Specific Events



### Required Capabilities

- Historical ECG graph with zoom and scroll.
- Time navigation and event markers.
- Direct jump-to-event functionality.

---



## 7. Patient/Device Page

A dedicated management page showing the device configuration associated with each patient.


| Field         | Example   |
| ------------- | --------- |
| Patient ID    | P001      |
| Device ID     | ECG_001   |
| BLE           | Connected |
| ECG           | Receiving |
| Battery       | 78%       |
| Sampling Rate | 250 Hz    |
| Last Sync     | 14:35:21  |


---



## 8. Backend / Database

Create a robust database schema to store the following entities:

### Patient Information

- ID
- Display name
- Associated device
- Creation date



### Device Information

- ID
- Patient link
- Battery level
- Connection status
- Last seen
- Firmware version



### ECG Data

- Record ID
- Device ID
- Timestamp
- Sampling rate
- Raw ECG data points



### Rhythm-Change Events

- Event ID
- Device ID
- Timestamp
- Type
- Algorithm score
- Signal quality



### Event ECG Window

- Segmented data including pre-event, change-point, and post-event data

---



## 9. API Development

The backend must provide a structured API for the frontend and gateway.


| Endpoint                      | Method | Purpose                        |
| ----------------------------- | ------ | ------------------------------ |
| `/api/login`                  | POST   | User authentication            |
| `/api/patients`               | GET    | List all patients              |
| `/api/patients/{id}/ecg`      | GET    | Retrieve ECG stream/data       |
| `/api/ecg`                    | POST   | Ingest new ECG data            |
| `/api/events`                 | POST   | Log rhythm-change events       |
| `/api/events/{id}/ecg-window` | GET    | Retrieve specific event window |


---



## 10. Real-Time Communication

The system requires low-latency updates from the patch to the dashboard.

### Flow

```text
ECG Patch -> ESP32-C3 -> BLE -> Gateway/App -> Backend -> Real-Time Update -> Dashboard
```



### Technologies

Utilize WebSockets, Server-Sent Events (SSE), or Real-time database features (e.g., Supabase/Firebase) to ensure the dashboard reflects live data without manual refreshing.

---



## 11. Data Format

Packet structure for communication between ESP32 and the dashboard:

### Fields

Device ID, Sequence Number, Timestamp, Sampling Rate, ECG Data, Event Flag, Change-Point Score, Signal Quality, Battery Level.

### Example String

```text
ECG001, 10234, 1726570937, 250, ECG_DATA, 1, 0.82, GOOD, 78
```

---



## 12. Sequence Number / Data Handling

Each packet must include a sequence number to:

- Detect missing or duplicate packets.
- Maintain correct temporal ordering.
- Assist in communication debugging.

---



## 13. Cloud Storage Strategy

Storage should be optimized to balance detail and efficiency.

- **Normal Data:** Periodic storage of ECG data, timestamps, and device metrics.
- **Event Data:** Full storage of high-resolution Pre-event and Post-event windows, including algorithm scores and signal quality.

---



## 14. NFC Integration (Optional)

Post-prototype feature to allow "tap-to-open" functionality.

An NFC tag on the patch will contain a URL (e.g., `/device/ECG001`) that redirects a mobile user to the corresponding patient dashboard after authentication.

---



## 15. Notifications

Implement dashboard-level alerts for the prototype.

- **Visual Warning:** Immediate UI pop-up for Rhythm Change Events.
- **Future Roadmap:** Email, Push, and SMS notifications.

---



## 16. Security

- Mandatory authentication and session management.
- Protected patient pages.
- HTTPS/TLS deployment.
- Backend validation to prevent unauthorized access via NFC links.

---



## 17. Exclusions (Not in Scope)

The dashboard developer is not responsible for:

- ECG preprocessing or baseline-wander removal.
- R-peak detection or RR interval calculations.
- Implementation of specific algorithms (CUSUM, EWMA, PELT, etc.).
- ESP32 firmware-level optimization.

---



## 18. Priority Order


| Priority   | Level  | Scope                                                                                    |
| ---------- | ------ | ---------------------------------------------------------------------------------------- |
| Priority 1 | High   | Backend/Database setup, Live ECG graph, Event API/Notifications, and Event visualization |
| Priority 2 | Medium | Historical ECG viewer, Device/Battery status, Real-time communication, and Auth          |
| Priority 3 | Low    | NFC integration, Email/Push notifications, and Advanced analytics                        |


---



## 19. Final Deliverables

The developer shall provide:

- Complete Frontend and Backend source code.
- Functional Database and API documentation.
- Live and Historical ECG/Event visualization modules.
- Deployment instructions and test data for demonstration.

---



## Approval Signatures

**Project Lead:** Person

**Date:** Date