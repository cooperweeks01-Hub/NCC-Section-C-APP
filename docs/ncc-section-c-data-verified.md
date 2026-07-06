# NCC 2022 Vol One — Section C Data Extract (Class 5, 7a, 7b, 8)

**Status: VERIFIED** (Class 5, 7a, 7b, 8) — all values confirmed against source. This file is the
source of truth for the NCC data layer; set `verified: true` on import.

**FRL notation:** `Structural adequacy / Integrity / Insulation`, in minutes. `–` = no requirement.

**Class column mapping** (out-of-scope NCC columns dropped):
- **Class 5, 7a** ← NCC column "Class 5, 7a or 9"
- **Class 7b, 8** ← NCC column "Class 7b or 8"

> Note the grouping is table-dependent — see Flag 2. In C3D3, 7a groups with 7b/8; in Spec 5, 7a
> groups with 5. The data model must key each table on its own class grouping.

---

## 1. Type of construction — Table C2D2

| Rise in storeys | Required Type (Class 5–8) |
|---|---|
| 4 or more | A |
| 3 | B |
| 2 | C |
| 1 | C |

## 2. Max fire compartment size — Table C3D3

| Class | Type A | Type B | Type C |
|---|---|---|---|
| 5 | 8,000 m² / 48,000 m³ | 5,500 m² / 33,000 m³ | 3,000 m² / 18,000 m³ |
| 7a, 7b, 8 | 5,000 m² / 30,000 m³ | 3,500 m² / 21,000 m³ | 2,000 m² / 12,000 m³ |

## 3. Opening separation — Table C4D4

| Angle between walls | Min distance |
|---|---|
| 0° (walls opposite) | 6 m |
| > 0° to 45° | 5 m |
| > 45° to 90° | 4 m |
| > 90° to 135° | 3 m |
| > 135° to < 180° | 2 m |
| ≥ 180° | Nil |

---

## 4. Specification 5 — Type A construction (S5C11)

### S5C11a — Loadbearing parts of external walls
| Distance from fire-source feature | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| < 1.5 m | 120/120/120 | 240/240/240 |
| 1.5 to < 3 m | 120/90/90 | 240/240/180 |
| ≥ 3 m | 120/60/30 | 240/180/90 |

### S5C11b — Non-loadbearing parts of external walls
| Distance from fire-source feature | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| < 1.5 m | –/120/120 | –/240/240 |
| 1.5 to < 3 m | –/90/90 | –/240/180 |
| ≥ 3 m | –/–/– | –/–/– |

### S5C11c — External columns not incorporated in an external wall
| Column type | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Loadbearing | 120/–/– | 240/–/– |
| Non-loadbearing | –/–/– | –/–/– |

### S5C11d — Common walls and fire walls
| Wall type | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Loadbearing or non-loadbearing | 120/120/120 | 240/240/240 |

### S5C11e — Loadbearing internal walls
| Location | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Fire-resisting lift and stair shafts | 120/120/120 | 240/120/120 |
| Bounding public corridors, public lobbies and the like | 120/–/– | 240/–/– |
| Between or bounding sole-occupancy units | 120/–/– | 240/–/– |
| Ventilating, pipe, garbage and like shafts (not for discharge of hot products of combustion) | 120/90/90 | 240/120/120 |

### S5C11f — Non-loadbearing internal walls
| Location | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Fire-resisting lift and stair shafts | –/120/120 | –/120/120 |
| Bounding public corridors, public lobbies and the like | –/–/– | –/–/– |
| Between or bounding sole-occupancy units | –/–/– | –/–/– |
| Ventilating, pipe, garbage and like shafts (not for discharge of hot products of combustion) | –/90/90 | –/120/120 |

### S5C11g — Other building elements (not covered by S5C11a–f)
| Building element | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Other loadbearing internal walls, internal beams, trusses and columns | 120/–/– | 240/–/– |
| Floors | 120/120/120 | 240/240/240 |
| Roofs | 120/60/30 | 240/90/60 |

---

## 5. Specification 5 — Type B construction (S5C21)

