# ComplianceIQ — Data Refactor & Reconciliation Report (Phase 1 + Phase 2)

**Region:** `menat` · **Generated:** end of Phase 2 · **Rollback points:** Phase 1 = `434461e`, before Phase 2 = `434461e`, Phase 2 impl = `78bf690`

This report documents the migration of ComplianceIQ's data from hardcoded TypeScript
arrays into a portable, admin-editable **region folder** (`data/regions/<REGION>/`), and
records all reconciliation findings (matches, orphans, duplicates) for your manual review.

---

## 1. What is now file-backed & admin-editable

Every core dataset now lives as JSON in `data/regions/menat/`. The server loads each at
startup (with a safe fallback to the original in-code data if a file is missing), serves
it via API, and **persists admin edits back to the file** — no code changes needed to add,
amend, or remove entries.

| Dataset | File | Count | Served by | Admin write endpoints |
|---|---|---|---|---|
| Regulations | `regulations.json` | 89 | `GET /api/regulations` | POST / PUT / PATCH `/link` / DELETE `/api/regulations[/:id]` |
| Timeline events | `timeline.json` | 29 | `GET /api/timeline` | POST / PUT / DELETE `/api/timeline[/:id]` |
| Roadmap milestones | `roadmap-milestones.json` | 24 | `GET /api/roadmap` | POST / PUT / DELETE `/api/roadmap[/:id]` |
| Roadmap quarters | `roadmap-quarters.json` | 9 | `GET /api/roadmap` | (served with roadmap) |
| Maturity heatmap | `maturity.json` | 8 sectors / 192 cells / 24 summaries | `GET /api/maturity/heatmap` | (editable via file; admin UI editing is a future add) |
| Scraper sources | `scraper-sources.json` | 51 | `GET /api/scraper/sources` | POST / PUT / DELETE `/api/scraper/sources[/:id]` (already existed; now file-persisted) |
| News seed | `news-seed.json` | 9 | `GET /api/news/grounded` | (seed file; live feed appends at runtime) |

**Portability:** to launch another region (e.g. APAC), copy `data/regions/menat/` to
`data/regions/apac/`, replace the JSON contents, and start the server with `REGION=apac`.
No code changes required.

**No UI/UX disruption:** client components (Timeline, Roadmap, Maturity Heatmap) seed
synchronously from the original in-code data for an identical first paint, then hydrate
from the file-backed API. Verified: all feature API outputs are byte-identical to the
pre-refactor baseline; TypeScript compiles clean; all components load without error.

---

## 2. Regulations — status

- **89 regulations** total (81 original + 8 added earlier this engagement: SFDA, SCA, DHA,
  QFCRA, CBJ, OCERT, Bahrain NCSC, Kuwait CITRA DPPR).
- Grouped correctly by `countryId`; the Add-Regulation admin form now persists to
  `regulations.json`.

### 2.1 Duplicate regulation IDs — FLAG FOR MANUAL REVIEW

Four IDs are each used by **two different regulation entries** (from a prior merge of
overlapping data). These were **not** altered. Recommend keeping one of each pair and
removing/renaming the other via the admin panel or by editing `regulations.json`.

| Duplicate ID | Entry A | Entry B |
|---|---|---|
| `uae-cbuae-open-fin` | CBUAE Open Finance 2024 | CBUAE-OF-2024 |
| `uae-difc-dp-2020` | DIFC Law No. 5/2020 | DIFC Law No. 5 of 2020 |
| `uae-tdra-cloud-sec` | TDRA Cloud Cyber 2023 | TDRA-CSP-2022 |
| `uae-cbuae-enabling-tech` | CBUAE Stored Value / Tech 2020 | CBUAE-ET-2023 |

> All four are UAE entries that appear to be the same regulation entered twice under
> slightly different names. Because they share an `id`, any id-based lookup resolves to
> whichever appears first in the file.

---

## 3. Timeline / Roadmap ↔ Registry link reconciliation

The Timeline and Roadmap entries carry a `regulationId` linking them to a regulation
(used for "view / edit status / pin linked regulation" actions). Originally these IDs did
**not** match the registry. In Phase 1 the confident matches were corrected so those links
now resolve.

### 3.1 Confident matches — APPLIED

