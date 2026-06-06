#!/bin/sh
# Claude Code status line — rich info display

input=$(cat)

# ANSI colors (définies en premier — utilisées dans toutes les sections)
ESC=$(printf '\033')
RESET="${ESC}[0m"
BOLD="${ESC}[1m"
DIM="${ESC}[2m"
CYAN="${ESC}[36m"
YELLOW="${ESC}[33m"
GREEN="${ESC}[32m"
MAGENTA="${ESC}[35m"
BLUE="${ESC}[34m"
RED="${ESC}[31m"
WHITE="${ESC}[37m"

# Model
model=$(echo "$input" | jq -r '.model.display_name // empty')

# Context window
used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
total_input=$(echo "$input" | jq -r '.context_window.total_input_tokens // empty')
ctx_size=$(echo "$input" | jq -r '.context_window.context_window_size // empty')
output_tokens=$(echo "$input" | jq -r '.context_window.total_output_tokens // empty')

# Rate limits
five_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')

# Git repo
repo=$(echo "$input" | jq -r '.workspace.repo | if . then .owner + "/" + .name else empty end')

# Branch
branch=$(echo "$input" | jq -r '.worktree.branch // .git.branch // empty')
if [ -z "$branch" ]; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
fi

# Effort level
effort=$(echo "$input" | jq -r '.effort.level // empty')

# Vim mode
vim_mode=$(echo "$input" | jq -r '.vim.mode // empty')

# PR + CI
pr_num=$(echo "$input" | jq -r '.pr.number // empty')
pr_state=$(echo "$input" | jq -r '.pr.review_state // empty')
pr_url=""
ci_status=""
if [ -z "$pr_num" ]; then
  pr_json=$(gh pr view --json number,reviewDecision,url,statusCheckRollup 2>/dev/null)
  if [ -n "$pr_json" ]; then
    pr_num=$(echo "$pr_json" | jq -r '.number // empty')
    pr_state=$(echo "$pr_json" | jq -r '.reviewDecision // empty')
    pr_url=$(echo "$pr_json" | jq -r '.url // empty')
    checks=$(echo "$pr_json" | jq '.statusCheckRollup // [] | map(.state // .conclusion) | map(ascii_upcase)')
    total=$(echo "$checks" | jq 'length')
    if [ "$total" -gt 0 ]; then
      failing=$(echo "$checks" | jq '[.[] | select(. == "FAILURE" or . == "ERROR" or . == "TIMED_OUT")] | length')
      pending=$(echo "$checks" | jq '[.[] | select(. == "IN_PROGRESS" or . == "QUEUED" or . == "PENDING" or . == "WAITING" or . == "REQUESTED")] | length')
      success=$(echo "$checks" | jq '[.[] | select(. == "SUCCESS")] | length')
      if [ "$failing" -gt 0 ]; then
        ci_status="${RED}CI:✗ ${failing} fail${RESET}"
      elif [ "$pending" -gt 0 ]; then
        ci_status="${YELLOW}CI:⟳ ${pending} en cours${RESET}"
      elif [ "$success" -eq "$total" ]; then
        ci_status="${GREEN}CI:✓${RESET}"
      fi
    fi
  fi
fi

# OSC 8 hyperlink helper: link URL TEXT
link() {
  printf "${ESC}]8;;%s${ESC}\\\\%s${ESC}]8;;${ESC}\\\\" "$1" "$2"
}

# ── LINE 1: model  effort  ctx  tokens ──────────────────────────────────────
line1=""

if [ -n "$model" ]; then
  line1="${line1}${CYAN}${BOLD}${model}${RESET}"
fi

if [ -n "$effort" ]; then
  line1="${line1} ${DIM}[effort:${effort}]${RESET}"
fi

