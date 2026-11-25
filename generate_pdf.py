import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8.5)
        self.setFillColor(colors.HexColor("#6b7280"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(36, 810, "ROOT SENSE - Complete Tech Stack & Architectural Specification")
            self.setStrokeColor(colors.HexColor("#e5e7eb"))
            self.setLineWidth(0.5)
            self.line(36, 804, 559, 804)

        # Footer
        self.setStrokeColor(colors.HexColor("#e5e7eb"))
        self.setLineWidth(0.5)
        self.line(36, 40, 559, 40)
        self.drawString(36, 28, "Confidential - Root Sense Agritech Platform")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(559, 28, page_str)
        self.restoreState()


def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    # Custom styles
    forest_dark = colors.HexColor("#1b4332")
    forest_mid = colors.HexColor("#2d6a4f")
    forest_light = colors.HexColor("#40916c")
    gold_accent = colors.HexColor("#d4a373")
    gray_bg = colors.HexColor("#f8fafc")
    border_color = colors.HexColor("#e2e8f0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.white,
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#d8f3dc")
    )
    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=forest_dark,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=forest_mid,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1f2937"),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        'DocBullet',
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )
    code_style = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=forest_dark
    )
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155")
    )
    td_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=forest_dark
    )

    story = []

    # 1. Title Banner
    banner_content = [
        [
            Paragraph("ROOT SENSE", title_style),
            Paragraph("<b>v2.0 PRODUCTION</b><br/><font size='7.5'>November 2026</font>", ParagraphStyle(
                'BannerBadge',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=8.5,
                leading=11,
                alignment=2,
                textColor=colors.white
            ))
        ],
        [
            Paragraph("Next-Generation IoT & AI-Driven Smart Agriculture Platform<br/>Comprehensive Technology Stack & Architectural Specification", subtitle_style),
            Paragraph("", subtitle_style)
        ]
    ]
    banner_table = Table(banner_content, colWidths=[400, 123])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), forest_dark),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
        ('TOPPADDING', (0, 1), (-1, 1), 0),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 12))

    # 2. Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    story.append(Paragraph(
        "<b>Root Sense</b> is an integrated agritech software and hardware ecosystem designed to revolutionize modern precision farming. "
        "It continuously collects micro-climate and soil chemical telemetry (moisture, temperature, relative humidity, and NPK metrics) "
        "using ESP32 microcontroller nodes, processes and synchronizes data via an asynchronous Python/FastAPI bridge, "
        "and serves an intelligent, multi-regional farmer client through a Node.js/TypeScript backend powered by Google Gemini 2.0 Flash "
        "and Groq Whisper Large v3 for multilingual voice recognition (STT) and native regional speech output (TTS).",
        body_style
    ))
    story.append(Spacer(1, 4))

    # 3. High Level Architecture Diagram
    story.append(Paragraph("2. System Architecture & Component Topology", h1_style))
    arch_ascii = (
        "+-----------------------------------------------------------------------------------------+\n"
        "| PHYSICAL SENSORS (ESP32)  -->  FASTAPI BRIDGE (:8000)  -->  UNIFIED DB (rootsense.db)   |\n"
        "| Moisture, Temp/RH, NPK         Pydantic, Telemetry API      SQLite3 + Supabase Cloud    |\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "                                             ^\n"
        "                                             | Real-time Synchronization\n"
        "+--------------------------------------------v--------------------------------------------+\n"
        "| EXPRESS APPLICATION BACKEND (:3001)  <--->  AI ENGINES (Gemini 2.0 Flash + Groq Whisper)|\n"
        "| Farm Setup, Seed Calendar, Weather Cache    Multimodal STT, Auto Language, Agronomy LLM |\n"
        "+-----------------------------------------------------------------------------------------+\n"
        "                                             ^\n"
        "                                             | REST Endpoints & Audio Payloads\n"
        "+--------------------------------------------v--------------------------------------------+\n"
        "| EXPO MOBILE APP (:8081)                                                                 |\n"
        "| React Native 0.88 + Expo SDK 58 + Expo Router + expo-audio + expo-speech + SVG Charts   |\n"
        "+-----------------------------------------------------------------------------------------+"
    )
    arch_table = Table([[Paragraph(f"<pre>{arch_ascii}</pre>", code_style)]], colWidths=[523])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 10))

    # 4. Tech Stack Overview Matrix
    story.append(Paragraph("3. Complete Technology Stack Matrix", h1_style))
    matrix_data = [
        [
            Paragraph("Layer / Subsystem", th_style),
            Paragraph("Primary Technologies", th_style),
            Paragraph("Key Packages & Versions", th_style),
            Paragraph("Role in System", th_style)
        ],
        [
            Paragraph("Mobile Frontend", td_bold),
            Paragraph("React Native, React, Expo SDK", td_style),
            Paragraph("react@19.3.0<br/>react-native@0.88.1<br/>expo@~58.0.25", td_style),
            Paragraph("Cross-platform farmer client for Android & iOS with mobile-first UI patterns and Continuous Native Generation (CNG).", td_style)
        ],
        [
            Paragraph("Navigation & Router", td_bold),
            Paragraph("Expo Router", td_style),
            Paragraph("expo-router@~58.0.31", td_style),
            Paragraph("Type-safe, file-based routing architecture with tab bar layout and nested modal routes.", td_style)
        ],
        [
            Paragraph("Audio & Voice STT", td_bold),
            Paragraph("expo-audio, Groq Whisper, Gemini 2.0", td_style),
            Paragraph("expo-audio@^58.0.12<br/>whisper-large-v3-turbo<br/>gemini-2.0-flash", td_style),
            Paragraph("Studio-grade microphone audio capture, dual-engine voice-to-text with auto Indian language detection.", td_style)
        ],
        [
            Paragraph("Speech Output (TTS)", td_bold),
            Paragraph("expo-speech", td_style),
            Paragraph("expo-speech@~58.0.4", td_style),
            Paragraph("Synthesizes spoken answers in farmer's native dialect (Kannada, Hindi, Telugu, Tamil, Marathi, English).", td_style)
        ],
        [
            Paragraph("UI & Data Visualization", td_bold),
            Paragraph("SVG, Linear Gradients, Theme", td_style),
            Paragraph("react-native-svg@15.16.0<br/>expo-linear-gradient@~58.0.4<br/>@expo/vector-icons", td_style),
            Paragraph("Custom cubic bezier spline temperature charts, gauge dials, drone aerial maps, and agritech theme.", td_style)
        ],
        [
            Paragraph("Backend API Server", td_bold),
            Paragraph("Node.js, Express, TypeScript", td_style),
            Paragraph("node@22 LTS<br/>express@^4.21.2<br/>typescript@^5.7.3<br/>tsx@^4.19.2", td_style),
            Paragraph("Core business logic, Gemini AI orchestration, weather forecasting cache, and REST endpoints.", td_style)
        ],
        [
            Paragraph("AI Agronomy Engine", td_bold),
            Paragraph("Google GenAI SDK", td_style),
            Paragraph("@google/genai@^1.0.0<br/>gemini-2.0-flash", td_style),
            Paragraph("Specialized agricultural advisory prompts, crop stage stress analysis, and weather impact reasoning.", td_style)
        ],
        [
            Paragraph("Hardware / Sensor Hub", td_bold),
            Paragraph("Python, FastAPI, Uvicorn", td_style),
            Paragraph("python@3.12+<br/>fastapi@0.163.1<br/>uvicorn@0.54.0<br/>pydantic@2.14.3", td_style),
            Paragraph("Asynchronous ingestion microservice collecting telemetry from physical ESP32 field nodes.", td_style)
        ],
        [
            Paragraph("Database & Persistence", td_bold),
            Paragraph("SQLite3, Supabase, AsyncStorage", td_style),
            Paragraph("sqlite3 (unified)<br/>supabase-py@2.34.1<br/>@react-native-async-storage", td_style),
            Paragraph("Relational database shared between Node.js and Python; Supabase cloud sync; offline device storage.", td_style)
        ],
        [
            Paragraph("Embedded Hardware", td_bold),
            Paragraph("ESP32 Microcontroller", td_style),
            Paragraph("Tensilica Xtensa Dual-Core<br/>2.4GHz Wi-Fi / BLE 4.2", td_style),
            Paragraph("Reads capacitive soil moisture, DHT11/22 climate, and NPK chemical sensors in real-time.", td_style)
        ]
    ]
    t_matrix = Table(matrix_data, colWidths=[90, 110, 130, 193])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    story.append(t_matrix)

    story.append(PageBreak())

    # 5. Deep Dive: Mobile Architecture
    story.append(Paragraph("4. Mobile Application Architecture (Expo SDK 58)", h1_style))
    story.append(Paragraph(
        "The mobile frontend is structured cleanly following Expo Router conventions. Non-route logic resides strictly "
        "outside <code>src/app/</code> in dedicated modular directories:",
        body_style
    ))

    mobile_dirs = [
        "<b>src/app/</b>: File-based routing definitions. Contains <code>_layout.tsx</code>, tab navigators (<code>farm.tsx</code>, <code>soil.tsx</code>, <code>weather.tsx</code>, <code>assistant.tsx</code>), and top-level screens (<code>seed-calendar.tsx</code>, <code>setup.tsx</code>, <code>sensor-data.tsx</code>, <code>irrigation-advice.tsx</code>, <code>time-to-stress.tsx</code>).",
        "<b>src/context/FarmContext.tsx</b>: Centralized React state holding user farm profile, active crop, soil type, connected hardware status, telemetry, chat messages, and voice helpers.",
        "<b>src/services/api.ts</b>: Typed REST client with automatic failover between active LAN IP (<code>10.70.248.80</code>) and localhost, handling network error resilience.",
        "<b>src/components/</b>: Modular visual components including <code>AudioWaveform</code>, <code>ESP32DeviceGraphic</code>, <code>WeatherSplineChart</code>, and <code>WheatStalkGraphic</code>.",
        "<b>src/constants/theme.ts</b>: Unified design tokens (Colors, Typography, Spacing, Shadows, BorderRadius) maintaining consistent agritech styling across all 16 screens."
    ]
    for d in mobile_dirs:
        story.append(Paragraph(f"• {d}", bullet_style))
    story.append(Spacer(1, 8))

    # 6. Deep Dive: Voice & AI Architecture
    story.append(Paragraph("5. AI, Speech Recognition (STT) & Speech Synthesis (TTS)", h1_style))
    story.append(Paragraph(
        "A standout innovation in Root Sense is its frictionless, multilingual voice interaction system designed specifically for rural and diverse agricultural communities:",
        body_style
    ))

    voice_table_data = [
        [
            Paragraph("Voice Pipeline Step", th_style),
            Paragraph("Mechanism / Component", th_style),
            Paragraph("Technical Specifications", th_style)
        ],
        [
            Paragraph("1. Audio Capture", td_bold),
            Paragraph("expo-audio v58.0.12", td_style),
            Paragraph("High quality (44.1 kHz, 128 kbps), low latency, native Android/iOS audio session management.", td_style)
        ],
        [
            Paragraph("2. Base64 Serialization", td_bold),
            Paragraph("HTML5 FileReader / Blob Bridge", td_style),
            Paragraph("Converts native recorded file URI into base64 payload without filesystem overhead.", td_style)
        ],
        [
            Paragraph("3. Dual-Engine STT", td_bold),
            Paragraph("Groq Whisper + Gemini 2.0 Audio", td_style),
            Paragraph("Primary: Groq <code>whisper-large-v3-turbo</code> (sub-second latency). Secondary: Gemini 2.0 Multimodal Audio.", td_style)
        ],
        [
            Paragraph("4. Language Detection", td_bold),
            Paragraph("Unicode Script & Agronomic Heuristics", td_style),
            Paragraph("Detects Kannada (U+0C80–U+0CFF), Hindi/Devanagari (U+0900–U+097F), Telugu, Tamil, Malayalam, and Marathi.", td_style)
        ],
        [
            Paragraph("5. Agronomic Reasoning", td_bold),
            Paragraph("Google Gemini 2.0 Flash", td_style),
            Paragraph("Prompt augmented with real farm telemetry (e.g. Ragi at Seedling stage, Red Loam, 28°C, 62% humidity).", td_style)
        ],
        [
            Paragraph("6. Native Speech Output", td_bold),
            Paragraph("expo-speech v58.0.4", td_style),
            Paragraph("Synthesizes response in matching BCP-47 locale (e.g. <code>kn-IN</code> for Kannada, <code>hi-IN</code> for Hindi).", td_style)
        ]
    ]
    t_voice = Table(voice_table_data, colWidths=[120, 150, 253])
    t_voice.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    story.append(t_voice)
    story.append(Spacer(1, 8))

    # 7. Hardware & Sensor Specs
    story.append(Paragraph("6. IoT Hardware & Embedded Sensor Specifications", h1_style))
    sensor_specs = [
        [
            Paragraph("Sensor / Hardware", th_style),
            Paragraph("Operational Principle", th_style),
            Paragraph("Interface / Pins", th_style),
            Paragraph("Measurement Range & Accuracy", th_style)
        ],
        [
            Paragraph("ESP32 Dev Module", td_bold),
            Paragraph("32-bit Xtensa Dual-Core Microcontroller", td_style),
            Paragraph("Wi-Fi 802.11 b/g/n, Bluetooth v4.2 BR/EDR", td_style),
            Paragraph("240 MHz clock, 520 KB SRAM, ultra-low power coprocessor.", td_style)
        ],
        [
            Paragraph("Capacitive Soil Moisture", td_bold),
            Paragraph("Capacitance-based dielectric permittivity", td_style),
            Paragraph("Analog Output (GPIO 34 / ADC1)", td_style),
            Paragraph("0% (dry air) to 100% (saturated water); corrosion-proof.", td_style)
        ],
        [
            Paragraph("DHT11 / DHT22", td_bold),
            Paragraph("Polymer capacitor & NTC thermistor", td_style),
            Paragraph("Single-Bus Digital (GPIO 4)", td_style),
            Paragraph("Temp: -40 to 80°C (±0.5°C); Humidity: 0–100% RH (±2% RH).", td_style)
        ],
        [
            Paragraph("NPK Soil Nutrient Probe", td_bold),
            Paragraph("Spectrophotometry / Ion-selective electrode", td_style),
            Paragraph("RS-485 Modbus RTU / Analog", td_style),
            Paragraph("Nitrogen, Phosphorus, Potassium (0–1999 mg/kg, ±2%).", td_style)
        ],
        [
            Paragraph("Water Level Sensor", td_bold),
            Paragraph("Parallel conductor resistance traces", td_style),
            Paragraph("Analog Output (GPIO 35)", td_style),
            Paragraph("0–40mm liquid immersion height.", td_style)
        ]
    ]
    t_sensors = Table(sensor_specs, colWidths=[110, 140, 130, 143])
    t_sensors.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    story.append(t_sensors)

    story.append(PageBreak())

    # 8. Network Topology & Ports
    story.append(Paragraph("7. Network Topology, Endpoints & Port Allocation", h1_style))
    net_data = [
        [
            Paragraph("Service", th_style),
            Paragraph("Port", th_style),
            Paragraph("Protocol", th_style),
            Paragraph("Primary Endpoints", th_style),
            Paragraph("Functionality", th_style)
        ],
        [
            Paragraph("Express Backend", td_bold),
            Paragraph("3001", td_style),
            Paragraph("HTTP / JSON", td_style),
            Paragraph("<code>/api/farm</code><br/><code>/api/assistant/chat</code><br/><code>/api/assistant/transcribe</code><br/><code>/api/weather</code>", td_style),
            Paragraph("Main application API serving the mobile app and executing AI/weather queries.", td_style)
        ],
        [
            Paragraph("FastAPI Bridge", td_bold),
            Paragraph("8000", td_style),
            Paragraph("HTTP / WS", td_style),
            Paragraph("<code>/api/sensors/readings</code><br/><code>/api/sensors/latest</code><br/><code>/ws/telemetry</code>", td_style),
            Paragraph("Asynchronous ingestion service receiving ESP32 sensor frames over Wi-Fi.", td_style)
        ],
        [
            Paragraph("Metro Bundler", td_bold),
            Paragraph("8081", td_style),
            Paragraph("HTTP / WS", td_style),
            Paragraph("<code>/</code> (Metro dev server)<br/>Fast Refresh / HMR", td_style),
            Paragraph("Compiles and serves React Native bundles to Expo Go and mobile devices.", td_style)
        ],
        [
            Paragraph("SQLite Shared DB", td_bold),
            Paragraph("N/A", td_style),
            Paragraph("IPC / File", td_style),
            Paragraph("<code>backend/data/rootsense.db</code>", td_style),
            Paragraph("Zero-latency embedded relational storage shared across Node.js & Python.", td_style)
        ]
    ]
    t_net = Table(net_data, colWidths=[95, 40, 65, 155, 168])
    t_net.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#fafafa")]),
    ]))
    story.append(t_net)
    story.append(Spacer(1, 10))

    # 9. Key Technical Advantages
    story.append(Paragraph("8. Architectural Strengths & Engineering Decisions", h1_style))
    points = [
        "<b>Continuous Native Generation (CNG)</b>: Zero manual editing of <code>android/</code> or <code>ios/</code> directories ensures clean version upgrades with <code>npx expo install --fix</code>.",
        "<b>Dual-Engine Voice Fallback</b>: If Groq Whisper experiences rate limits or network issues, the system smoothly switches to Gemini 2.0 Multimodal Audio with zero user disruption.",
        "<b>Zero-Lockout Unified Database</b>: Python and Node.js concurrently access SQLite using standard WAL (Write-Ahead Logging) and thread-safe connections without database locks.",
        "<b>Offline Resilient Client</b>: The mobile app uses <code>@react-native-async-storage</code> to store calibrated farm parameters, crop history, and recent weather caches, allowing operation in low-connectivity rural fields.",
        "<b>Type Safety End-to-End</b>: Strict TypeScript compiler options on both client and backend eliminate runtime type errors and enforce standardized API schemas."
    ]
    for p in points:
        story.append(Paragraph(f"✓ {p}", bullet_style))
    story.append(Spacer(1, 14))

    # 10. Document Sign-off Box
    signoff_data = [
        [
            Paragraph("<b>Document Version:</b> 2.0.0", td_style),
            Paragraph("<b>Target SDK:</b> Expo SDK 58", td_style),
            Paragraph("<b>Classification:</b> Production Ready", td_style)
        ],
        [
            Paragraph("<b>Project:</b> Root Sense Agritech", td_style),
            Paragraph("<b>Date of Issue:</b> November 25, 2026", td_style),
            Paragraph("<b>Status:</b> Verified & Tested", td_style)
        ]
    ]
    t_signoff = Table(signoff_data, colWidths=[174, 174, 175])
    t_signoff.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#94a3b8")),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_signoff)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated PDF: {filename}")

if __name__ == "__main__":
    out_path = os.path.join(os.getcwd(), "RootSense_Tech_Stack_Specification.pdf")
    build_pdf(out_path)
