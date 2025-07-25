#!/bin/bash

# Backup Google Cloud Secrets
# Creates timestamped backup of all secret values

set -e

echo "🔐 Backing up Google Cloud secrets..."

# Create backup directory
BACKUP_DIR="./backups/secrets/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Detect current project
CURRENT_PROJECT=$(gcloud config get-value project)
echo "📍 Current project: $CURRENT_PROJECT"

# List all secrets
SECRETS=$(gcloud secrets list --format="value(name)" --project="$CURRENT_PROJECT")

if [ -z "$SECRETS" ]; then
  echo "❌ No secrets found in project $CURRENT_PROJECT"
  exit 1
fi

echo "📥 Backing up $(echo "$SECRETS" | wc -l) secrets..."

# Backup each secret
while IFS= read -r secret; do
  echo -n "  Backing up $secret... "
  
  # Get latest version
  if gcloud secrets versions access latest --secret="$secret" --project="$CURRENT_PROJECT" > "$BACKUP_DIR/$secret.txt" 2>/dev/null; then
    echo "✅"
  else
    echo "❌ Failed"
  fi
done <<< "$SECRETS"

# Create metadata file
cat > "$BACKUP_DIR/metadata.json" << EOF
{
  "project": "$CURRENT_PROJECT",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "secrets_count": $(echo "$SECRETS" | wc -l),
  "secrets": [
$(echo "$SECRETS" | awk '{printf "    \"%s\"", $0} END {print ""}' | sed 's/,$//')
  ]
}
EOF

echo ""
echo "✅ Backup complete!"
echo "📁 Location: $BACKUP_DIR"
echo ""
echo "⚠️  IMPORTANT: These backups contain sensitive data!"
echo "   - Do NOT commit to git"
echo "   - Store securely"
echo "   - Delete when no longer needed"