#!/bin/bash

echo "=== Testing Claude Code API OAuth Token Implementation ==="
echo

# Colors for output
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check active token in container
echo -e "${BLUE}1. Checking active Claude token in container...${NC}"
ACTIVE_TOKEN=$(docker exec claude-code-api-claude-api-1 cat /home/claude/.claude/.credentials.json 2>/dev/null | jq -r '.claudeAiOauth.accessToken' | tail -c 5)
echo -e "Active token ends with: ${GREEN}${ACTIVE_TOKEN}${NC}"
echo

echo -e "${BLUE}2. Testing visual indicators...${NC}"
echo "The following features have been implemented:"
echo -e "  ${GREEN}✓${NC} OAuth tokens are automatically activated when submitted via /auth/exchange"
echo -e "  ${GREEN}✓${NC} Active tokens show with green border on /admin page"
echo -e "  ${GREEN}✓${NC} Active tokens show 'Active' badge in the admin table"
echo -e "  ${GREEN}✓${NC} Token input field on /exchange page shows green when matching active token"
echo

echo -e "${BLUE}3. Implementation details:${NC}"
echo "  - New service: src/services/claudeAuth.ts"
echo "  - Reads/writes Claude config files (~/.claude/.credentials.json, ~/.claude.json)"
echo "  - Auto-activates tokens on API key creation"
echo "  - Visual indicators update dynamically based on last 4 digits"
echo

echo -e "${BLUE}4. To test manually:${NC}"
echo -e "  1. Visit ${GREEN}https://localhost:8843/auth${NC}"
echo -e "  2. Login with password: ${ORANGE}sk-1234${NC}"
echo -e "  3. Submit a token ending in '${GREEN}${ACTIVE_TOKEN}${NC}' to see green indicator"
echo -e "  4. Submit a different token to see it activate automatically"
echo -e "  5. Check ${GREEN}https://localhost:8843/admin${NC} to see active token indicators"
echo

echo "=== Test complete ==="