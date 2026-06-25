import csv
import json
from collections import Counter

# Types we care about for the SUS app
RELEVANT_TYPES = {"01", "02", "04", "05", "07", "15", "20", "36", "43", "71", "73"}

# Excluded CNES (manually removed or added)
EXCLUDED_CNES = {"802522", "2652757", "2652765"}
MANUAL_CNES = {"2466422"}

# Load municipality mapping
print("Loading municipalities...")
mun_map = {}
with open("banco-2026/tbMunicipio202605.csv", "r", encoding="latin-1") as f:
    reader = csv.DictReader(f, delimiter=";", quotechar='"')
    for row in reader:
        code = row["CO_MUNICIPIO"].strip()
        mun_map[code] = {
            "cidade": row["NO_MUNICIPIO"].strip(),
            "uf": row["CO_SIGLA_ESTADO"].strip(),
        }
print(f"  {len(mun_map)} municipalities loaded")

# Load turno mapping
print("Loading turnos...")
turno_map = {}
with open("banco-2026/tbTurnoAtendimento202605.csv", "r", encoding="latin-1") as f:
    reader = csv.DictReader(f, delimiter=";", quotechar='"')
    for row in reader:
        turno_map[row["CO_TURNO_ATENDIMENTO"].strip()] = row["DS_TURNO_ATENDIMENTO"].strip()
print(f"  {len(turno_map)} turnos loaded")

# Load current database
print("Loading current database...")
with open("backup/establishments.json", "r", encoding="utf-8") as f:
    current_db = json.load(f)
current_cnes = {str(row["co_cnes"]) for row in current_db}
print(f"  {len(current_cnes)} current records")

# Parse new CSV
print("Parsing new CSV (filtered by relevant types)...")
new_records = {}
skipped_types = 0
total = 0

with open("banco-2026/tbEstabelecimento202605.csv", "r", encoding="latin-1") as f:
    reader = csv.DictReader(f, delimiter=";", quotechar='"')
    for row in reader:
        total += 1
        tp = row.get("TP_UNIDADE", "").strip()
        if tp not in RELEVANT_TYPES:
            skipped_types += 1
            continue

        cnes = row.get("CO_CNES", "").strip()
        if not cnes or cnes in EXCLUDED_CNES:
            continue

        lat_str = row.get("NU_LATITUDE", "").strip()
        lng_str = row.get("NU_LONGITUDE", "").strip()
        try:
            lat = float(lat_str) if lat_str else None
        except ValueError:
            lat = None
        try:
            lng = float(lng_str) if lng_str else None
        except ValueError:
            lng = None

        co_mun = row.get("CO_MUNICIPIO_GESTOR", "").strip()
        mun_info = mun_map.get(co_mun, {})

        co_turno = row.get("CO_TURNO_ATENDIMENTO", "").strip()
        ds_turno = turno_map.get(co_turno, "Nao informado")

        cep_raw = row.get("CO_CEP", "").strip()
        if cep_raw and len(cep_raw) >= 8:
            cep = f"{cep_raw[:5]}-{cep_raw[5:8]}"
        else:
            cep = cep_raw if cep_raw else None

        telefone = row.get("NU_TELEFONE", "").strip() or "Nao informado"

        new_records[cnes] = {
            "co_cnes": cnes,
            "no_fantasia": row.get("NO_FANTASIA", "").strip() or None,
            "no_razao_social": row.get("NO_RAZAO_SOCIAL", "").strip() or None,
            "no_logradouro": row.get("NO_LOGRADOURO", "").strip() or None,
            "nu_endereco": row.get("NU_ENDERECO", "").strip() or None,
            "no_bairro": row.get("NO_BAIRRO", "").strip() or None,
            "co_cep": cep,
            "cidade": mun_info.get("cidade", ""),
            "uf": mun_info.get("uf", "??"),
            "co_ibge": co_mun or None,
            "latitude": lat,
            "longitude": lng,
            "nu_telefone": telefone,
            "ds_turno_atendimento": ds_turno,
            "tp_unidade": int(tp),
            "has_coords": 1 if (lat is not None and lng is not None) else 0,
        }

print(f"  Total CSV rows: {total}")
print(f"  Skipped (irrelevant types): {skipped_types}")
print(f"  Relevant records: {len(new_records)}")

# Analysis
new_cnes_set = set(new_records.keys())
added = new_cnes_set - current_cnes - MANUAL_CNES
removed = current_cnes - new_cnes_set - EXCLUDED_CNES - MANUAL_CNES
updated = new_cnes_set & current_cnes

print(f"\n=== ANALYSIS ===")
print(f"  New establishments to ADD: {len(added)}")
print(f"  Establishments REMOVED from DataSUS: {len(removed)}")
print(f"  Establishments to UPDATE: {len(updated)}")
print(f"  Manual records preserved: {len(MANUAL_CNES)}")
print(f"  Excluded records honored: {len(EXCLUDED_CNES)}")

# Build final dataset
# Include the manual UPA
upa_record = None
for r in current_db:
    if str(r["co_cnes"]) in MANUAL_CNES:
        upa_record = r
        break

final_records = list(new_records.values())
if upa_record:
    final_records.append({
        "co_cnes": str(upa_record["co_cnes"]),
        "no_fantasia": upa_record.get("no_fantasia"),
        "no_razao_social": upa_record.get("no_razao_social"),
        "no_logradouro": upa_record.get("no_logradouro"),
        "nu_endereco": upa_record.get("nu_endereco"),
        "no_bairro": upa_record.get("no_bairro"),
        "co_cep": upa_record.get("co_cep"),
        "cidade": upa_record.get("cidade", ""),
        "uf": upa_record.get("uf", ""),
        "co_ibge": upa_record.get("co_ibge"),
        "latitude": upa_record.get("latitude"),
        "longitude": upa_record.get("longitude"),
        "nu_telefone": upa_record.get("nu_telefone", "Nao informado"),
        "ds_turno_atendimento": upa_record.get("ds_turno_atendimento", "Nao informado"),
        "tp_unidade": upa_record.get("tp_unidade", 4),
        "has_coords": 1 if upa_record.get("latitude") else 0,
    })

print(f"\n=== FINAL DATASET ===")
print(f"  Total records: {len(final_records)}")

with_coords = sum(1 for r in final_records if r["has_coords"] == 1)
print(f"  With coordinates: {with_coords}")
print(f"  Without coordinates: {len(final_records) - with_coords}")

# Type breakdown
tp_count = Counter(r["tp_unidade"] for r in final_records)
tp_names = {
    1: "Posto de Saude",
    2: "Centro de Saude/UBS",
    4: "Policlinica",
    5: "Hospital Geral",
    7: "Hospital Especializado",
    15: "Unidade Mista",
    20: "Pronto Socorro Geral",
    36: "Clinica/Centro Especialidade",
    43: "Farmacia",
    71: "Centro Apoio Saude Familia",
    73: "Pronto Atendimento",
}
print(f"\n  By type:")
for tp, count in sorted(tp_count.items(), key=lambda x: -x[1]):
    name = tp_names.get(tp, f"Tipo {tp}")
    print(f"    {tp:2d} ({name}): {count}")

# Save to backup
output_path = "backup/establishments_2026_05.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(final_records, f, ensure_ascii=False)

print(f"\nSaved final dataset to {output_path}")
print(f"Ready for upload to Turso!")
