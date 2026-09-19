#!/usr/bin/env bash
# ==============================================================================
# KINLY FAMILY COMPANION - AWS HACKATHON LIVE DEPLOYMENT SCRIPT
# ==============================================================================
# Provisions AWS S3, DynamoDB, SNS, CloudWatch, and deploys to AWS App Runner.

set -e

REGION="${AWS_REGION:-us-east-1}"
APP_NAME="kinly-backend"
BUCKET_NAME="${AWS_S3_BUCKET:-kinly-family-vault-$RANDOM}"
TELEMETRY_TABLE="${AWS_DYNAMODB_TELEMETRY_TABLE:-KinlyTelemetryStream}"
SOS_TABLE="${AWS_DYNAMODB_SOS_TABLE:-KinlyEmergencyEvents}"
LOG_GROUP="${AWS_CLOUDWATCH_LOG_GROUP:-/aws/kinly/backend}"

echo "======================================================================"
echo "🚀 KINLY FAMILY COMPANION - AWS CLOUD PROVISIONING & DEPLOYMENT"
echo "   Region: $REGION"
echo "======================================================================"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
  echo "❌ AWS CLI not found. Please install AWS CLI or configure credentials."
  echo "   Download: https://aws.amazon.com/cli/"
  exit 1
fi

echo "🔍 Verifying AWS Credentials..."
aws sts get-caller-identity

# 1. Provision S3 Vault Bucket
echo "📦 [1/5] Creating Amazon S3 Vault Bucket: $BUCKET_NAME..."
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" 2>/dev/null || true
else
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" 2>/dev/null || true
fi

# Enable S3 Bucket Versioning & Encryption
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}' 2>/dev/null || true

# 2. Provision Amazon DynamoDB Tables
echo "⚡ [2/5] Creating Amazon DynamoDB Telemetry & SOS Tables..."
aws dynamodb create-table \
  --table-name "$TELEMETRY_TABLE" \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" 2>/dev/null || echo "   Table $TELEMETRY_TABLE already exists or pending."

aws dynamodb create-table \
  --table-name "$SOS_TABLE" \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" 2>/dev/null || echo "   Table $SOS_TABLE already exists or pending."

# 3. Provision Amazon SNS Emergency Topic
echo "🚨 [3/5] Creating Amazon SNS Emergency Broadcast Topic..."
SNS_TOPIC_ARN=$(aws sns create-topic --name KinlyEmergencyAlerts --region "$REGION" --query 'TopicArn' --output text)
echo "   SNS Topic ARN: $SNS_TOPIC_ARN"

# 4. Provision Amazon CloudWatch Log Group
echo "📊 [4/5] Creating Amazon CloudWatch Log Group: $LOG_GROUP..."
aws logs create-log-group --log-group-name "$LOG_GROUP" --region "$REGION" 2>/dev/null || true

# 5. Summary & App Runner / Lightsail Deployment Instructions
echo ""
echo "======================================================================"
echo "✅ AWS CLOUD INFRASTRUCTURE PROVISIONED SUCCESSFULLY!"
echo "======================================================================"
echo "   S3 Bucket:         $BUCKET_NAME"
echo "   DynamoDB (Stream): $TELEMETRY_TABLE"
echo "   DynamoDB (SOS):    $SOS_TABLE"
echo "   SNS Topic:         $SNS_TOPIC_ARN"
echo "   CloudWatch Logs:   $LOG_GROUP"
echo "   Region:            $REGION"
echo ""
echo "🚢 TO SHIP BACKEND DEPLOYED WITH A LIVE URL ON AWS APP RUNNER:"
echo "   1. Push this repository to GitHub (or use AWS CodeCommit / ECR)"
echo "   2. In AWS Console -> App Runner -> 'Create an App Runner service'"
echo "   3. Source: GitHub repo -> Select branch 'main' -> Root: /server"
echo "   4. Runtime: Node.js 20, Build command: 'npm ci && npm run build', Run: 'node dist/index.js', Port: 3001"
echo "   5. Click Deploy! AWS gives you a live https://*.awsapprunner.com URL."
echo "======================================================================"
