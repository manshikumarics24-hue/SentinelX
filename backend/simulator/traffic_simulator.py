"""
SentinelX Traffic Simulator — Windows-compatible, 4-mode fast test cycle.

Designed so the FIRST attack spike happens within ~90 seconds of launch.

Test Cycle:
  WARM-UP     : 10s of normal 70 RPS (establish baseline)
  MODE 1 — BOT ATTACK  : 180 RPS, single IP (>40%)   → CRITICAL BOT_ATTACK
  COOLDOWN    : 35s normal traffic (wait for detector cooldown)
  MODE 2 — VOLUMETRIC  : 500 RPS, random IPs         → CRITICAL VOLUMETRIC_DDOS
  COOLDOWN    : 35s normal traffic
  MODE 3 — FLASH SALE  : 250 RPS, all different IPs  → FLASH_SALE (benign)
  COOLDOWN    : 15s normal traffic
  MODE 4 — NORMAL      : 60-80 RPS baseline          → No alert
  ... repeats ...
"""

import asyncio
import httpx
import random
import time
import os

TARGET_URL = os.getenv("TARGET_URL", "http://localhost:8001/api/traffic")

# Semaphore: never more than 150 simultaneous open connections
_SEM = asyncio.Semaphore(150)


def rnd_ip():
    return f"{random.randint(1,254)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


async def send(client: httpx.AsyncClient, ip: str):
    async with _SEM:
        try:
            await client.post(TARGET_URL, headers={"X-Forwarded-For": ip}, timeout=3.0)
        except Exception:
            pass


async def burst(client: httpx.AsyncClient, rps: int, seconds: int, ip_fn, label: str):
    """Send `rps` requests/second for `seconds` seconds."""
    for sec in range(seconds):
        tasks = [asyncio.create_task(send(client, ip_fn())) for _ in range(rps)]
        await asyncio.gather(*tasks)
        print(f"  {label}  sec {sec+1}/{seconds}  {rps} RPS", end="\r", flush=True)
        await asyncio.sleep(1)
    print()  # newline after progress line


async def run_simulation():
    limits = httpx.Limits(max_connections=200, max_keepalive_connections=50)

    async with httpx.AsyncClient(limits=limits) as client:
        print("━" * 60)
        print("  SentinelX Traffic Simulator  (Ctrl+C to stop)")
        print("━" * 60)

        cycle = 0
        while True:
            cycle += 1
            print(f"\n{'━'*60}")
            print(f"  CYCLE {cycle}")
            print(f"{'━'*60}")

            # ── WARM-UP: Short baseline so dashboard shows normal first ──
            print("\n  WARM-UP — NORMAL  (70 RPS, 10s baseline)")
            await burst(client, rps=70, seconds=10,
                        ip_fn=rnd_ip,
                        label=" NORMAL")

            # ── MODE 1: BOT ATTACK (single dominant IP) ─────────────────
            bot_ip = f"185.{random.randint(10,220)}.{random.randint(1,254)}.{random.randint(1,254)}"
            print(f"\n  MODE 1 — BOT ATTACK  (180 RPS, 80% from {bot_ip})")
            print("    Expected: CRITICAL BOT_ATTACK alert. Red arcs. AI popup.")

            async def bot_mix():
                """80% from bot_ip, 20% random — ensures concentration > 40%."""
                return bot_ip if random.random() < 0.80 else rnd_ip()

            await burst(client, rps=180, seconds=10,
                        ip_fn=bot_mix,
                        label=" BOT ATTACK")

            # ── Cooldown ────────────────────────────────────────────────
            print("\n  Cooldown 35s (waiting for DB cooldown window)...")
            await burst(client, rps=70, seconds=35,
                        ip_fn=rnd_ip,
                        label=" COOLDOWN")

            # ── MODE 2: VOLUMETRIC DDoS ──────────────────────────────────
            print("\n  MODE 2 — VOLUMETRIC DDoS  (500 RPS, botnet swarm)")
            print("    Expected: CRITICAL VOLUMETRIC_DDOS. Red arcs. AI popup.")
            await burst(client, rps=500, seconds=10,
                        ip_fn=rnd_ip,
                        label=" DDoS")

            # ── Cooldown ────────────────────────────────────────────────
            print("\n  Cooldown 35s...")
            await burst(client, rps=70, seconds=35,
                        ip_fn=rnd_ip,
                        label=" COOLDOWN")

            # ── MODE 3: FLASH SALE (high but distributed) ────────────────
            print("\n  MODE 3 — FLASH SALE  (250 RPS, all different IPs)")
            print("    Expected: FLASH_SALE. Globe busy, no red arcs.")
            await burst(client, rps=250, seconds=10,
                        ip_fn=rnd_ip,
                        label=" FLASH SALE")

            # ── Cooldown ────────────────────────────────────────────────
            print("\n  Cooldown 15s...")
            await burst(client, rps=70, seconds=15,
                        ip_fn=rnd_ip,
                        label=" COOLDOWN")

            # ── MODE 4: NORMAL TRAFFIC ──────────────────────────────────
            print("\n  MODE 4 — NORMAL  (70 RPS, distributed)")
            print("    Expected: No alert. Green arcs on globe.")
            await burst(client, rps=70, seconds=15,
                        ip_fn=rnd_ip,
                        label=" NORMAL")

            print(f"\n  Cycle {cycle} complete. Starting next cycle...\n")


if __name__ == "__main__":
    import sys
    if sys.platform == "win32":
        # Fix charmap error for printing emojis on Windows
        sys.stdout.reconfigure(encoding='utf-8')
        # Proactor uses Windows IOCP — NO file-descriptor limit (unlike Selector)
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(run_simulation())
