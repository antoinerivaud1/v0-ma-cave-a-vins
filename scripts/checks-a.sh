#!/usr/bin/env bash
# Checks A déterministes - Ma Cave à Vins QA Agent
# Usage: bash scripts/checks-a.sh <repo_path> [base_branch]   (pnpm check:conventions = ce repo, base develop)
# Sortie: rapport texte PASS / FAIL / REVIEW par check.
# PASS  = conforme, rien à faire
# FAIL  = violation certaine (rejet automatique)
# REVIEW = suspect, arbitrage LLM requis sur les lignes listées uniquement
set -u
REPO="${1:?Usage: checks-a.sh <repo_path> [base_branch]}"
BASE="${2:-main}"
cd "$REPO" || { echo "FATAL: repo introuvable: $REPO"; exit 2; }

CHANGED=$(git diff --name-only "$BASE"...HEAD)
CODE_FILES=$(echo "$CHANGED" | grep -E "\.(ts|tsx|js|jsx)$" || true)
FAILED=0

report() { echo "[$1] $2 - $3"; [ "$1" = "FAIL" ] && FAILED=1; }

# --- A1. Single quotes dans les lignes ajoutees ---
A1_HITS=""
for f in $CODE_FILES; do
  HITS=$(git diff -U0 "$BASE"...HEAD -- "$f" | grep -n "^+" | grep -v "^+++" \
    | grep "'" | grep -vE "^\+\s*(//|\*|/\*)" || true)
  [ -n "$HITS" ] && A1_HITS="$A1_HITS\n$f:\n$HITS"
done
if [ -n "$A1_HITS" ]; then
  report "REVIEW" "A1" "Single quotes detectes dans des lignes ajoutees (arbitrer: code vs regex/JSON):"
  echo -e "$A1_HITS"
else
  report "PASS" "A1" "Aucun single quote dans les lignes ajoutees"
fi

# --- A2. sanitizeWineName sur affichages de noms de vins ---
A2_HITS=""
for f in $CODE_FILES; do
  ADDED=$(git diff -U0 "$BASE"...HEAD -- "$f" | grep "^+" | grep -v "^+++" || true)
  if echo "$ADDED" | grep -qE "wine\.(name|title)" ; then
    if ! grep -q "sanitizeWineName" "$f" 2>/dev/null; then
      A2_HITS="$A2_HITS $f"
    fi
  fi
done
if [ -n "$A2_HITS" ]; then
  report "FAIL" "A2" "wine.name/title affiche sans sanitizeWineName dans:$A2_HITS"
else
  report "PASS" "A2" "sanitizeWineName OK"
fi

# --- A3. Safe-area-inset si nouveau fixed/sticky ---
A3_HITS=""
for f in $CODE_FILES; do
  ADDED=$(git diff -U0 "$BASE"...HEAD -- "$f" | grep "^+" | grep -v "^+++" || true)
  if echo "$ADDED" | grep -qE "(position:\s*(fixed|sticky)|className=.*(fixed|sticky))"; then
    if ! grep -q "safe-area-inset" "$f" 2>/dev/null; then
      A3_HITS="$A3_HITS $f"
    fi
  fi
done
if [ -n "$A3_HITS" ]; then
  report "REVIEW" "A3" "fixed/sticky ajoute sans safe-area-inset (arbitrer si header/footer/nav):$A3_HITS"
else
  report "PASS" "A3" "Safe-area-inset OK"
fi

# --- A4. Bottom sheets: max-h-[90dvh] flex flex-col ---
A4_HITS=""
for f in $CODE_FILES; do
  ADDED=$(git diff -U0 "$BASE"...HEAD -- "$f" | grep "^+" | grep -v "^+++" || true)
  if echo "$ADDED" | grep -qiE "(Sheet|Drawer|BottomSheet)" && echo "$ADDED" | grep -qE "(form|Form|input|Input)"; then
    if ! grep -q "max-h-\[90dvh\]" "$f" 2>/dev/null; then
      A4_HITS="$A4_HITS $f"
    fi
  fi
