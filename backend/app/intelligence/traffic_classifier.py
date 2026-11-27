import math

# ─── Detection Thresholds (SOC Multi-Factor Detection Engine) ─────────────────
#
# Multi-Factor Analysis:
# 1. Volume (Total RPS thresholding)
# 2. IP Concentration Ratio (% of traffic from single top source)
# 3. Shannon Entropy of Source Distribution (organically distributed vs bot-clustered)
# 4. Multi-Factor Threat Score (0–100 scale)
#
NORMAL_THRESHOLD       = 100    # below this → NORMAL baseline
VOLUMETRIC_THRESHOLD   = 400    # above this → VOLUMETRIC_DDOS (CRITICAL)
IP_CONCENTRATION_RATIO = 0.40   # single IP > 40% → BOT_ATTACK

def calculate_shannon_entropy(ip_distribution: list[tuple[str, int]], total_rps: int) -> tuple[float, float]:
    """
    Computes Shannon Entropy H(X) and Normalized Entropy En(X) [0.0 - 1.0].
    - Organic human traffic: high entropy (En > 0.75), widely dispersed across residential ASNs.
    - Scripted bot attacks: low entropy (En < 0.45), tightly concentrated in few sources.
    """
    if not ip_distribution or total_rps <= 0:
        return 0.0, 0.0
    
    source_count = len(ip_distribution)
    if source_count <= 1:
        return 0.0, 0.0

    entropy = 0.0
    for _, count in ip_distribution:
        if count > 0:
            p = count / total_rps
            entropy -= p * math.log2(p)

    max_possible_entropy = math.log2(source_count)
    normalized_entropy = round(entropy / max_possible_entropy, 3) if max_possible_entropy > 0 else 0.0
    return round(entropy, 2), normalized_entropy


def classify_traffic(total: int, ip_distribution: list[tuple[str, int]]) -> dict:
    top_ip, top_ip_rps = ip_distribution[0] if ip_distribution else (None, 0)
    source_count = len(ip_distribution)
    concentration = round((top_ip_rps / total) * 100) if total else 0

    entropy, norm_entropy = calculate_shannon_entropy(ip_distribution, total)

    # ── Multi-Factor Threat Scoring Engine (0 – 100) ──────────────────────────
    # Component 1: Volume Score (0 - 35)
    volume_score = min(35, round((total / VOLUMETRIC_THRESHOLD) * 35)) if total else 0

    # Component 2: Concentration Score (0 - 35)
    concentration_score = min(35, round((concentration / 100) * 35))

    # Component 3: Entropy Anomaly Score (0 - 20) — lower entropy = higher suspicion
    entropy_score = round((1.0 - norm_entropy) * 20) if source_count > 2 else (20 if total > NORMAL_THRESHOLD else 5)

    # Base Threat Score
    threat_score = min(100, volume_score + concentration_score + entropy_score)

    result = {
        "status":                   "NORMAL",
        "attack_type":              None,
        "is_attack":                False,
        "faulty_rps":               0,
        "legitimate_rps":           total,
        "attacker_ips":             [],
        "severity":                 "INFO",
        "source_count":             source_count,
        "top_source_rps":           top_ip_rps,
        "top_source_concentration": concentration,
        "entropy":                  entropy,
        "normalized_entropy":       norm_entropy,
        "threat_score":             threat_score,
        "detection_method":         "Entropy & Volume Multi-Factor",
        "detection_reason":         (
            f"Traffic is nominal at {total} RPS (baseline <= {NORMAL_THRESHOLD} RPS). "
            f"Observed {source_count} unique sources with balanced entropy ({norm_entropy})."
        ),
    }

    # ── Case 1: Volumetric DDoS — throughput exceeds safety threshold ─────────
    if total > VOLUMETRIC_THRESHOLD:
        threat_score = max(85, min(100, 70 + round((total / VOLUMETRIC_THRESHOLD) * 25)))
        result.update(
            status="VOLUMETRIC_DDOS",
            attack_type="Volumetric DDoS Flood — CRITICAL",
            is_attack=True,
            faulty_rps=total,
            legitimate_rps=0,
            attacker_ips=[ip for ip, _ in ip_distribution[:10]],
            severity="CRITICAL",
            threat_score=threat_score,
            detection_reason=(
                f"CRITICAL: Throughput reached {total} RPS, exceeding the volumetric "
                f"threshold ({VOLUMETRIC_THRESHOLD} RPS). "
                f"Distributed across {source_count} sources with entropy {entropy}. "
                f"Top source: {top_ip} ({concentration}%). Active scrubbing enforced."
            ),
        )

    # ── Case 2: Spike Zone (100–400 RPS) — check IP concentration & entropy ──
    elif total > NORMAL_THRESHOLD:

        # Sub-case A: Single IP dominates OR entropy collapses → BOT_ATTACK (CRITICAL)
        if (top_ip and top_ip_rps > (total * IP_CONCENTRATION_RATIO)) or (norm_entropy < 0.35 and total > 140):
            threat_score = max(75, threat_score)
            faulty = top_ip_rps if top_ip else total
            legit = max(0, total - faulty)
            result.update(
                status="BOT_ATTACK",
                attack_type="Targeted Bot Attack — CRITICAL",
                is_attack=True,
                faulty_rps=faulty,
                legitimate_rps=legit,
                attacker_ips=[top_ip] if top_ip else [ip for ip, _ in ip_distribution[:3]],
                severity="CRITICAL",
                threat_score=threat_score,
                detection_reason=(
                    f"CRITICAL: Single-source concentration detected. "
                    f"IP {top_ip} generated {top_ip_rps} of {total} RPS ({concentration}%). "
                    f"Shannon entropy dropped to {entropy} (normalized {norm_entropy}), "
                    f"indicating an artificial bot script rather than organic users."
                ),
            )

        # Sub-case B: Distributed spike with healthy entropy → FLASH_SALE (Legitimate)
        else:
            threat_score = min(45, max(15, round(total / 10)))
            result.update(
                status="FLASH_SALE",
                attack_type="Distributed Legitimate Surge (Flash Sale)",
                threat_score=threat_score,
                detection_reason=(
                    f"Traffic reached {total} RPS with broad source distribution across "
                    f"{source_count} IPs. High normalized entropy ({norm_entropy}) confirms "
                    f"organic multi-regional user activity. No blocking required."
                ),
            )

    return result
