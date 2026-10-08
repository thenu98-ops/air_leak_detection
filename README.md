# AirTrace - IoT Air Leak Detection System

AirTrace is an Industrial IoT solution designed to monitor air pressure, detect leaks, and calculate financial and energy losses in compressed air systems in real-time. 

This repository is structured as a monorepo containing the hardware code, backend server, and the frontend web dashboard.

##  Project Structure

- **`backend/`**: Node.js server that connects to an MQTT broker to receive live telemetry from the ESP32. It analyzes the data using a custom leak detection engine, stores the history in MongoDB Atlas, and streams real-time updates to the dashboard via Socket.IO.
- **`dashboard/`**: React web application (built with Vite and TailwindCSS) that visualizes live sensor data, historical trends, and instant leak alerts.
- **`arduino/`**: C/C++ code for the ESP32 microcontroller. It interfaces with pressure, flow, and temperature sensors and publishes data to the MQTT broker.
- **`sources/`**: Additional project resources, diagrams, and documentation.

##  Key Features

- **Real-Time Monitoring:** Live telemetry streaming using WebSockets (Socket.IO).
- **Leak Detection Engine:** Continuously analyzes pressure drops over time using linear regression to identify and classify leaks.
- **Financial Impact Tracking:** Calculates energy loss (kWh) and financial loss (LKR) dynamically.
- **Temperature Compensation:** Adjusts raw absolute pressure readings based on ambient temperature using Charles's Law.
- **Historical Data:** Stores and retrieves sensor readings using MongoDB for long-term trend analysis.

## 🚀 Client Setup Guide (Running Locally)

To run this project on your local machine, you need to have **[Node.js](https://nodejs.org/en/download/)** installed.

### 1. Requirements Before You Start
- Make sure your computer is connected to the internet.
- Ensure your current IP address is whitelisted in the MongoDB Atlas dashboard. (If you change Wi-Fi networks, you must update the IP whitelist in MongoDB Atlas).

### 2. Start the Backend
Open a terminal and run the following commands:
```bash
cd backend
npm install
npm start
```
The backend will connect to your MQTT broker, hook up to MongoDB, and start the API server on `http://localhost:3000`.

### 3. Start the Backend Server
The backend handles the database connection, the MQTT broker connection, and the real-time calculations.

1. Open a terminal (Command Prompt or PowerShell).
2. Navigate to the backend folder:
   ```bash
   cd "path\to\air_leak_detection\backend"
   ```
3. Install the dependencies (you only need to do this the very first time):
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
*You should see "Dashboard API on :3000", "MQTT connected", and "MongoDB connected" in the terminal. Keep this terminal open.*

### 4. Start the Frontend Dashboard
The dashboard is the visual interface.

1. Open a **new, separate** terminal window.
2. Navigate to the dashboard folder:
   ```bash
   cd "path\to\air_leak_detection\dashboard"
   ```
3. Install the dependencies (first time only):
   ```bash
   npm install
   ```
4. Start the website:
   ```bash
   npm run dev
   ```
5. The terminal will give you a local web link (usually `http://localhost:5173`). Ctrl+Click that link or type it into your web browser to view the dashboard!

### 5. Hardware (ESP32) Setup
- Navigate to the `iot_pressure_tank/` directory for the firmware source code.
- Ensure the ESP32 is powered on and connected to a Wi-Fi network that has internet access.
- The ESP32 will automatically begin publishing telemetry data, which your local backend will instantly pick up and display on your frontend dashboard.

### ⚠️ Troubleshooting Common Errors
* **`querySrv ENOTFOUND` or MongoDB Timeout:** Your Wi-Fi is blocking the database, or your IP address changed. Try switching to a home Wi-Fi network, or add your new IP address to the MongoDB Atlas Network Access whitelist.
* **MQTT `ENOTFOUND`:** Your computer is not connected to the internet, or the MQTT broker hostname is unreachable.
* **No data on Dashboard:** Ensure both the backend terminal and frontend terminal are running simultaneously, and that the ESP32 is turned on.
