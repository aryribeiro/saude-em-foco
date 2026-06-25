import csv
import json
import time
import urllib.request
import urllib.parse

# Load the new dataset
print("Loading dataset...")
with open("backup/establishments_2026_05.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Load old CSV coordinates
print("Loading old CSV coordinates...")
old_coords = {}
with open("d:/VS Code/saude-teste/downloaded_data.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        cnes = row.get("CO_CNES", "").strip()
        lat_corr = row.get("NU_LATITUDE_CORRIGIDA", "").strip()
        lng_corr = row.get("NU_LONGITUDE_CORRIGIDA", "").strip()
        lat = row.get("NU_LATITUDE", "").strip()
        lng = row.get("NU_LONGITUDE", "").strip()

        if lat_corr and lng_corr:
            try:
                old_coords[cnes] = (float(lat_corr), float(lng_corr))
                continue
            except ValueError:
                pass
        if lat and lng:
            try:
                old_coords[cnes] = (float(lat), float(lng))
            except ValueError:
                pass

print(f"  {len(old_coords)} old coords loaded")

# Fill from old CSV
filled_old = 0
still_missing = []

for record in data:
    if record["has_coords"] == 1:
        continue

    cnes = record["co_cnes"]
    if cnes in old_coords:
        lat, lng = old_coords[cnes]
        record["latitude"] = lat
        record["longitude"] = lng
        record["has_coords"] = 1
        filled_old += 1
    else:
        still_missing.append(record)

print(f"  Filled from old CSV: {filled_old}")
print(f"  Still missing: {len(still_missing)}")

# Try to geocode remaining via Nominatim (free, 1 req/sec)
print(f"\nGeocoding {len(still_missing)} records via Nominatim...")
geocoded = 0
failed = 0

for i, record in enumerate(still_missing):
    # Build address query
    parts = []
    if record["no_logradouro"]:
        parts.append(record["no_logradouro"])
    if record["nu_endereco"]:
        parts.append(record["nu_endereco"])
    if record["no_bairro"]:
        parts.append(record["no_bairro"])
    if record["cidade"]:
        parts.append(record["cidade"])
    if record["uf"]:
        parts.append(record["uf"])

    if not parts:
        # Try CEP
        if record["co_cep"]:
            query = record["co_cep"] + ", Brazil"
        else:
            failed += 1
            continue
    else:
        query = ", ".join(parts) + ", Brazil"

    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&countrycodes=br&format=json&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "SaudeEmFoco/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode())

        if result:
            lat = float(result[0]["lat"])
            lon = float(result[0]["lon"])
            record["latitude"] = lat
            record["longitude"] = lon
            record["has_coords"] = 1
            geocoded += 1
        else:
            failed += 1
    except Exception:
        failed += 1

    # Rate limit: 1 request per second
    time.sleep(1.1)

    if (i + 1) % 50 == 0:
        print(f"  Progress: {i+1}/{len(still_missing)} (geocoded: {geocoded}, failed: {failed})")

print(f"\n  Geocoded via Nominatim: {geocoded}")
print(f"  Failed to geocode: {failed}")

# Final stats
total_with = sum(1 for r in data if r["has_coords"] == 1)
total_without = sum(1 for r in data if r["has_coords"] == 0)
print(f"\n=== FINAL STATS ===")
print(f"  Total records: {len(data)}")
print(f"  With coordinates: {total_with}")
print(f"  Without coordinates: {total_without}")

# Save updated dataset
output_path = "backup/establishments_2026_05.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False)
print(f"\nSaved updated dataset to {output_path}")
