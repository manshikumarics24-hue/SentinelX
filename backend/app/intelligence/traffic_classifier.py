# ─── Detection Thresholds (updated per SOC requirements) ─────────────────────
#
# NORMAL:           0  – 100 RPS  (baseline legit traffic)
# SPIKE CHECK:    100  – 400 RPS  (check IP concentration)
#   BOT_ATTACK:  if single IP > 40% of traffic  → CRITICAL
#   FLASH_SALE:  if distributed                 → legit
# VOLUMETRIC:     400+ RPS                       → CRITICAL DDoS
#
NORMAL_THRESHOLD       = 100    # below this → NORMAL
VOLUMETRIC_THRESHOLD   = 400    # above this → VOLUMETRIC_DDOS (CRITICAL)
IP_CONCENTRATION_RATIO = 0.40   # single IP > 40% → BOT_ATTACK


def classify_traffic(total: int, ip_distribution: list[tuple[str, int]]) -> dict:
    top_ip, top_ip_rps = ip_distribution[0] if ip_distribution else (None, 0)
    source_count = len(ip_distribution)
    concentration = round((top_ip_rps / total) * 100) if total else 0

    result = {
        "status":                  "NORMAL",
        "attack_type":             None,
        "is_attack":               False,
        "faulty_rps":              0,
        "legitimate_rps":          total,
        "attacker_ips":            [],
        "severity":                "INFO",
        "source_count":            source_count,
        "top_source_rps":          top_ip_rps,
        "top_source_concentration": concentration,
        "detection_reason":        (
            f"Traffic is within normal parameters at {total} RPS "
            f"(threshold: {NORMAL_THRESHOLD} RPS). "
            f"{source_count} unique sources observed — all within expected baseline."
        ),
    }

    # ── Case 1: Volumetric DDoS — anything above 400 RPS ─────────────────
    if total > VOLUMETRIC_THRESHOLD:
        result.update(
            status="VOLUMETRIC_DDOS",
            attack_type="Volumetric DDoS — CRITICAL",
            is_attack=True,
            faulty_rps=total,
            legitimate_rps=0,
            attacker_ips=[ip for ip, _ in ip_distribution[:10]],
            severity="CRITICAL",
            detection_reason=(
                f"CRITICAL: Total throughput reached {total} RPS, exceeding the "
                f"volumetric DDoS threshold of {VOLUMETRIC_THRESHOLD} RPS. "
                f"Traffic distributed across {source_count} source IPs. "
                f"Top source: {top_ip} contributing {top_ip_rps} RPS ({concentration}%). "
                f"All traffic classified as malicious — upstream scrubbing recommended."
            ),
        )

    # ── Case 2: Spike zone (100–400 RPS) — check IP concentration ────────
    elif total > NORMAL_THRESHOLD:

        # Sub-case A: Single IP dominates → BOT_ATTACK (CRITICAL)
        if top_ip and top_ip_rps > (total * IP_CONCENTRATION_RATIO):
            result.update(
                status="BOT_ATTACK",
                attack_type="Targeted Bot Attack — CRITICAL",
                is_attack=True,
                faulty_rps=top_ip_rps,
                legitimate_rps=total - top_ip_rps,
                attacker_ips=[top_ip],
                severity="CRITICAL",
                detection_reason=(
                    f"CRITICAL: Single-source concentration detected. "
                    f"IP {top_ip} generated {top_ip_rps} of {total} RPS "
                    f"({concentration}%), exceeding the {round(IP_CONCENTRATION_RATIO * 100)}% "
                    f"concentration threshold. "
                    f"Estimated {total - top_ip_rps} RPS is legitimate traffic. "
                    f"Immediate firewall block of {top_ip} recommended."
                ),
            )

        # Sub-case B: Distributed spike → FLASH_SALE (legitimate)
        else:
            result.update(
                status="FLASH_SALE",
                attack_type="Distributed Legitimate Spike",
                detection_reason=(
                    f"Traffic reached {total} RPS — elevated but no single source "
                    f"exceeded {round(IP_CONCENTRATION_RATIO * 100)}% of traffic. "
                    f"Pattern consistent with a Flash Sale or viral event "
                    f"across {source_count} distributed sources. No action required."
                ),
            )

    return result