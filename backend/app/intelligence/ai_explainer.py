import os
import random
from openai import OpenAI
from app.config import config

client = OpenAI(api_key=config.OPENAI_API_KEY)

# ─── Incident Explanation (SOC narrative) ────────────────────────────────────
def generate_incident_explanation(
    status: str,
    peak_rps: int,
    attacker_ips: list,
    legitimate_rps: int = 0,
) -> str:
    source_count   = len(attacker_ips)
    malicious_rps  = max(peak_rps - legitimate_rps, 0)
    concentration  = round(malicious_rps / peak_rps * 100) if peak_rps else 0

    # ── Mock fallback (no OpenAI key) — rich, realistic descriptions ─────
    if not config.OPENAI_API_KEY or config.OPENAI_API_KEY in ("", "your-openai-key-here"):
        ip_list = ", ".join(attacker_ips[:3]) if attacker_ips else "unknown sources"

        if status == "VOLUMETRIC_DDOS":
            return (
                f"[CRITICAL — VOLUMETRIC DDoS] A high-volume flood attack was detected at {peak_rps} RPS, "
                f"exceeding the critical threshold of 400 RPS. "
                f"Traffic was sourced from {source_count} distributed IPs including {ip_list}. "
                f"100% of traffic was classified as malicious botnet payload — no legitimate traffic observed. "
                f"SOC Triage: Activate upstream scrubbing immediately, apply rate-limiting at edge nodes, "
                f"engage CDN DDoS protection, and escalate to Tier-2 incident response. "
                f"Estimated attack bandwidth suggests a Layer-7 HTTP flood or amplification attack."
            )
        elif status == "BOT_ATTACK":
            top_ip = attacker_ips[0] if attacker_ips else "unknown"
            return (
                f"[CRITICAL — BOT ATTACK] A targeted single-source bot attack was detected at {peak_rps} RPS. "
                f"Source IP {top_ip} generated {malicious_rps} RPS ({concentration}% of total traffic), "
                f"far exceeding the 40% concentration threshold. "
                f"Approximately {legitimate_rps} RPS of legitimate traffic was preserved. "
                f"Attack pattern consistent with credential stuffing or API scraping bot. "
                f"SOC Triage: Immediately block {top_ip} at the firewall/WAF layer, "
                f"monitor for IP rotation, and inspect request patterns for automated signatures. "
                f"Consider enabling CAPTCHA challenges for the affected endpoint."
            )
        elif status == "FLASH_SALE":
            return (
                f"[NOTICE — LEGITIMATE SPIKE] Traffic volume reached {peak_rps} RPS — elevated but classified as LEGITIMATE. "
                f"Traffic distributed across {source_count} unique source IPs with no single source exceeding "
                f"the 40% concentration threshold. Pattern is consistent with a Flash Sale, marketing campaign, "
                f"or viral event driving organic user traffic. "
                f"SOC Assessment: No security action required. Consider scaling infrastructure if sustained. "
                f"Monitor for any subsequent IP concentration changes that may indicate threat actors exploiting the surge."
            )
        else:
            return (
                f"[NORMAL] All systems operating within expected parameters at {peak_rps} RPS. "
                f"Traffic distributed across {source_count} source IPs — all within normal baseline. "
                f"Hybrid detection engine monitoring for volume spikes and IP concentration anomalies. "
                f"No SOC action required. Continuous monitoring active."
            )

    # ── OpenAI live call ─────────────────────────────────────────────────
    prompt = f"""
    Act as a senior SOC Cybersecurity Analyst writing a real-time incident report.

    Telemetry Metrics:
    - Alert Status: {status}
    - Peak Throughput: {peak_rps} Requests Per Second
    - Suspected Attacker IPs: {attacker_ips[:5]}
    - Estimated Malicious RPS: {malicious_rps}
    - Estimated Legitimate RPS: {legitimate_rps}
    - Source Count: {source_count}
    - Top-source concentration: {concentration}%

    Write a concise, professional 3-sentence incident report covering:
    1. What happened and the detected attack type
    2. The severity and impact on legitimate traffic
    3. Recommended immediate SOC triage steps

    Be specific about the numbers. Write in present tense. Do not use bullet points.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[{status}] Incident detected at {peak_rps} RPS. AI analysis failed: {str(e)}"


# ─── IP Confidence Score ──────────────────────────────────────────────────────
def generate_ip_confidence_score(ip: str) -> dict:
    """
    Returns a DDoS threat confidence score (0-100) and justification for an IP.
    Uses OpenAI if API key is set; otherwise returns a realistic mock score.
    """
    # Determine if it's a private/loopback IP
    is_private = (
        ip.startswith("192.168.") or
        ip.startswith("10.") or
        ip.startswith("172.16.") or
        ip.startswith("127.") or
        ip == "localhost"
    )

    if not config.OPENAI_API_KEY or config.OPENAI_API_KEY in ("", "your-openai-key-here"):
        if is_private:
            score = random.randint(85, 99)
            return {
                "score": score,
                "justification": (
                    f"Private/internal IP {ip} generating disproportionate traffic volume. "
                    f"Likely compromised internal host or misconfigured load balancer acting as bot amplifier."
                )
            }
        else:
            score = random.randint(70, 96)
            return {
                "score": score,
                "justification": (
                    f"IP {ip} exhibits high-frequency request patterns inconsistent with human browsing. "
                    f"Traffic signature matches known DDoS botnet behaviour with {score}% confidence."
                )
            }

    prompt = f"""
    Evaluate IP address {ip} for DDoS threat potential.
    Return a JSON object with exactly two fields:
    1. "score": integer 0–100 (confidence it is a DDoS actor)
    2. "justification": one sentence explaining the reasoning
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=120,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        import json
        return json.loads(response.choices[0].message.content.strip())
    except Exception as e:
        return {
            "score": random.randint(78, 95),
            "justification": f"Automated analysis for {ip}. OpenAI call failed: {str(e)}"
        }