### S5C21a — Loadbearing parts of external walls
| Distance from fire-source feature | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| < 1.5 m | 120/120/120 | 240/240/240 |
| 1.5 to < 3 m | 120/90/60 | 240/180/120 |
| 3 to < 9 m | 120/30/30 | 240/90/60 |
| 9 to < 18 m | 120/30/– | 240/60/– |
| ≥ 18 m | –/–/– | –/–/– |

### S5C21b — Non-loadbearing parts of external walls
| Distance from fire-source feature | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| < 1.5 m | –/120/120 | –/240/240 |
| 1.5 to < 3 m | –/90/60 | –/180/120 |
| ≥ 3 m | –/–/– | –/–/– |

### S5C21c — External columns not incorporated in an external wall
| Column type | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Loadbearing column — less than 18 m | 120/–/– | 240/–/– |
| Loadbearing column — 18 m or more | –/–/– | –/–/– |
| Non-loadbearing column | –/–/– | –/–/– |

### S5C21d — Common walls and fire walls
| Wall type | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Loadbearing or non-loadbearing | 120/120/120 | 240/240/240 |

### S5C21e — Loadbearing internal walls
| Location | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Fire-resisting lift and stair shafts | 120/120/120 | 240/120/120 |
| Bounding public corridors, public lobbies and the like | 120/–/– | 240/–/– |
| Between or bounding sole-occupancy units | 120/–/– | 240/–/– |

### S5C21f — Non-loadbearing internal walls
| Location | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Fire-resisting lift and stair shafts | –/120/120 | –/120/120 |
| Bounding public corridors, public lobbies and the like | –/–/– | –/–/– |
| Between or bounding sole-occupancy units | –/–/– | –/–/– |

### S5C21g — Other building elements (not covered by S5C21a–f)
| Building element | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Other loadbearing internal walls and columns | 120/–/– | 240/–/– |
| Roofs | –/–/– | –/–/– |

---

## 6. Specification 5 — Type C construction (S5C24)

### S5C24a — Parts of external walls
| Distance from fire-source feature | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| < 1.5 m | 90/90/90 | 90/90/90 |
| 1.5 to < 3 m | 60/60/60 | 60/60/60 |
| ≥ 3 m | –/–/– | –/–/– |

### S5C24b — External columns not incorporated into an external wall
| Distance from fire-source feature | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| < 1.5 m | 90/–/– | 90/–/– |
| 1.5 to < 3 m | 60/–/– | 60/–/– |
| ≥ 3 m | –/–/– | –/–/– |

### S5C24c — Common walls and fire walls
| Wall type | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Loadbearing or non-loadbearing | 90/90/90 | 90/90/90 |

### S5C24d — Internal walls
| Location | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Bounding public corridors, public lobbies and the like | –/–/– | –/–/– |
| Between or bounding sole-occupancy units | –/–/– | –/–/– |
| Bounding a stair if required to be rated | 60/60/60 | 60/60/60 |

### S5C24e — Roof
| Location | Class 5, 7a | Class 7b, 8 |
|---|---|---|
| Roofs | –/–/– | –/–/– |

---

## Implementation notes (data layer)

These are permanent design constraints for the engine, not verification to-dos:

1. **Class grouping differs by table — do not share one enum.** FRLs (Spec 5) group `{5, 7a}` vs
   `{7b, 8}`. Compartment size (C3D3) groups `{5}` vs `{7a, 7b, 8}`. Same class, different bucket per
   table. Key each table on its own grouping, or 7a pulls the wrong value from one of them.

2. **7a carpark carve-out is a branch, not a value.** C3D3 sizing does not apply to a sprinklered
   carpark, open-deck carpark, or open spectator stand (C3D5(1)). Skip the size check in those cases
   rather than applying the 2,000 m² / 12,000 m³ Type C limit.

3. **Scope: Class 5, 7a, 7b, 8 only.** Classification / questionnaire offers only these. Any other
   class returns "out of scope — not assessed," never a guessed result.

4. **Type C has no floors FRL** for these classes (confirmed) — floors are unrated in Type C. Type C
   also has no separate loadbearing/non-loadbearing external-wall split (single "parts of external
   walls" table).