done
if [ -n "$A4_HITS" ]; then
  report "REVIEW" "A4" "Sheet avec formulaire sans max-h-[90dvh] (arbitrer):$A4_HITS"
else
  report "PASS" "A4" "Bottom sheets OK"
fi

# --- A5. Z-index sheets custom >= z-[60] ---
A5_HITS=""
for f in $CODE_FILES; do
  ADDED=$(git diff -U0 "$BASE"...HEAD -- "$f" | grep "^+" | grep -v "^+++" || true)
  if echo "$ADDED" | grep -q "fixed" && echo "$ADDED" | grep -q "inset"; then
    if ! echo "$ADDED" | grep -qE "z-\[(6[0-9]|[7-9][0-9]|[0-9]{3,})\]"; then
      A5_HITS="$A5_HITS $f"
    fi
  fi
done
if [ -n "$A5_HITS" ]; then
  report "REVIEW" "A5" "Sheet custom potentiel sans z-[60]+ (arbitrer):$A5_HITS"
else
  report "PASS" "A5" "Z-index OK"
fi

# --- A6. Fichiers interdits ---
FORBIDDEN="components/providers/auth-provider.tsx hooks/use-auth.ts hooks/use-stock-overrides.ts app/page.tsx"
A6_HITS=""
for f in $FORBIDDEN; do
  echo "$CHANGED" | grep -qx "$f" && A6_HITS="$A6_HITS $f"
done
if [ -n "$A6_HITS" ]; then
  report "FAIL" "A6" "Fichier(s) interdit(s) dans le diff (OK uniquement si PR [OVERRIDE]):$A6_HITS"
else
  report "PASS" "A6" "Aucun fichier interdit touche"
fi

# --- A7. package.json => pnpm-lock.yaml ---
if echo "$CHANGED" | grep -qx "package.json"; then
  # Seules les lignes de dependances (cle: version) exigent le lockfile ; les scripts non.
  DEP_LINES=$(git diff -U0 "$BASE"...HEAD -- package.json | grep -E '^[+-]\s*"[^"]+":\s*"[\^~>=<]?[0-9]' || true)
  if [ -z "$DEP_LINES" ]; then
    report "PASS" "A7" "package.json modifie (scripts/meta uniquement, pas de dependance)"
  elif echo "$CHANGED" | grep -qx "pnpm-lock.yaml"; then
    report "PASS" "A7" "package.json + lockfile presents"
  else
    report "FAIL" "A7" "dependances modifiees dans package.json sans pnpm-lock.yaml"
  fi
else
  report "PASS" "A7" "package.json non modifie"
fi

# --- A8. WineCardActions hors du button (arbitrage LLM si wine-card touche) ---
if echo "$CHANGED" | grep -q "wine-card.tsx"; then
  report "REVIEW" "A8" "wine-card.tsx modifie: verifier que <WineCardActions /> est HORS du <button> de toggle"
else
  report "PASS" "A8" "wine-card.tsx non modifie"
fi

# --- A9. Imports lucide-react dashboard.tsx si wine-card modifie ---
if echo "$CHANGED" | grep -q "wine-card.tsx"; then
  DASH=$(find . -name "dashboard.tsx" -not -path "./node_modules/*" | head -1)
  if [ -n "$DASH" ] && grep -q "Camera" "$DASH" 2>/dev/null && ! grep -E "import.*Camera.*lucide-react" "$DASH" >/dev/null 2>&1; then
    report "FAIL" "A9" "Camera utilise mais non importe dans $DASH"
  else
    report "PASS" "A9" "Imports lucide-react dashboard.tsx OK"
  fi
else
  report "PASS" "A9" "Non applicable"
fi

echo ""
if [ "$FAILED" = "1" ]; then
  echo "RESULTAT GLOBAL: FAIL (au moins un check FAIL ferme)"
  exit 1
else
  echo "RESULTAT GLOBAL: OK (PASS partout, ou REVIEW a arbitrer par le LLM)"
  exit 0
fi
