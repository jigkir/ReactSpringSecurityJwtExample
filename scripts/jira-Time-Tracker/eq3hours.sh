#!/bin/bash

clear

# ==========================================
# SINGLE SOURCE OF TRUTH FOR SPRINT DATES
# Modify dates here, and they update everywhere!
# ==========================================
get_sprint_dates() {
    local sprint="$1"
    case "$sprint" in
        S1) echo "09-09-2026 23-09-2026";;
        S2) echo "23-09-2026 07-10-2026";;
        S3) echo "08-10-2026 21-10-2026";;
        S4) echo "22-10-2026 05-11-2026";;
        S5) echo "05-11-2026 19-11-2026";;
        S6) echo "19-11-2026 02-12-2026";;
    esac
}

# Usage options:
# - S4 ./eq3hours.sh or s4 ./eq3hours.sh    -> Supports env-prefix invocation
# - ./eq3hours.sh S4 (to S6) or s4          -> Supports positional arguments anywhere
# - ./eq3hours.sh                           -> Automatically detects and uses current Sprint based on today's date!
# - WITHOUT_END=true ./eq3hours.sh          -> Uses 14-days calculation (without inclusive end date)
# - START="09/09/2026" ./eq3hours.sh          -> Supports both / and - formats
# - START="09/09/2026" END="23/09/2026" ./eq3hours.sh

# Check if WITHOUT_END is requested anywhere in the arguments
for arg in "$@"; do
    if [[ "$arg" =~ ^[Ww][Ii][Tt][Hh][Oo][Uu][Tt]_[Ee][Nn][Dd]=true$ ]] || [[ "$arg" =~ ^[Ee][Xx][Cc][Ll][Uu][Dd][Ee]_[Ee][Nn][Dd]=true$ ]]; then
        WITHOUT_END="true"
    fi
done

# Fallback to checking environment variables for WITHOUT_END if not passed as an argument
WITHOUT_END="${WITHOUT_END:-${without_end:-${EXCLUDE_END:-${exclude_end:-false}}}}"

# Filter out utility arguments so they don't break start/end parsing
ARGS=()
for arg in "$@"; do
    if [[ ! "$arg" =~ ^(WITHOUT_END|without_end|EXCLUDE_END|exclude_end)= ]]; then
        ARGS+=("$arg")
    fi
done

# Reassign positional arguments cleanly
set -- "${ARGS[@]}"

# Detect Sprint from positional arguments anywhere in $@ (e.g., ./eq3hours.sh s4)
DETECTED_SPRINT=""
CLEANED_ARGS=()

for arg in "$@"; do
    if [[ "$arg" =~ ^[Ss][1-6]$ ]]; then
        DETECTED_SPRINT="$arg"
    else
        CLEANED_ARGS+=("$arg")
    fi
done

# If not found in positional arguments, check environment variables (e.g., S4 ./eq3hours.sh sets S4="")
if [ -z "$DETECTED_SPRINT" ]; then
    for s in S1 S2 S3 S4 S5 S6 s1 s2 s3 s4 s5 s6; do
        if [ -n "${!s+x}" ]; then
            DETECTED_SPRINT="$s"
            break
        fi
    done
fi

# Auto-detect Sprint based on the current date if no sprint or custom start date was provided
if [ -z "$DETECTED_SPRINT" ] && [ -z "${START:-${start:-$1}}" ]; then
    CURRENT_DATE_EPOCH=$(date +%s)
    for s in S1 S2 S3 S4 S5 S6; do
        s_info=$(get_sprint_dates "$s")
        s_start=$(echo "$s_info" | cut -d' ' -f1)
        s_end=$(echo "$s_info" | cut -d' ' -f2)

        sd_y=$(echo "$s_start" | cut -d'-' -f3)
        sd_m=$(echo "$s_start" | cut -d'-' -f2)
        sd_d=$(echo "$s_start" | cut -d'-' -f1)
        start_epoch=$(date -d "${sd_y}-${sd_m}-${sd_d}" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "${sd_y}-${sd_m}-${sd_d}" +%s 2>/dev/null)

        ed_y=$(echo "$s_end" | cut -d'-' -f3)
        ed_m=$(echo "$s_end" | cut -d'-' -f2)
        ed_d=$(echo "$s_end" | cut -d'-' -f1)
        end_epoch=$(date -d "${ed_y}-${ed_m}-${ed_d}" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "${ed_y}-${ed_m}-${ed_d}" +%s 2>/dev/null)

        if [ -n "$start_epoch" ] && [ -n "$end_epoch" ]; then
            if [ "$CURRENT_DATE_EPOCH" -ge "$start_epoch" ] && [ "$CURRENT_DATE_EPOCH" -le "$end_epoch" ]; then
                DETECTED_SPRINT="$s"
                echo "Auto-detected current sprint: $DETECTED_SPRINT ($s_start to $s_end)"
                break
            fi
        fi
    done
