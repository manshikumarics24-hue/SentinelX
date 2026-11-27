import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
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
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        # Header
        self.drawString(54, 750, "SENTINELX SOC INTELLIGENCE — COMPREHENSIVE ARCHITECTURE & UPGRADE REPORT")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 744, 558, 744)
        # Footer
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 36, page_text)
        self.drawString(54, 36, "CONFIDENTIAL — FOR INTERNAL SOC & SYSTEM ARCHITECTURE EVALUATION")
        self.line(54, 46, 558, 46)
        self.restoreState()

def build_pdf(filename="SENTINELX_TODAY_CHANGES_AND_GUIDE.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom color palette
    c_primary = colors.HexColor("#0f172a")     # Deep Slate
    c_accent = colors.HexColor("#0284c7")      # Cyber Blue
    c_danger = colors.HexColor("#dc2626")      # Threat Red
    c_success = colors.HexColor("#16a34a")     # Green
    c_body = colors.HexColor("#334155")        # Body text
    c_card_bg = colors.HexColor("#f8fafc")     # Light card background
    c_border = colors.HexColor("#e2e8f0")

    # Typography styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=c_primary,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_accent,
        spaceAfter=14,
    )

    h1_style = ParagraphStyle(
        'H1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=c_primary,
        spaceBefore=14,
        spaceAfter=6,
    )

    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=c_accent,
        spaceBefore=8,
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=c_body,
        spaceAfter=6,
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=body_style,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        'Code',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderPadding=6,
        spaceBefore=4,
        spaceAfter=6,
    )

    story = []

    # Title block
    story.append(Paragraph("SENTINELX: COMPLETE SYSTEM & PRODUCTION GUIDE", title_style))
    story.append(Paragraph("A Plain-English Explanation with Real-Life Analogies & Architecture Deep-Dive", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=0, spaceAfter=10))

    # Metadata table
    meta_data = [
        [
            Paragraph("<b>Date:</b> 27 November 2026", body_style),
            Paragraph("<b>Target Datacenter:</b> Bengaluru Core (12.97°N, 77.59°E)", body_style),
        ],
        [
            Paragraph("<b>Project:</b> SentinelX Autonomous DDoS SOC", body_style),
            Paragraph("<b>Target Domain Cost:</b> 100% Free Architecture", body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[240, 264])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # Section 1
    story.append(Paragraph("1. In Plain Words: What Is SentinelX & What Changed Today?", h1_style))
    story.append(Paragraph(
        "SentinelX is an automated cybersecurity radar and active defense firewall. If you operate an online e-commerce website, you face two very different kinds of traffic rushes:",
        body_style
    ))
    story.append(Paragraph("• <b>Scenario A (Good):</b> You launch a festive discount. Thousands of genuine buyers arrive from Delhi, Mumbai, and New York. You want them all to buy smoothly.", bullet_style))
    story.append(Paragraph("• <b>Scenario B (Bad):</b> A competitor or cybercriminal uses automated bot scripts to bombard your server with 50,000 fake visits per second to crash your website.", bullet_style))
    story.append(Paragraph(
        "SentinelX observes every single packet in real-time, calculates statistical randomness (Shannon Entropy), displays live visual threat vectors on an interactive 3D Globe, explains incidents in simple English, and <b>actively drops malicious IPs at the door</b>.",
        body_style
    ))

    # Section 2: Real Life Analogy
    story.append(Paragraph("2. Real-Life Analogy: The Exclusive Nightclub & Bouncer", h1_style))
    story.append(Paragraph(
        "To understand SentinelX without technical jargon, imagine your website is a popular, exclusive nightclub:",
        body_style
    ))
    story.append(Paragraph("<b>1. The Front Door Bouncer (Nginx & Token Bucket):</b> Every visitor is given a stamp with 40 tokens. Walking in, buying a drink, or checking the menu uses 1 token, which refills naturally. If a robot tries to sprint through the turnstile 100 times in 1 second, the bouncer immediately blocks it (HTTP 429: Slow Down).", bullet_style))
    story.append(Paragraph("<b>2. The Chalkboard Blacklist (Redis Active Quarantine):</b> When a troublemaker throws rocks at the entrance, the bouncer writes their name on a 5-minute timeout chalkboard. For the next 5 minutes, if they touch the door, it locks instantly (HTTP 403: Forbidden).", bullet_style))
    story.append(Paragraph("<b>3. The Security Command Center (3D Globe):</b> Inside the manager's office, a rotating holographic globe shows green lasers for real shoppers and red pulsating lines pointing directly at attackers.", bullet_style))
    story.append(Paragraph("<b>4. The Incident Logbook (Neon Tech Database):</b> The guard does NOT write down all 10,000 peaceful visitors. The guard only logs major incidents once every 30 seconds when an anomaly is classified.", bullet_style))

    # Section 3: 3D Globe Visual Overhaul
    story.append(Paragraph("3. 3D Globe Visual Overhaul (Space Background & Vector Borders)", h1_style))
    story.append(Paragraph(
        "Previously, the 3D globe relied on external unpkg CDN links, had harsh yellow satellite glare, and floated over flat void black. We performed a complete visual rebuild:",
        body_style
    ))
    story.append(Paragraph("• <b>100% Local Textures:</b> Serves <code>/earth-dark.jpg</code> and <code>/earth-topology.png</code> locally for instant 0ms offline rendering.", bullet_style))
    story.append(Paragraph("• <b>3D Celestial Starfield:</b> Added <code>/night-sky.png</code> as a true rotating skybox. As you pan or tilt, distant stars and nebula dust rotate with 3D camera parallax.", bullet_style))
    story.append(Paragraph("• <b>Glowing Country Vector Outlines:</b> Vector borders rendered from GeoJSON pulse cyan during peacetime and crimson during volumetric attacks.", bullet_style))
    story.append(Paragraph("• <b>Floating 3D In-Scene Labels:</b> Displays <code>● SOC CORE (BENGALURU)</code> and live threat origin tags right in the 3D world.", bullet_style))

    # Section 4: Detection & Shannon Entropy
    story.append(Paragraph("4. Detection Beyond Counting: The Shannon Entropy 'Fake Crowd' Detector", h1_style))
    story.append(Paragraph(
        "Basic systems only count total requests per second. That fails during festive sales because genuine crowds get blocked. SentinelX now uses <b>Shannon Entropy</b>:",
        body_style
    ))

    entropy_box = [
        [Paragraph("<b>Flash Sale (Legitimate Crowd)</b>", h2_style), Paragraph("<b>Botnet Attack (Malicious Flood)</b>", h2_style)],
        [
            Paragraph("5,000 shoppers arrive from 4,000 distinct residential IP addresses and mobile networks across multiple cities.<br/><br/><b>Entropy: HIGH (&gt; 0.75)</b><br/>SentinelX Verdict: <b>FLASH_SALE (Allowed)</b>", body_style),
            Paragraph("5,000 requests arrive, but 85% come from 1 single IP or small server farm subnet.<br/><br/><b>Entropy: LOW (&lt; 0.35)</b><br/>SentinelX Verdict: <b>BOT_ATTACK (Quarantined)</b>", body_style),
        ]
    ]
    e_table = Table(entropy_box, colWidths=[246, 258])
    e_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_card_bg),
        ('BOX', (0,0), (-1,-1), 0.5, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(e_table)
    story.append(Spacer(1, 8))

    # Section 5: Neon Tech Database Analysis
    story.append(Paragraph("5. Your Neon Tech Cloud Database: What It Stores & Zero Cost Guarantee", h1_style))
    story.append(Paragraph(
        "You asked what is stored in your Neon PostgreSQL database (the <code>incidents</code> table shown in your console screenshot) and whether it can charge you:",
        body_style
    ))
    story.append(Paragraph("• <b>What is stored?</b> Only incident summaries (id, timestamp, total_rps, status, attacker_ips, and AI explanations). Individual raw HTTP requests are <b>never</b> stored in Neon; they live in Redis RAM and expire in 60 seconds.", bullet_style))
    story.append(Paragraph("• <b>Can Neon charge you automatically?</b> <b>NO.</b> Neon Free Tier does not require a credit card. Without billing details, they cannot charge your card or bank account under any circumstances.", bullet_style))
    story.append(Paragraph("• <b>Can it get full?</b> Neon provides 500 MB. Right now, your 295 rows take up only <b>~140 KB (0.02% of your limit)</b>. It would take nearly 1 year of non-stop continuous attacks to reach 500 MB.", bullet_style))
    story.append(Paragraph("• <b>The Permanent Auto-Prune Safeguard:</b> We added automatic rolling cleanup in <code>detector.py</code>. Whenever records exceed 2,000, SentinelX automatically prunes the oldest archived rows. This permanently caps your database at <b>~2 MB forever</b>!", bullet_style))

    # Section 6: Production Blueprint
    story.append(Paragraph("6. Production Blueprint: Protecting a Real E-Commerce Store 100% Free", h1_style))
    story.append(Paragraph(
        "Here is the exact 4-step manual checklist to deploy this enterprise-grade defense for $0:",
        body_style
    ))
    story.append(Paragraph("<b>Step 1: Free MaxMind Offline Database (Optional):</b> Download the free <code>GeoLite2-City.mmdb</code> from maxmind.com and drop it into <code>backend/data/</code>. SentinelX auto-detects it for 0ms offline geolocation.", bullet_style))
    story.append(Paragraph("<b>Step 2: Free Cloudflare Anycast Shield:</b> Point your domain nameservers to Cloudflare (Free $0 Plan) with Proxy Status (Orange Cloud) enabled. This absorbs Layer 3/4 volumetric floods at Cloudflare's edge.", bullet_style))
    story.append(Paragraph("<b>Step 3: Invisible Bot Challenge (Cloudflare Turnstile):</b> Add the free Turnstile script to your checkout form. Real humans solve an invisible 50ms cryptographic puzzle in the background; dumb bot scripts fail immediately.", bullet_style))
    story.append(Paragraph("<b>Step 4: Deploy SentinelX Nginx Proxy:</b> Copy the pre-built configuration from <code>deployment/nginx-sentinelx.conf</code> to your server. It caches static assets and mirrors traffic to SentinelX.", bullet_style))

    # Section 7: Verification & Git
    story.append(Paragraph("7. Current System Health & Git Commit State", h1_style))
    story.append(Paragraph("All services are running live and verified on your local environment:", body_style))
    story.append(Paragraph("• <b>FastAPI Backend:</b> Port 8001 (Status: 200 OK)", bullet_style))
    story.append(Paragraph("• <b>Frontend Dashboard:</b> Port 5173 (http://localhost:5173)", bullet_style))
    story.append(Paragraph("• <b>Redis Container:</b> Port 6379 (Active Quarantine & Token Bucket enabled)", bullet_style))
    story.append(Paragraph("• <b>Anomaly Detector:</b> Active (Shannon Entropy & Auto-Pruning enabled)", bullet_style))
    story.append(Paragraph("• <b>Git State:</b> Pushed to origin/main on GitHub.", bullet_style))

    # Build the PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated: {filename}")

if __name__ == "__main__":
    build_pdf()
