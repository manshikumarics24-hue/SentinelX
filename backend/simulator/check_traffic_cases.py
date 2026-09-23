from app.intelligence.traffic_classifier import classify_traffic


CASES = [
    ("normal", 40, [(f"10.0.0.{index}", 4) for index in range(10)], "NORMAL"),
    ("distributed spike", 220, [(f"10.0.0.{index}", 10) for index in range(22)], "FLASH_SALE"),
    ("single source bot", 220, [("192.168.1.99", 160), ("10.0.0.1", 60)], "BOT_ATTACK"),
    ("volumetric attack", 900, [(f"172.16.0.{index}", 90) for index in range(10)], "VOLUMETRIC_DDOS"),
]


def main():
    for name, total, distribution, expected in CASES:
        result = classify_traffic(total, distribution)
        assert result["status"] == expected, (name, result)
        assert result["source_count"] == len(distribution), (name, result)
        assert result["detection_reason"], name
        print(f"PASS {name}: {result['status']} | {result['detection_reason']}")


if __name__ == "__main__":
    main()