fi

# Reassign cleaned positional arguments (excluding the sprint argument)
set -- "${CLEANED_ARGS[@]}"

# Normalize sprint identifier to uppercase (supports S1-S6 and s1-s6)
ARG_UPPER=$(echo "$DETECTED_SPRINT" | tr '[:lower:]' '[:upper:]')

# Main Sprint Date Mapping using the centralized function
case "$ARG_UPPER" in
    S1|S2|S3|S4|S5|S6)
        s_info=$(get_sprint_dates "$ARG_UPPER")
        START_DATE=$(echo "$s_info" | cut -d' ' -f1)
        END_DATE=$(echo "$s_info" | cut -d' ' -f2)
        ;;
    *)
        # Fallback to standard environment variables or custom positional arguments
        RAW_START="${START:-${start:-$1}}"

        # If no start date is provided via env vars or arguments, default to today's date
        if [ -z "$RAW_START" ]; then
            START_DATE=$(date "+%d-%m-%Y")
        else
            # Normalize slashes to hyphens (e.g., 09/09/2026 -> 09-09-2026)
            START_DATE=$(echo "$RAW_START" | tr '/' '-')
        fi

        RAW_END="${END:-${end:-$2}}"

        # Determine END_DATE if not explicitly provided
        if [ -n "$RAW_END" ]; then
            END_DATE=$(echo "$RAW_END" | tr '/' '-')
        else
            # Parse dd-mm-yyyy to yyyy-mm-dd for calculation
            DAY=$(echo "$START_DATE" | cut -d'-' -f1)
            MONTH=$(echo "$START_DATE" | cut -d'-' -f2)
            YEAR=$(echo "$START_DATE" | cut -d'-' -f3)

            # Check boolean flag: if true, use +14 days (exclusive), otherwise use +13 days (inclusive, default)
            if [ "$WITHOUT_END" = "true" ]; then
                OFFSET="14 days"
                FLAG_VAL="-v+14d"
            else
                OFFSET="13 days"
                FLAG_VAL="-v+13d"
            fi

            # Calculate date (Works on GNU date / Linux)
            END_DATE=$(date -d "${YEAR}-${MONTH}-${DAY} + $OFFSET" "+%d-%m-%Y" 2>/dev/null)

            # macOS / BSD date fallback if GNU date fails
            if [ $? -ne 0 ] || [ -z "$END_DATE" ]; then
                END_DATE=$(date -j -f "%Y-%m-%d" "${YEAR}-${MONTH}-${DAY}" "+%d-%m-%Y" $FLAG_VAL 2>/dev/null)
            fi
        fi
        ;;
esac

if [ -z "$END_DATE" ]; then
   echo "Error: Failed to determine END_DATE. Ensure dates are formatted as dd-mm-yyyy or dd/mm/yyyy."
   exit 1
fi

echo "Running query from $START_DATE to $END_DATE..."

