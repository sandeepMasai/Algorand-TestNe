# Environment Variables Documentation

This document describes all environment variables used in the Algorand Transaction Manager application.

## 📁 Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Required Variables

#### `MONGODB_URI`
- **Type**: String
- **Required**: Yes
- **Description**: MongoDB connection string
- **Examples**:
  ```bash
  # Local MongoDB
  MONGODB_URI=mongodb://127.0.0.1:27017/alog

  # MongoDB Atlas (Cloud)
  MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/alog?retryWrites=true&w=majority

  # With authentication
  MONGODB_URI=mongodb://username:password@localhost:27017/alog
  ```

### Optional Variables

#### `PORT`
- **Type**: Number
- **Required**: No
- **Default**: `5000`
- **Description**: Port number for the Express server
- **Example**:
  ```bash
  PORT=5000
  ```

#### `ALGORAND_MNEMONIC`
- **Type**: String (25 words)
- **Required**: No (can be provided in form)
- **Description**: Default 25-word Algorand mnemonic phrase for sending transactions. If not provided, users must supply mnemonic in the form.
- **Security**: ⚠️ **SENSITIVE** - Never commit this to version control
- **Example**:
  ```bash
  ALGORAND_MNEMONIC="word1 word2 word3 ... word25"
  ```
- **Note**: All 25 words must be from the official Algorand wordlist

#### `ALGOD_SERVER`
- **Type**: String (URL)
- **Required**: No
- **Default**: `https://testnet-api.algonode.cloud`
- **Description**: Algorand node server URL (TestNet or MainNet)
- **Examples**:
  ```bash
  # TestNet (default)
  ALGOD_SERVER=https://testnet-api.algonode.cloud

  # MainNet (production - use with caution)
  ALGOD_SERVER=https://mainnet-api.algonode.cloud

  # Custom node
  ALGOD_SERVER=https://your-algorand-node.com
  ```

#### `ALGOD_PORT`
- **Type**: String or Number
- **Required**: No
- **Default**: `""` (empty string)
- **Description**: Port for Algorand node (usually empty for HTTPS)
- **Examples**:
  ```bash
  # HTTPS (default)
  ALGOD_PORT=

  # Custom port
  ALGOD_PORT=443
  ```

#### `ALGOD_TOKEN`
- **Type**: String
- **Required**: No
- **Default**: `""` (empty string)
- **Description**: API token for Algorand node authentication (required for some nodes like PureStake)
- **Security**: ⚠️ **SENSITIVE** - Keep this secret
- **Example**:
  ```bash
  # Public nodes (no token needed)
  ALGOD_TOKEN=

  # Private node with authentication
  ALGOD_TOKEN=your-api-token-here
  ```

#### `CORS_ORIGINS`
- **Type**: String (comma-separated URLs)
- **Required**: No
- **Default**: `*` (all origins allowed)
- **Description**: Comma-separated list of allowed CORS origins
- **Examples**:
  ```bash
  # Allow all origins (default)
  CORS_ORIGINS=

  # Single origin
  CORS_ORIGINS=http://localhost:5173

  # Multiple origins
  CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
  ```

#### `RATE_LIMIT_WINDOW_MS`
- **Type**: Number (milliseconds)
- **Required**: No
- **Default**: `60000` (1 minute)
- **Description**: Time window for rate limiting in milliseconds
- **Example**:
  ```bash
  # 1 minute window
  RATE_LIMIT_WINDOW_MS=60000

  # 5 minute window
  RATE_LIMIT_WINDOW_MS=300000
  ```

#### `RATE_LIMIT_MAX`
- **Type**: Number
- **Required**: No
- **Default**: `60`
- **Description**: Maximum number of requests allowed per window
- **Example**:
  ```bash
  # 60 requests per minute
  RATE_LIMIT_MAX=60

  # 100 requests per minute
  RATE_LIMIT_MAX=100
  ```

## 📝 Example `.env` File

Create `backend/.env`:

```bash
# Database
MONGODB_URI=mongodb://127.0.0.1:27017/alog

# Server
PORT=5000

# Algorand Configuration
ALGORAND_MNEMONIC="your 25 word mnemonic phrase here"
ALGOD_SERVER=https://testnet-api.algonode.cloud
ALGOD_PORT=
ALGOD_TOKEN=

# Security
CORS_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

## 🔒 Security Best Practices

1. **Never commit `.env` files** to version control
2. Add `.env` to `.gitignore`:
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```
3. Use `.env.example` as a template (without sensitive values)
4. Rotate sensitive credentials regularly
5. Use environment-specific `.env` files (`.env.development`, `.env.production`)
6. For production, use secure secret management (AWS Secrets Manager, Azure Key Vault, etc.)

## 🌍 Environment-Specific Configurations

### Development
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/alog_dev
PORT=5000
CORS_ORIGINS=http://localhost:5173
```

### Production
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/alog_prod
PORT=5000
CORS_ORIGINS=https://yourdomain.com
RATE_LIMIT_MAX=30
```

## 🧪 Testing Configuration

For testing, you can use:
```bash
MONGODB_URI=mongodb://127.0.0.1:27017/alog_test
ALGOD_SERVER=https://testnet-api.algonode.cloud
# Use test mnemonic with no real funds
```

## ❓ Troubleshooting

### Variable not loading?
- Ensure `.env` file is in the `backend/` directory
- Check for typos in variable names
- Restart the server after changing `.env`
- Verify `dotenv` package is installed

### Connection errors?
- Check `MONGODB_URI` format is correct
- Verify MongoDB is running
- Test connection string with MongoDB Compass

### Algorand errors?
- Verify `ALGOD_SERVER` is accessible
- Check `ALGOD_TOKEN` if required by your node
- Ensure mnemonic is valid (25 words, correct wordlist)

---

**Remember**: Always keep sensitive values (mnemonics, tokens, passwords) out of version control!