if [ -n "$used_pct" ] && [ -n "$ctx_size" ]; then
  used_int=$(printf "%.0f" "$used_pct")
  if [ "$used_int" -ge 80 ]; then
    ctx_color="${RED}"
  elif [ "$used_int" -ge 50 ]; then
    ctx_color="${YELLOW}"
  else
    ctx_color="${GREEN}"
  fi
  filled=$(( used_int / 10 ))
  bar=""
  i=0
  while [ $i -lt 10 ]; do
    if [ $i -lt $filled ]; then bar="${bar}█"; else bar="${bar}░"; fi
    i=$(( i + 1 ))
  done
  line1="${line1} ${ctx_color}ctx:${used_int}% [${bar}]${RESET}"

  if [ -n "$total_input" ]; then
    input_k=$(awk "BEGIN { printf \"%.1fk\", $total_input/1000 }")
    ctx_k=$(awk "BEGIN { printf \"%.0fk\", $ctx_size/1000 }")
    if [ -n "$output_tokens" ] && [ "$output_tokens" -gt 0 ]; then
      out_k=$(awk "BEGIN { printf \"%.1fk\", $output_tokens/1000 }")
      line1="${line1} ${DIM}in:${input_k}/${ctx_k} out:${out_k}${RESET}"
    else
      line1="${line1} ${DIM}in:${input_k}/${ctx_k}${RESET}"
    fi
  fi
fi

# ── LINE 2: limits ──────────────────────────────────────────────────────────
line2=""

rate_str=""
if [ -n "$five_pct" ]; then
  rate_str="5h:$(printf '%.0f' "$five_pct")%"
fi
if [ -n "$week_pct" ]; then
  [ -n "$rate_str" ] && rate_str="${rate_str} "
  rate_str="${rate_str}7d:$(printf '%.0f' "$week_pct")%"
fi
if [ -n "$rate_str" ]; then
  line2="${line2}$(link "https://claude.ai/settings/usage" "${MAGENTA}limits:[${rate_str}]${RESET}")"
fi

if [ -n "$vim_mode" ]; then
  line2="${line2} ${WHITE}[${vim_mode}]${RESET}"
fi

# ── LINE 3: git + PR ────────────────────────────────────────────────────────
line3=""

if [ -n "$repo" ] && [ -n "$branch" ]; then
  branch_url="https://github.com/${repo}/tree/${branch}"
  line3="${line3}$(link "$branch_url" "${BLUE}${repo}@${branch}${RESET}")"
elif [ -n "$repo" ]; then
  line3="${line3}$(link "https://github.com/${repo}" "${BLUE}${repo}${RESET}")"
elif [ -n "$branch" ]; then
  line3="${line3}${BLUE}${branch}${RESET}"
fi

# Divergence with main
divergence=$(git rev-list --left-right --count origin/main...HEAD 2>/dev/null)
if [ -n "$divergence" ]; then
  behind=$(echo "$divergence" | awk '{print $1}')
  ahead=$(echo "$divergence" | awk '{print $2}')
  div_str=""
  [ "$behind" -gt 0 ] && div_str="${div_str}${RED}↓${behind}${RESET}"
  [ "$ahead" -gt 0 ] && div_str="${div_str}${GREEN}↑${ahead}${RESET}"
  [ -z "$div_str" ] && div_str="${DIM}≡ à jour${RESET}"
  line3="${line3} ${DIM}vs main:${RESET} ${div_str}"
fi

# ── LINE 4: PR + CI ─────────────────────────────────────────────────────────
print_pr_line() {
  if [ -n "$pr_state" ]; then
    pr_label="PR#${pr_num}(${pr_state})"
  else
    pr_label="PR#${pr_num}"
  fi
  if [ -n "$pr_url" ]; then
    printf "${ESC}]8;;%s${ESC}\\\\${YELLOW}%s${RESET}${ESC}]8;;${ESC}\\\\" "$pr_url" "$pr_label"
  else
    printf "${YELLOW}%s${RESET}" "$pr_label"
  fi
  [ -n "$ci_status" ] && printf "  %s" "$ci_status"
  printf "\n"
}

# ── Output ───────────────────────────────────────────────────────────────────
[ -n "$line1" ] && printf "%s\n" "$line1"
[ -n "$line2" ] && printf "%s\n" "$line2"
[ -n "$line3" ] && printf "%s\n" "$line3"
[ -n "$pr_num" ] && print_pr_line
exit 0