# Fetches ALL worklogs straight from the Jira API (paginated).
export JIRA_TOKEN="${JIRA_TOKEN:-ATATT3xFfGF0p4s2EPvCAh6qXxT9lkY_0Y6k1Ke4V7V8ij9VQRvEtAKJoWxIi9BvjnCB_zJ5nr88l3EvEDDyLQ2F6rWW9WKJAvdooGMO_OWb0tr9ONlnSnk8WHhmTdIfMNMUG8kTPg5pW0Aeia0-5d1vKT3ZujStdOxemFusiLASSAnl0Ma8zbQ=0245D906}"
JAVA_OUTPUT=$(python3 - 420567a26e3 EQ3 "$START_DATE" "$END_DATE" dohaelk005@gmail.com <<'PYEOF'
"""Fetch ALL Jira worklogs (paginated issues + full per-issue worklogs).
Usage: jira_hours.py SITE PROJECT START(dd-mm-yyyy) END(dd-mm-yyyy) EMAIL
Token is read from env JIRA_TOKEN. END day is inclusive.
Set USE_CREATED=1 to date logs by creation time instead of 'started'."""
import sys, os, json, base64, urllib.request, urllib.parse
from datetime import datetime, timedelta
from collections import defaultdict

site, project, start_s, end_s, email = sys.argv[1:6]
token = os.environ.get("JIRA_TOKEN")
if not token:
    sys.exit("Error: set JIRA_TOKEN env variable")
site = site.replace("https://", "").replace(".atlassian.net", "").strip("/")
base = f"https://{site}.atlassian.net/rest/api/3"
auth = "Basic " + base64.b64encode(f"{email}:{token}".encode()).decode()
start = datetime.strptime(start_s, "%d-%m-%Y")
end = datetime.strptime(end_s, "%d-%m-%Y") + timedelta(days=1)  # inclusive end day
date_field = "created" if os.environ.get("USE_CREATED") else "started"

def get(path, params):
    url = f"{base}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": auth, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def adf_text(node):
    if isinstance(node, dict):
        if node.get("type") == "text":
            return node.get("text", "")
        return " ".join(t for t in (adf_text(c) for c in node.get("content", [])) if t)
    if isinstance(node, list):
        return " ".join(t for t in (adf_text(c) for c in node) if t)
    return ""

def parse_dt(s):  # keep Jira's local wall-clock time, drop offset
    return datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S")

def fmt_secs(sec):
    h, m = divmod(sec // 60, 60)
    return " ".join(p for p in (f"{h}h" if h else "", f"{m}m" if m else "") if p) or "0m"

# 1) all issues with worklogs in range (padded 1 day for timezone safety), paginated
jql = (f'project = "{project}" AND worklogDate >= "{(start - timedelta(days=1)):%Y-%m-%d}" '
       f'AND worklogDate <= "{(end + timedelta(days=1)):%Y-%m-%d}"')
issues, token_next = [], None
while True:
    p = {"jql": jql, "maxResults": 5000, "fields": "summary,parent"}
    if token_next:
        p["nextPageToken"] = token_next
    d = get("/search/jql", p)
    issues += d.get("issues", [])
    token_next = d.get("nextPageToken")
    if not token_next or d.get("isLast"):
        break

# 2) full worklogs per issue (paginated)
by_user = defaultdict(list)
for iss in issues:
    f = iss["fields"]
    summ = f["summary"]
    if f.get("parent"):
        summ = f["parent"]["fields"]["summary"] + " " + summ
    at = 0
    while True:
        w = get(f"/issue/{iss['key']}/worklog", {"startAt": at, "maxResults": 1000})
        for wl in w["worklogs"]:
            t = parse_dt(wl[date_field])
            if not (start <= t < end):
                continue
            by_user[wl["author"]["displayName"]].append(
                (t, iss["key"], wl["timeSpentSeconds"], summ, adf_text(wl.get("comment")) or "--- EMPTY COMMENT ---"))
        at += len(w["worklogs"])
        if not w["worklogs"] or at >= w["total"]:
            break

for user in sorted(by_user):
    print(user)
    tot = 0
    for t, key, sec, summ, com in sorted(by_user[user]):
        tot += sec
        print(f"        {key:<9} {fmt_secs(sec):<7} {t:%d-%m-%Y %H:%M} {summ:<130} {com}")
    print(f"Total time : {fmt_secs(tot)} \n")
PYEOF
)

# Pipe output to AWK for stream-processing and hours aggregation
echo "$JAVA_OUTPUT" | awk '
BEGIN {
    total_minutes = 0
    current_name = ""
}
{
    print $0

    # Detect person headers (lines with no leading spaces containing a first and last name)
    if ($0 ~ /^[A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+/) {
        current_name = $0
        gsub(/^[ \t]+|[ \t]+$/, "", current_name)
    }

    # Process work log lines containing an issue key
    if ($0 ~ /EQ3-[0-9]+/) {
        hours = 0
        mins = 0

        if (match($0, /[0-9]+h/)) {
            h_str = substr($0, RSTART, RLENGTH)
            gsub(/h/, "", h_str)
            hours = h_str + 0
        }

        if (match($0, /[0-9]+m/)) {
            m_str = substr($0, RSTART, RLENGTH)
            gsub(/m/, "", m_str)
            mins = m_str + 0
        }

        line_mins = (hours * 60) + mins
        total_minutes += line_mins

        if (current_name != "") {
            user_minutes[current_name] += line_mins
        }
    }
}
END {
    print "----------------------------------------"
    print "HOURS PER PERSON:"
    print "----------------------------------------"
    for (name in user_minutes) {
        u_mins = user_minutes[name]
        printf "%s: %dh %dm\n", name, int(u_mins / 60), u_mins % 60
    }

    TOTAL_HOURS = total_minutes / 60.0
    TOTAL_MIN = total_minutes

    print "----------------------------------------"
    printf "TOTAL HOURS: %.2f h (%dh %dm)\n", TOTAL_HOURS, int(TOTAL_MIN / 60), TOTAL_MIN % 60
    print "----------------------------------------"
}
'