| Old (timeline/roadmap) ID | Corrected to | Regulation |
|---|---|---|
| ksa-nca-ecc | ksa-ecc-1 | NCA ECC-1:2018 |
| ksa-nca-otcc | ksa-otcc-1 | NCA OTCC-1:2022 |
| ksa-nca-cscc | ksa-cscc-1 | NCA CSCC-1:2019 |
| ksa-sdaia-ai-ethics | ksa-ai-ethics | SDAIA AI Ethics |
| ksa-cst-space | ksa-space-act | CST Space Regs |
| uae-pdpl-45 | uae-fed-pdpl | UAE Federal Decree-Law 45/2021 |
| uae-ai-code-2027 | uae-ai-nat-strat | UAE National AI Strategy |
| uae-cbuae-ccsf | uae-cbuae-cyber | CBUAE Cyber Risk Standard |
| eg-dpl-151 | eg-law-151 | Egypt Law 151/2020 |
| jo-pdpl-24 | jordan-pdpl-24 | Jordan PDPL 24/2023 |
| om-pdpl-rd6 | om-pdpl-6 | Oman Royal Decree 6/2022 |
| om-cbo-bm1188 | oman-cbo-resilience | CBO Framework |
| kw-cbk-csf | kuwait-cbk-cyber | CBK Cybersecurity Framework |
| kw-citra-cloud | kuwait-citra-cloud | CITRA Cloud Framework |
| morocco-0908 | morocco-cndp-0908 | Morocco Law 09-08 |
| (already correct) | ksa-pdpl, uae-difc-dp-2020, uae-cbuae-open-fin, tr-kvkk-6698, tr-spk-crypto-7518 | — |

### 3.2 Plausible matches — APPLIED, please VERIFY

Reasonable links but the target regulation differs somewhat in focus. Confirm they point
to the intended regulation, or split into distinct regulations.

| Old ID | Mapped to | Verify |
|---|---|---|
| ksa-sama-open-banking | ksa-sama-csf | Entry is "SAMA Open Banking v2"; registry only has SAMA Cybersecurity Framework. Consider adding a distinct SAMA Open Banking regulation. |
| il-ppl-amendment-13 | il-ppa-5777 | Israel PPL Amendment 13 → Privacy Protection Regulations. Related regime, different instrument. |
| qa-qcb-cloud | qatar-qcb-cyber | "QCB FinTech Cloud Circular" → QCB Cybersecurity Framework. Same authority, different focus. |
| bh-cbb-cra | bh-cbb-om | "CBB Rulebook Vol 6 / Crypto-Asset" → CBB OM Module. Same authority, different module. |

### 3.3 Orphans — NOT linked (no matching regulation) — FLAG FOR REVIEW

These timeline/roadmap entries reference regulations that do **not exist** in the registry.
Left with their original IDs (their "view linked regulation" action will not resolve).
Decide per item: add the regulation, relink, or leave as a timeline/roadmap-only item.

| Orphan ID | Entry | Suggested action |
|---|---|---|
| qatar-ncsa-ncf | Qatar NCF v2.0 | Registry has NCSA NIA v2.0 (`qa-ncsa-nia`) — verify if same; add NCF or relink. |
| uae-nesa-ias | NESA IAS / UAE IA | Registry has DESC IAS (`uae-desc-ias`) — related, different authority. Verify. |
| il-boi-361 | Bank of Israel Directive 361 | No BOI regulation in registry — add if in scope. |
| tn-bct-2020-11 | BCT Circular 2020-11 (Tunisia CB) | No BCT regulation — add if in scope. |
| tr-cbdfo-big | CBDFO BIG Guide v2 | Registry has BİGR 2020 (`tr-ddo-bigr`) — likely same; verify + relink. |
| bh-cbb-pqc | CBB Circular 2024/PQC (post-quantum) | No such regulation — add if in scope. |
| gcc-unified-cyber | GCC Cyber Accord 2028 | Aspirational/future — keep roadmap-only. |
| menat-data-adequacy | MENAT Data Treaty 2028 | Aspirational/future — keep roadmap-only. |
| regional-water-ot | MENAT Desal-Cyber 2028 | Aspirational/future — keep roadmap-only. |

---

## 4. Maturity, Scraper, News — notes

- **Maturity** (`maturity.json`) is a snapshot of the previously-computed matrix (8 sectors
  × 24 countries = 192 cells + 24 country summaries). It is now data you can edit directly
  in the file. A dedicated admin UI for heatmap editing was **not** added in this phase
  (flag if you want it — it's a straightforward follow-up).
- **Scraper sources** (`scraper-sources.json`, 51) already had admin add/edit/delete; those
  operations now persist to the file (previously in-memory only).
- **News seed** (`news-seed.json`, 9) is the initial feed. The live Tavily-grounded feed
  still appends fresh items at runtime; the seed is the baseline/offline set.

---

## 5. Recommended manual actions (summary)

1. **Resolve the 4 duplicate regulation IDs** (Section 2.1) — keep one of each UAE pair.
2. **Verify the 4 plausible links** (Section 3.2).
3. **Decide on the 9 orphans** (Section 3.3) — add regulation, relink, or leave roadmap-only.
4. *(Optional)* Request an admin UI for editing maturity heatmap scores if needed.

All of the above can be done via the admin panel (now file-backed) or by editing the JSON
files in `data/regions/menat/` directly. No code changes required.
