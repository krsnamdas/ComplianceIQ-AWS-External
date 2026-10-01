#!/usr/bin/env bash
#
# add-cognito-callback.sh
#
# Fallback helper for deployments WITHOUT a custom domain (option B in the CDK
# stack). After `cdk deploy`, this reads the stack's ALB DNS and Cognito client,
# then registers the LOWERCASE ALB callback URL on the Cognito app client so the
# OAuth redirect matches the host your browser actually sends.
#
# Not needed if you deployed with -c appDomainName=<your-domain> (option A).
#
# Usage:
#   AWS_PROFILE=<profile> AWS_REGION=<region> STACK=ComplianceIQ-nonprod \
#     ./infra/scripts/add-cognito-callback.sh
#
set -euo pipefail

: "${AWS_REGION:?set AWS_REGION, e.g. us-east-1}"
STACK="${STACK:-ComplianceIQ-nonprod}"

echo "Reading stack outputs from: $STACK ($AWS_REGION)"
ALB_DNS=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='AlbDnsName'].OutputValue" --output text)
POOL_ID=$(aws cloudformation describe-stacks --stack-name "$STACK" --region "$AWS_REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" --output text)

if [[ -z "$ALB_DNS" || -z "$POOL_ID" ]]; then
  echo "ERROR: could not read AlbDnsName / CognitoUserPoolId from stack outputs." >&2
  exit 1
fi

# Lowercase the host (the form browsers send).
ALB_LOWER=$(echo "$ALB_DNS" | tr '[:upper:]' '[:lower:]')
CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id "$POOL_ID" --region "$AWS_REGION" \
  --query "UserPoolClients[0].ClientId" --output text)

echo "ALB DNS         : $ALB_DNS"
echo "ALB (lowercase) : $ALB_LOWER"
echo "User pool       : $POOL_ID"
echo "App client      : $CLIENT_ID"

# Preserve existing callbacks, add both cases to be safe.
aws cognito-idp update-user-pool-client --region "$AWS_REGION" \
  --user-pool-id "$POOL_ID" \
  --client-id "$CLIENT_ID" \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes openid email \
  --allowed-o-auth-flows-user-pool-client \
  --supported-identity-providers COGNITO \
  --callback-urls \
    "https://${ALB_DNS}/oauth2/idpresponse" \
    "https://${ALB_LOWER}/oauth2/idpresponse" \
  --query "UserPoolClient.CallbackURLs" --output json

echo "Done. Lowercase callback registered."
